#!/usr/bin/env python3
"""Run once as root on ray-tx. Pipe stdout directly to gh secret set; it is a token."""
import base64
import hashlib
import json
import os
from pathlib import Path
import pwd
import secrets
import subprocess

project = "portal-b-day"
user = pwd.getpwnam("deploy-bday")
config_path = Path("/etc/k3s-http-deployer/config.json")
config = json.loads(config_path.read_text())
if project in config["projects"]:
    raise SystemExit("B-Day already registered; refusing to rotate its token implicitly")

def kubectl(*args):
    return subprocess.check_output(["/usr/local/bin/kubectl", *args], text=True)

secret = json.loads(kubectl("get", "secret", "portal-b-day-deployer-token", "-o", "json"))["data"]
cluster = json.loads(kubectl("config", "view", "--raw", "--minify", "-o", "json"))["clusters"][0]["cluster"]
kubeconfig = {
    "apiVersion": "v1", "kind": "Config",
    "clusters": [{"name": "k3s", "cluster": {"server": cluster["server"], "certificate-authority-data": secret["ca.crt"]}}],
    "users": [{"name": project, "user": {"token": base64.b64decode(secret["token"]).decode()}}],
    "contexts": [{"name": project, "context": {"cluster": "k3s", "user": project, "namespace": "default"}}],
    "current-context": project,
}
directory = Path(user.pw_dir) / ".kube"
directory.mkdir(mode=0o700, exist_ok=True)
os.chown(directory, user.pw_uid, user.pw_gid)
path = directory / "config"
fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
with os.fdopen(fd, "w") as stream:
    json.dump(kubeconfig, stream)
os.chown(path, user.pw_uid, user.pw_gid)

token = secrets.token_urlsafe(48)
config["projects"][project] = {"token_sha256": hashlib.sha256(token.encode()).hexdigest()}
temporary = config_path.with_suffix(".bday-new")
fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o640)
with os.fdopen(fd, "w") as stream:
    json.dump(config, stream, indent=2)
    stream.write("\n")
os.chown(temporary, config_path.stat().st_uid, config_path.stat().st_gid)
os.replace(temporary, config_path)
print(token)
