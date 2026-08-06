import os
import sys
from pathlib import Path

import paramiko

host = "e928145n.beget.tech"
user = "e928145n"

passwords = []
if len(sys.argv) > 1:
    passwords.append(sys.argv[1])
env_pw = os.environ.get("BEGET_PASSWORD")
if env_pw:
    passwords.append(env_pw)
pw_file = Path(__file__).with_name(".beget_pw")
if pw_file.exists():
    passwords.append(pw_file.read_text(encoding="utf-8").strip())

seen = set()
unique = []
for p in passwords:
    if p and p not in seen:
        seen.add(p)
        unique.append(p)

if not unique:
    raise SystemExit("No password provided")

for password in unique:
    print(f"try len={len(password)} chars={list(password)!r}")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(
            host,
            username=user,
            password=password,
            port=22,
            timeout=30,
            allow_agent=False,
            look_for_keys=False,
        )
        print("SSH OK with this password")
        sftp = client.open_sftp()
        print("listdir:", sftp.listdir("."))
        sftp.close()
        client.close()
        Path(__file__).with_name(".beget_pw").write_text(password, encoding="utf-8")
        break
    except Exception as e:
        print("FAIL", type(e).__name__, e)
