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

print("=== PostgreSQL WAL archiving durumu ===")
sql_wal = "SHOW wal_level; SHOW archive_mode; SHOW archive_command;"
print(run(f"docker exec -i ecom-postgres-1 psql -U ecom -d EcomDb -c \"{sql_wal}\"", timeout=15))

print("\n=== Sunucuda pg_dump backup dosyalari ===")
print(run("find /opt /root /home /var/backups -name '*.sql' -o -name '*.dump' -o -name '*.pgdump' 2>/dev/null | head -20", timeout=15))

print("\n=== /opt/ecom altinda backup var mi ===")
print(run("find /opt/ecom -name '*backup*' -o -name '*dump*' 2>/dev/null | head -20", timeout=15))

print("\n=== Docker volume backup ===")
print(run("ls -la /var/lib/docker/volumes/ 2>/dev/null | head -20", timeout=15))

print("\n=== Son degistirilen 5 ProductImages kaydi (ornek) ===")
sql = """
SELECT "Id", "ImageUrl", "UpdatedDate"
FROM "ProductImages"
WHERE "IsDeleted" = false
  AND "UpdatedDate" > NOW() - INTERVAL '24 hours'
  AND "ImageUrl" = 'https://images.autoforcepart.com/static/autoforcepart-no-image.png'
ORDER BY "UpdatedDate" DESC
LIMIT 5;
"""
sftp = client.open_sftp()
with sftp.open('/tmp/check_sample.sql', 'w') as f:
    f.write(sql)
sftp.close()
print(run("docker exec -i ecom-postgres-1 psql -U ecom -d EcomDb < /tmp/check_sample.sql", timeout=30))

client.close()
