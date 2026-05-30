# -*- coding: utf-8 -*-
import paramiko
import time

host = '178.105.230.111'
user = 'root'
password = 'REDACTED_SSH_PASSWORD'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run(cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()

print("=== git pull ===")
print(run("cd /opt/ecom && git stash && git pull origin main", timeout=60))

SERVER_IP = '178.105.230.111'
compose_content = f"""services:
  db:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      SA_PASSWORD: "REDACTED_SA_PASSWORD"
      ACCEPT_EULA: "Y"
      MSSQL_PID: "Express"
      MSSQL_MEMORY_LIMIT_MB: "1500"
    ports:
      - "1433:1433"
    volumes:
      - sqldata:/var/opt/mssql
    healthcheck:
      test: ["CMD-SHELL", "/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P 'REDACTED_SA_PASSWORD' -Q 'SELECT 1' -C"]
      interval: 15s
      timeout: 10s
      retries: 10
      start_period: 60s
    restart: unless-stopped

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5124:8080"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection=Server=db;Database=EcomDb;User Id=sa;Password=REDACTED_SA_PASSWORD;TrustServerCertificate=True;MultipleActiveResultSets=true
      - Jwt__Key=REDACTED_JWT_KEY
      - Jwt__Issuer=EcomAPI
      - Jwt__Audience=EcomClient
      - Seed__AdminEmail=admin@ecom.com
      - Seed__AdminPassword=REDACTED_ADMIN_PASSWORD
      - AllowedOrigins__0=http://{SERVER_IP}:3000
      - AllowedOrigins__1=http://{SERVER_IP}:3001
      - AllowedOrigins__2=http://localhost:3000
      - AllowedOrigins__3=http://localhost:3001
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  customer:
    build:
      context: ./frontend/customer
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: http://{SERVER_IP}:5124
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://{SERVER_IP}:5124
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
      - "3001:3001"
    environment:
      - NEXT_PUBLIC_API_URL=http://{SERVER_IP}:5124
      - PORT=3001
    depends_on:
      - api
    restart: unless-stopped

volumes:
  sqldata:
"""

sftp = client.open_sftp()
with sftp.open('/opt/ecom/docker-compose.yml', 'w') as f:
    f.write(compose_content)
sftp.close()
print("=== docker-compose.yml yazildi ===")

print("\n=== Sadece API rebuild (migration dosyaları değişti) ===")
r = run("cd /opt/ecom && docker compose build --no-cache api 2>&1 | tail -10", timeout=600)
print(r)

print("\n=== API container yeniden baslat ===")
print(run("cd /opt/ecom && docker compose stop api && docker compose rm -f api && docker compose up -d api"))

print("\n=== 30sn bekle ===")
time.sleep(30)

print("\n=== Tüm container durumu ===")
print(run("docker ps --format 'table {{.Names}}\t{{.Status}}'"))

print("\n=== API health ===")
print(run("curl -s -o /dev/null -w '%{http_code}' http://localhost:5124/health || echo 'HATA'"))

print("\n=== API son loglar ===")
print(run("docker logs ecom-api-1 --tail 20 2>&1"))

client.close()
print("\n=== TAMAMLANDI ===")
