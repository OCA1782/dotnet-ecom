# -*- coding: utf-8 -*-
"""
Adim 82 — EcomLicence + Ecom full deploy
- EcomLicence /opt/ecom-licence dizinine clone/pull edilir
- Sunucudaki .env okunarak compose dosyasi uretilir
- Tum servisler yeniden build edilip baslatilir
"""
import sys, os
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

host     = os.environ['DEPLOY_SSH_HOST']
user     = os.environ['DEPLOY_SSH_USER']
password = os.environ['DEPLOY_SSH_PASSWORD']

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run(cmd, timeout=120):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()

# ── 1. Ecom git pull ──────────────────────────────────────────────────────
print("=== 1/5 Ecom git pull ===")
print(run("cd /opt/ecom && git pull origin main", timeout=60))

# ── 2. EcomLicence clone/pull ─────────────────────────────────────────────
print("\n=== 2/5 EcomLicence repo ===")
check = run("[ -d /opt/ecom-licence/.git ] && echo exists || echo missing")
if "missing" in check:
    print("Clone ediliyor...")
    print(run("git clone https://github.com/OCA1782/dotnet-ecom-licence.git /opt/ecom-licence", timeout=120))
else:
    print("Pull ediliyor...")
    print(run("cd /opt/ecom-licence && git pull origin master", timeout=60))

# ── 3. .env oku ───────────────────────────────────────────────────────────
print("\n=== 3/5 .env okunuyor ===")
env_raw = run("cat /opt/ecom/.env")
env = {}
for line in env_raw.splitlines():
    line = line.strip()
    if '=' in line and not line.startswith('#'):
        k, _, v = line.partition('=')
        env[k.strip()] = v.strip()

sa_pass      = env.get('SA_PASSWORD', '')
jwt_key      = env.get('JWT_KEY', '')
admin_email  = env.get('SEED_ADMIN_EMAIL', 'admin@ecom.com')
admin_pass   = env.get('SEED_ADMIN_PASSWORD', '')
rabbit_user  = env.get('RABBITMQ_USERNAME', '')
rabbit_pass  = env.get('RABBITMQ_PASSWORD', '')
github_tok   = env.get('GITHUB_TOKEN', '')
mssql_mem    = env.get('MSSQL_MEMORY_LIMIT_MB', '1500')
licence_key  = env.get('LICENCE_SERVICE_KEY', '')
ecom_license = env.get('ECOM_LICENSE', '')
ecom_pubkey  = env.get('ECOM_PUBLIC_KEY', '')

if not licence_key:
    print()
    print("HATA: /opt/ecom/.env dosyasinda LICENCE_SERVICE_KEY bulunamadi!")
    print("Sunucuya SSH ile baglanip asagidaki komutu calistirin:")
    print()
    print("  echo \"LICENCE_SERVICE_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(32))')\" >> /opt/ecom/.env")
    print()
    client.close()
    sys.exit(1)

print(f"LICENCE_SERVICE_KEY mevcut: {'*' * 8}...{licence_key[-4:]}")

SERVER_IP = '178.105.230.111'
db_conn   = f"Server=db;Database=EcomDb;User Id=sa;Password={sa_pass};TrustServerCertificate=True;MultipleActiveResultSets=true"
lic_conn  = f"Server=db;Database=EcomDb;User Id=sa;Password={sa_pass};TrustServerCertificate=True"

# ── 4. docker-compose.yml yaz ─────────────────────────────────────────────
print("\n=== 4/5 docker-compose.yml yaziliyor ===")
compose = f"""services:
  redis:
    image: redis:7-alpine
    command: redis-server --maxmemory 128mb --maxmemory-policy allkeys-lru
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "127.0.0.1:5672:5672"
      - "127.0.0.1:15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: "{rabbit_user}"
      RABBITMQ_DEFAULT_PASS: "{rabbit_pass}"
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 15s
      timeout: 10s
      retries: 10
      start_period: 30s
    restart: unless-stopped

  db:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      SA_PASSWORD: "{sa_pass}"
      ACCEPT_EULA: "Y"
      MSSQL_PID: "Express"
    ports:
      - "127.0.0.1:1433:1433"
    volumes:
      - sqldata:/var/opt/mssql
    deploy:
      resources:
        limits:
          memory: {mssql_mem}m
    healthcheck:
      test: ["CMD-SHELL", "/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P '{sa_pass}' -Q 'SELECT 1' -C"]
      interval: 15s
      timeout: 10s
      retries: 10
      start_period: 30s
    restart: unless-stopped

  licence:
    build:
      context: /opt/ecom-licence
      dockerfile: Dockerfile
    ports:
      - "127.0.0.1:15125:8080"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection={lic_conn}
      - LICENCE_SERVICE_KEY={licence_key}
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "127.0.0.1:15124:8080"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection={db_conn}
      - Jwt__Key={jwt_key}
      - Jwt__Issuer=EcomAPI
      - Jwt__Audience=EcomClient
      - Seed__AdminEmail={admin_email}
      - Seed__AdminPassword={admin_pass}
      - AllowedOrigins__0=http://{SERVER_IP}:3000
      - AllowedOrigins__1=http://{SERVER_IP}:3001
      - AllowedOrigins__2=http://localhost:3000
      - AllowedOrigins__3=http://localhost:3001
      - RabbitMQ__Host=rabbitmq
      - RabbitMQ__Username={rabbit_user}
      - RabbitMQ__Password={rabbit_pass}
      - ConnectionStrings__Redis=redis:6379
      - ECOM_LICENSE={ecom_license}
      - ECOM_PUBLIC_KEY={ecom_pubkey}
      - LICENSE_ACTIVATION_URL=
      - Cloudinary__Url={env.get('CLOUDINARY_URL', '')}
      - Storage__PublicBaseUrl={env.get('STORAGE_PUBLIC_BASE_URL', '')}
      - FrontendUrls__CustomerUrl=http://customer:3000
      - FrontendUrls__AdminUrl=http://admin:3001
      - Docs__LocalPath=/app/docs
      - GitHub__Token={github_tok}
      - GitHub__Owner=OCA1782
      - GitHub__Repo=dotnet-ecom-docs
      - GitHub__DocsPath=
      - LicenceService__BaseUrl=http://licence:8080
      - LICENCE_SERVICE_KEY={licence_key}
    volumes:
      - uploads:/app/wwwroot/uploads
      - docs:/app/docs
      - /opt/ecom/.git:/app/.git:ro
    depends_on:
      db:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
      redis:
        condition: service_healthy
      licence:
        condition: service_started
    restart: unless-stopped

  customer:
    build:
      context: ./frontend/customer
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: http://{SERVER_IP}:5124
    ports:
      - "127.0.0.1:13000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://{SERVER_IP}:5124
      - INTERNAL_API_URL=http://api:8080
    depends_on:
      - api
    restart: unless-stopped

  admin:
    build:
      context: ./frontend/admin
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: http://{SERVER_IP}:5124
    ports:
      - "127.0.0.1:13001:3001"
    environment:
      - NEXT_PUBLIC_API_URL=http://{SERVER_IP}:5124
      - PORT=3001
      - INTERNAL_API_URL=http://api:8080
    depends_on:
      - api
    restart: unless-stopped

volumes:
  sqldata:
  uploads:
  docs:
"""

sftp = client.open_sftp()
with sftp.open('/opt/ecom/docker-compose.yml', 'w') as f:
    f.write(compose)
sftp.close()
print("docker-compose.yml sunucuya yazildi.")

# ── 5. Build & Up ─────────────────────────────────────────────────────────
print("\n=== 5/5 docker compose build --no-cache (15-20 dk surebilir) ===")
r = run("cd /opt/ecom && docker compose build --no-cache 2>&1 | tail -60", timeout=1800)
print(r)

print("\n=== docker compose up -d ===")
r = run("cd /opt/ecom && docker compose up -d 2>&1", timeout=120)
print(r)

print("\n=== Servis Durumu ===")
print(run("docker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'"))

client.close()
print("\n=== DEPLOY TAMAM ===")
print(f"API:     http://{SERVER_IP}:5124")
print(f"Admin:   http://{SERVER_IP}:3001")
print(f"Customer: http://{SERVER_IP}:3000")
