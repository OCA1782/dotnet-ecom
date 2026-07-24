# -*- coding: utf-8 -*-
"""ErrorLogs tablosu + son API logları."""
import os, sys
import paramiko

sys.stdout.reconfigure(encoding='utf-8')

host     = os.environ['DEPLOY_SSH_HOST']
user     = os.environ['DEPLOY_SSH_USER']
password = os.environ['DEPLOY_SSH_PASSWORD']

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run(cmd, timeout=30):
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    return (stdout.read() + stderr.read()).decode('utf-8', errors='replace').strip()

pg_user = run("grep POSTGRES_USER /opt/ecom/.env | cut -d= -f2-")
pg_db   = run("grep POSTGRES_DB   /opt/ecom/.env | cut -d= -f2-") or "EcomDb"

print("=== Docker API logs (son 40 satir) ===")
print(run("docker logs ecom-api-1 --tail 40 2>&1", timeout=20))

print("\n=== PostgreSQL ErrorLogs (son 10) ===")
print(run(
    f'docker exec ecom-postgres-1 psql -U {pg_user} -d {pg_db} -c '
    f'"SELECT \'Level:\' || \\"Level\\" || \' | \' || \\"ExceptionType\\" || \' | \' || \\"Message\\" || \' | \' || \\"Path\\" '
    f'FROM \\"ErrorLogs\\" ORDER BY \\"CreatedAt\\" DESC LIMIT 10;" 2>&1'
))

print("\n=== Users tablosu (admin) ===")
print(run(
    f'docker exec ecom-postgres-1 psql -U {pg_user} -d {pg_db} -c '
    f'"SELECT \\"Email\\", \\"IsActive\\", \\"TwoFactorEnabled\\", \\"FailedLoginCount\\", \\"LockoutUntil\\" '
    f'FROM \\"Users\\" WHERE \\"Email\\" LIKE \'%admin%\';" 2>&1'
))

client.close()
