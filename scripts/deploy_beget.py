import os
import paramiko
import stat
from pathlib import Path

host = "e928145n.beget.tech"
user = "e928145n"
password = os.environ.get("BEGET_PASSWORD", "")
if not password:
    raise SystemExit("Set BEGET_PASSWORD env var")
local_root = Path(r"C:\Users\anton\OneDrive\Рабочий стол\Cursor\Ежедневник\dist")

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
    # common Beget layouts
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


uploaded = 0
for path in local_root.rglob("*"):
    if path.is_dir():
        continue
    rel = path.relative_to(local_root).as_posix()
    remote = f"{remote_root}/{rel}"
    ensure_dir(str(Path(remote).parent).replace("\\", "/"))
    sftp.put(str(path), remote)
    uploaded += 1
    print("put", rel)

print(f"DONE uploaded={uploaded} -> {remote_root}")
sftp.close()
client.close()
