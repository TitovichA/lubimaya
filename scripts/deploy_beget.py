import os
import paramiko
import stat
from pathlib import Path

host = "e928145n.beget.tech"
user = "e928145n"
password = os.environ.get("BEGET_PASSWORD", "")
if not password:
    pw_file = Path(__file__).with_name(".beget_pw")
    if pw_file.exists():
        password = pw_file.read_text(encoding="utf-8").strip()
if not password:
    raise SystemExit("Set BEGET_PASSWORD env var or scripts/.beget_pw")

root = Path(__file__).resolve().parents[1]
local_root = root / "dist"
api_local = root / "server" / "api"
env_example = root / "server" / ".env.example"
htaccess_local = root / "scripts" / "beget.htaccess"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(
    host,
    username=user,
    password=password,
    port=22,
    timeout=30,
    allow_agent=False,
    look_for_keys=False,
)
print("SFTP OK")
sftp = client.open_sftp()
print("cwd", sftp.getcwd())
print("root:", sftp.listdir("."))

candidates = []


def walk(path: str, depth: int = 0) -> None:
    if depth > 3:
        return
    try:
        for name in sftp.listdir(path):
            full = name if path in (".", "") else f"{path.rstrip('/')}/{name}"
            try:
                st = sftp.stat(full)
                if stat.S_ISDIR(st.st_mode):
                    if name == "public_html":
                        candidates.append(full)
                    walk(full, depth + 1)
            except Exception:
                pass
    except Exception as e:
        print("list fail", path, e)


walk(".")
print("public_html candidates:", candidates)

remote_root = candidates[0] if candidates else None
if not remote_root:
    for guess in [
        "e928145n.beget.tech/public_html",
        "public_html",
        f"{user}.beget.tech/public_html",
    ]:
        try:
            sftp.stat(guess)
            remote_root = guess
            break
        except Exception:
            pass

if not remote_root:
    raise SystemExit("public_html not found")

print("using remote:", remote_root)
site_root = remote_root.rsplit("/", 1)[0] if "/" in remote_root else "."


def ensure_dir(path: str) -> None:
    parts = path.replace("\\", "/").split("/")
    cur = ""
    for part in parts:
        if not part:
            continue
        cur = f"{cur}/{part}" if cur else part
        try:
            sftp.stat(cur)
        except FileNotFoundError:
            sftp.mkdir(cur)


def put_file(local: Path, remote: str) -> None:
    ensure_dir(str(Path(remote).parent).replace("\\", "/"))
    sftp.put(str(local), remote)
    print("put", remote)


uploaded = 0
for path in local_root.rglob("*"):
    if path.is_dir():
        continue
    rel = path.relative_to(local_root).as_posix()
    remote = f"{remote_root}/{rel}"
    put_file(path, remote)
    uploaded += 1

# API PHP
for path in api_local.rglob("*"):
    if path.is_dir():
        continue
    rel = path.relative_to(api_local).as_posix()
    put_file(path, f"{remote_root}/api/{rel}")
    uploaded += 1

# SPA rewrite + secret protection
put_file(htaccess_local, f"{remote_root}/.htaccess")
uploaded += 1

# .env only if missing — never overwrite existing secrets
remote_env = f"{site_root}/.env"
try:
    sftp.stat(remote_env)
    print("keep existing", remote_env)
except FileNotFoundError:
    put_file(env_example, remote_env)
    print("CREATED", remote_env, "— смените APP_LOGIN / APP_PASSWORD!")

# example for reference inside public_html (safe)
put_file(env_example, f"{remote_root}/.env.example")

print(f"DONE uploaded={uploaded} -> {remote_root}")
print(f"Secrets path: {remote_env}")
sftp.close()
client.close()
