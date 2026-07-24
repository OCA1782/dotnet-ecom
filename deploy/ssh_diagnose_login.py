# -*- coding: utf-8 -*-
"""Login 500 hatasını teşhis eder: ErrorLogs tablosu + docker logs + live login test."""
import os, sys, json
import paramiko

sys.stdout.reconfigure(encoding='utf-8')

host     = os.environ['DEPLOY_SSH_HOST']
user     = os.environ['DEPLOY_SSH_USER']
password = os.environ['DEPLOY_SSH_PASSWORD']

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run(cmd, timeout=30):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()

pg_user = run("grep POSTGRES_USER /opt/ecom/.env | cut -d= -f2-").strip()
pg_db   = run("grep POSTGRES_DB   /opt/ecom/.env | cut -d= -f2-").strip() or "EcomDb"

def psql(query):
    return run(
        f'docker exec ecom-postgres-1 psql -U {pg_user} -d {pg_db} -c "{query}" 2>&1'
    )

print("=== 1. Son 5 API log satırı ===")
print(run("docker logs ecom-api-1 --tail 30 2>&1", timeout=20))

print("\n=== 2. ErrorLogs tablosu (son 5 kayıt) ===")
result = psql(
    'SELECT "Level", "Message", "ExceptionType", "Path", "CreatedAt" '
    'FROM "ErrorLogs" ORDER BY "CreatedAt" DESC LIMIT 5;'
)
print(result)

print("\n=== 3. AuditLogs tablosu erişimi ===")
print(psql('SELECT COUNT(*) FROM "AuditLogs";'))

print("\n=== 4. Users tablosu — admin ===")
print(psql(
    'SELECT "Id", "Email", "IsActive", "IsDeleted", "TwoFactorEnabled", '
    '"FailedLoginCount", "LockoutUntil", "LastLoginDate" '
    'FROM "Users" WHERE "Email" LIKE \'%admin%\' LIMIT 3;'
))

print("\n=== 5. UserRoles tablosu — admin ===")
print(psql(
    'SELECT ur."UserId", ur."Role" FROM "UserRoles" ur '
    'JOIN "Users" u ON u."Id" = ur."UserId" WHERE u."Email" LIKE \'%admin%\';'
))

print("\n=== 6. PostgreSQL schema — Users timestamp kolonları ===")
print(psql(
    "SELECT column_name, data_type FROM information_schema.columns "
    "WHERE table_name='Users' AND table_schema='public' "
    "AND (data_type LIKE '%timestamp%' OR data_type LIKE '%date%') "
    "ORDER BY ordinal_position;"
))

print("\n=== 7. Live login testi ===")
seed_email = run("grep SEED_ADMIN_EMAIL /opt/ecom/.env | cut -d= -f2-").strip()
seed_pass  = run("grep SEED_ADMIN_PASSWORD /opt/ecom/.env | cut -d= -f2-").strip()
print(f"  Email: {seed_email}")
login_result = run(
    f"curl -s -w '\\n--- HTTP_CODE: %{{http_code}} ---' "
    f"-X POST http://localhost:15124/api/auth/login "
    f"-H 'Content-Type: application/json' "
    f"-d '{{\"email\":\"{seed_email}\",\"password\":\"{seed_pass}\"}}' 2>&1",
    timeout=15
)
print(f"  Sonuç: {login_result[:500]}")

print("\n=== 8. Ecom-api-1 environment kontrolü ===")
print(run("docker inspect ecom-api-1 --format '{{range .Config.Env}}{{.}}\\n{{end}}' | grep -E 'Npgsql|ECOM_LICENSE|DATABASE|ASPNET' 2>&1"))

client.close()
print("\n=== TAMAMLANDI ===")
