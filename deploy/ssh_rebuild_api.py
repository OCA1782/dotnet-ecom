# -*- coding: utf-8 -*-
"""
Sunucuda git pull + docker build + API container yeniden baslat.
Mevcut ecom-api-1 container'ini gunceller; docker-compose'a dokunmaz.
"""
import os, sys, time
import paramiko

sys.stdout.reconfigure(encoding='utf-8')

host     = os.environ['DEPLOY_SSH_HOST']
user     = os.environ['DEPLOY_SSH_USER']
password = os.environ['DEPLOY_SSH_PASSWORD']

PG_USER = os.environ['POSTGRES_USER']
PG_PASS = os.environ['POSTGRES_PASSWORD']
PG_DB   = os.environ.get('POSTGRES_DB', 'EcomDb')
PG_CONN = f"Host=ecom-postgres-1;Port=5432;Database={PG_DB};Username={PG_USER};Password={PG_PASS};SSL Mode=Disable;"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run(cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()

def read_env_var(var):
    return run(f"grep '^{var}=' /opt/ecom/.env | cut -d= -f2-").strip()

# 1. Git pull
print("=== 1. Git pull ===")
print(run("cd /opt/ecom && git fetch origin main && git reset --hard origin/main 2>&1", timeout=60))

# 2. Docker build
print("\n=== 2. Docker build (ecom-api-new:latest) ===")
build_out = run("docker build -t ecom-api-new:latest /opt/ecom/backend 2>&1", timeout=600)
last_lines = '\n'.join(build_out.splitlines()[-15:])
print(last_lines)

if 'error' in build_out.lower() and 'successfully built' not in build_out.lower():
    print("\nBuild BASARISIZ — cikiliyor")
    client.close()
    sys.exit(1)
print("Build tamamlandi.")

# 3. Eski container'i durdur
print("\n=== 3. Eski ecom-api-1 durduruluyor ===")
print(run("docker stop ecom-api-1 && docker rm ecom-api-1 || true", timeout=30))

# 4. Env degiskenlerini oku
jwt_key        = read_env_var('JWT_KEY')
seed_email     = read_env_var('SEED_ADMIN_EMAIL')
seed_pass      = read_env_var('SEED_ADMIN_PASSWORD')
allowed_0      = read_env_var('ALLOWED_ORIGIN_0')
allowed_1      = read_env_var('ALLOWED_ORIGIN_1')
rabbitmq_user  = read_env_var('RABBITMQ_USERNAME')
rabbitmq_pass  = read_env_var('RABBITMQ_PASSWORD')
ecom_license   = read_env_var('ECOM_LICENSE')
ecom_pub_key   = read_env_var('ECOM_PUBLIC_KEY')
license_url    = read_env_var('LICENSE_ACTIVATION_URL')
cloudinary_url = read_env_var('CLOUDINARY_URL')
storage_url    = read_env_var('STORAGE_PUBLIC_BASE_URL')
github_token   = read_env_var('GITHUB_TOKEN')
aspnet_env     = read_env_var('ASPNETCORE_ENVIRONMENT')
licence_key    = read_env_var('LICENCE_SERVICE_KEY')
host_ip        = read_env_var('DOCKER_HOST_IP') or '127.0.0.1'
network_name   = run("docker inspect ecom-rabbitmq-1 --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}'").strip()

# 5. Yeni container baslat
print("\n=== 4. Yeni ecom-api-1 baslatiliyor ===")
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
result = run(run_cmd, timeout=30)
print(f"Container: {result[:24]}...")

# 6. Saglik kontrolu
print("\nAPI baslamasini bekleniyor...")
for i in range(20):
    time.sleep(5)
    status = run("docker inspect ecom-api-1 --format '{{.State.Status}} {{.State.Health.Status}}' 2>/dev/null")
    print(f"  {(i+1)*5}s: {status}")
    if 'healthy' in status:
        print("API healthy!")
        break
    if 'restarting' in status:
        print("  --- CRASH LOGS ---")
        print(run("docker logs ecom-api-1 --tail 20 2>&1", timeout=10))
        break

print("\n=== Son API loglar ===")
print(run("docker logs ecom-api-1 --tail 30 2>&1", timeout=15))

print("\n=== Container durumu ===")
print(run("docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'", timeout=15))

print("\n=== Health check ===")
time.sleep(3)
print(run("curl -s http://localhost:15124/health 2>/dev/null | head -c 200", timeout=10))

client.close()
print("\n=== TAMAMLANDI ===")
