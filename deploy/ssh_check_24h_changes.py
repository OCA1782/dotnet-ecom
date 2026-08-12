# -*- coding: utf-8 -*-
import os, sys
import paramiko

sys.stdout.reconfigure(encoding='utf-8')

_local_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(_local_env):
    with open(_local_env, encoding='utf-8') as _f:
        for _line in _f:
            _line = _line.strip()
            if '=' in _line and not _line.startswith('#'):
                _k, _, _v = _line.partition('=')
                if _k.strip() not in os.environ:
                    os.environ[_k.strip()] = _v.strip()

host = os.environ['DEPLOY_SSH_HOST']
user = os.environ['DEPLOY_SSH_USER']
password = os.environ['DEPLOY_SSH_PASSWORD']

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run(cmd, timeout=60):
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()

NO_IMAGE = 'https://images.autoforcepart.com/static/autoforcepart-no-image.png'

# Write SQL to a temp file on server to avoid quoting issues
sql = f"""
SELECT
  COUNT(*) AS total_changed,
  COUNT(*) FILTER (WHERE "ImageUrl" = '{NO_IMAGE}') AS changed_to_noimage,
  MIN("UpdatedDate") AS earliest,
  MAX("UpdatedDate") AS latest
FROM "ProductImages"
WHERE "IsDeleted" = false
  AND "UpdatedDate" > NOW() - INTERVAL '24 hours';

SELECT DATE_TRUNC('hour', "UpdatedDate") AS hour, COUNT(*) AS total,
  COUNT(*) FILTER (WHERE "ImageUrl" = '{NO_IMAGE}') AS noimage
FROM "ProductImages"
WHERE "IsDeleted" = false AND "UpdatedDate" > NOW() - INTERVAL '24 hours'
GROUP BY 1 ORDER BY 1;

SELECT
  COUNT(*) FILTER (WHERE "ImageUrl" = '{NO_IMAGE}') AS no_image,
  COUNT(*) FILTER (WHERE "ImageUrl" LIKE 'https://images.autoforcepart.com/products/%') AS r2_product,
  COUNT(*) FILTER (WHERE "ImageUrl" NOT LIKE 'https://images.autoforcepart.com/%') AS other_cdn
FROM "ProductImages" WHERE "IsDeleted" = false;
"""

sftp = client.open_sftp()
with sftp.open('/tmp/check_24h.sql', 'w') as f:
    f.write(sql)
sftp.close()

print("=== Son 24 saatte degistirilen ProductImages ===")
print(run("docker exec -i ecom-postgres-1 psql -U ecom -d EcomDb < /tmp/check_24h.sql", timeout=60))

client.close()
