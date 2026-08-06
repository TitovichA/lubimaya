import os
import traceback

import paramiko

host = "e928145n.beget.tech"
user = "e928145n"
password = os.environ.get("BEGET_PASSWORD", "")
if not password:
    raise SystemExit("Set BEGET_PASSWORD")

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
    print("SSH OK")
    _, stdout, stderr = client.exec_command("pwd; ls -la; echo DONE")
    print(stdout.read().decode(errors="replace"))
    err = stderr.read().decode(errors="replace")
    if err:
        print("stderr:", err)
    sftp = client.open_sftp()
    print("listdir:", sftp.listdir("."))
    sftp.close()
    client.close()
except Exception:
    traceback.print_exc()
