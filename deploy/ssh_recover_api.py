# -*- coding: utf-8 -*-
import os, sys, time
import paramiko

sys.stdout.reconfigure(encoding='utf-8')

host = os.environ['DEPLOY_SSH_HOST']
user = os.environ['DEPLOY_SSH_USER']
password = os.environ['DEPLOY_SSH_PASSWORD']

# PostgreSQL credentials — dev server
PG_USER = os.environ['POSTGRES_USER']
PG_PASS = os.environ['POSTGRES_PASSWORD']
PG_DB   = os.environ.get('POSTGRES_DB', 'EcomDb')
PG_CONN = f"Host=postgres;Port=5432;Database={PG_DB};Username={PG_USER};Password={PG_PASS};SSL Mode=Disable;"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run(cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()

# 1. API crash loop durdur
print("=== 1. API crash loop durduruluyor ===")
print(run("docker stop ecom-api-1 && docker rm ecom-api-1 || true", timeout=30))

# 2. .env'e POSTGRES_USER/PASSWORD ekle (mevcut girislere ekleme)
print("\n=== 2. .env guncelleniyor ===")
# Once mevcut .env oku
current_env = run("cat /opt/ecom/.env")
print("Mevcut .env anahtarlari:", [l.split('=')[0] for l in current_env.splitlines() if '=' in l])

env_additions = []
if 'POSTGRES_USER' not in current_env:
    env_additions.append(f'POSTGRES_USER={PG_USER}')
if 'POSTGRES_PASSWORD' not in current_env:
    env_additions.append(f'POSTGRES_PASSWORD={PG_PASS}')

for line in env_additions:
    print(run(f"echo '{line}' >> /opt/ecom/.env"))
    print(f"  Eklendi: {line.split('=')[0]}")

# 3. PostgreSQL container'i baslat
print("\n=== 3. PostgreSQL baslatiliyor ===")
# docker compose interpolation artik calismali (POSTGRES_USER/PASS .env'de)
r = run("cd /opt/ecom && docker compose up -d postgres 2>&1", timeout=60)
print(r)

# PostgreSQL'in hazir olmasini bekle
print("\nPostgreSQL hazir olana kadar bekleniyor...")
for i in range(18):  # max 90 saniye
    time.sleep(5)
    status = run("docker inspect ecom-postgres-1 --format '{{.State.Health.Status}}' 2>/dev/null || echo 'not_found'")
    print(f"  {i*5+5}s: {status}")
    if status == 'healthy':
        break

# 4. API'yi dogru env ile baslat
print("\n=== 4. API yeniden baslatiliyor ===")

# .env'den diger gerekli degerleri oku
def read_env_var(var):
    return run(f"grep '^{var}=' /opt/ecom/.env | cut -d= -f2-").strip()

jwt_key         = read_env_var('JWT_KEY')
seed_email      = read_env_var('SEED_ADMIN_EMAIL')
seed_pass       = read_env_var('SEED_ADMIN_PASSWORD')
allowed_0       = read_env_var('ALLOWED_ORIGIN_0')
allowed_1       = read_env_var('ALLOWED_ORIGIN_1')
rabbitmq_user   = read_env_var('RABBITMQ_USERNAME')
rabbitmq_pass   = read_env_var('RABBITMQ_PASSWORD')
ecom_license    = read_env_var('ECOM_LICENSE')
ecom_pub_key    = read_env_var('ECOM_PUBLIC_KEY')
license_url     = read_env_var('LICENSE_ACTIVATION_URL')
cloudinary_url  = read_env_var('CLOUDINARY_URL')
storage_url     = read_env_var('STORAGE_PUBLIC_BASE_URL')
github_token    = read_env_var('GITHUB_TOKEN')
aspnet_env      = read_env_var('ASPNETCORE_ENVIRONMENT')
licence_key     = read_env_var('LICENCE_SERVICE_KEY')
host_ip         = read_env_var('DOCKER_HOST_IP') or '127.0.0.1'
network_name    = run("docker inspect ecom-rabbitmq-1 --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}'").strip()

run_cmd = (
    f"docker run -d --name ecom-api-1 "
    f"--network {network_name} "
    f"-p {host_ip}:15124:8080 "
    f"-v uploads:/app/wwwroot/uploads "
    f"-v docs:/app/docs "
    f"-v /opt/ecom/.git:/app/.git:ro "
    f"--add-host host.docker.internal:host-gateway "
    f"--restart unless-stopped "
    f'-e "ASPNETCORE_ENVIRONMENT={aspnet_env}" '
    f'-e "ConnectionStrings__PostgreSQL={PG_CONN}" '
    f'-e "ConnectionStrings__Redis=redis:6379" '
    f'-e "Database__Provider=PostgreSQL" '
    f'-e "Jwt__Key={jwt_key}" '
    f'-e "Jwt__Issuer=EcomAPI" '
    f'-e "Jwt__Audience=EcomClient" '
    f'-e "Seed__AdminEmail={seed_email}" '
    f'-e "Seed__AdminPassword={seed_pass}" '
    f'-e "AllowedOrigins__0={allowed_0}" '
    f'-e "AllowedOrigins__1={allowed_1}" '
    f'-e "RabbitMQ__Host=rabbitmq" '
    f'-e "RabbitMQ__Username={rabbitmq_user}" '
    f'-e "RabbitMQ__Password={rabbitmq_pass}" '
    f'-e "ECOM_LICENSE={ecom_license}" '
    f'-e "ECOM_PUBLIC_KEY={ecom_pub_key}" '
    f'-e "LICENSE_ACTIVATION_URL={license_url}" '
    f'-e "LicenceService__BaseUrl=http://ecom-licence-1:8080" '
    f'-e "LICENCE_SERVICE_KEY={licence_key}" '
    f'-e "Cloudinary__Url={cloudinary_url}" '
    f'-e "Storage__PublicBaseUrl={storage_url}" '
    f'-e "FrontendUrls__CustomerUrl=http://ecom-customer-1:3000" '
    f'-e "FrontendUrls__AdminUrl=http://ecom-admin-1:3001" '
    f'-e "Docs__LocalPath=/app/docs" '
    f'-e "GitHub__Token={github_token}" '
    f'-e "GitHub__Owner=OCA1782" '
    f'-e "GitHub__Repo=dotnet-ecom-docs" '
    f'-e "GitHub__DocsPath=" '
    f"ecom-api-new:latest"
)

print(f"Calistiriliyor (env gizli)...")
result = run(run_cmd, timeout=30)
print(f"Container ID: {result[:20]}...")

# Baslamasini bekle
print("\nAPI baslamasini bekleniyor...")
for i in range(20):
    time.sleep(5)
    status = run("docker inspect ecom-api-1 --format '{{.State.Status}} {{.State.Health.Status}}' 2>/dev/null")
    print(f"  {i*5+5}s: {status}")
    if 'healthy' in status:
        break
    if 'restarting' in status:
        print("  API yeniden basliyor — loglar:")
        print(run("docker logs ecom-api-1 --tail 15 2>&1", timeout=10))
        break

print("\n=== Final durum ===")
print(run("docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'", timeout=30))

print("\n=== API health check ===")
time.sleep(5)
print(run("curl -s http://localhost:15124/health 2>/dev/null | head -c 300", timeout=15))

client.close()
print("\n=== TAMAMLANDI ===")
