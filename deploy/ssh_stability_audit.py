# -*- coding: utf-8 -*-
import os
import paramiko

host = os.environ['DEPLOY_SSH_HOST']
user = os.environ['DEPLOY_SSH_USER']
password = os.environ['DEPLOY_SSH_PASSWORD']

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run(cmd, timeout=30):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()

def p(text):
    print(text.encode('ascii', errors='replace').decode('ascii'))

p("=== 1. Docker restart policies ===")
p(run("docker inspect ecom-customer-1 ecom-api-1 ecom-admin-1 ecom-postgres-1 ecom-redis-1 ecom-rabbitmq-1 --format '{{.Name}} -> restart:{{.HostConfig.RestartPolicy.Name}} maxRetry:{{.HostConfig.RestartPolicy.MaximumRetryCount}}'"))

p("\n=== 2. nginx full config ===")
p(run("sudo cat /etc/nginx/sites-available/autoforcepart.conf 2>/dev/null"))

p("\n=== 3. SSL certbot renewal timer ===")
p(run("systemctl status certbot.timer 2>/dev/null | grep -E 'Active|Trigger|Next' || crontab -l 2>/dev/null | grep -i cert || echo 'no certbot timer found'"))

p("\n=== 4. SSL cert expiry ===")
p(run("sudo certbot certificates 2>/dev/null | grep -E 'Domains|Expiry|VALID'"))

p("\n=== 5. nginx systemd status ===")
p(run("systemctl is-active nginx && systemctl is-enabled nginx"))

p("\n=== 6. Docker compose restart config ===")
p(run("grep -A2 'restart' /opt/ecom/docker-compose.yml 2>/dev/null | head -40"))

p("\n=== 7. Container uptime / restart counts ===")
p(run("docker inspect ecom-customer-1 ecom-api-1 ecom-admin-1 --format '{{.Name}} | started:{{.State.StartedAt}} | restarts:{{.RestartCount}}'"))

p("\n=== 8. Disk space ===")
p(run("df -h / /var 2>/dev/null | tail -3"))

p("\n=== 9. Memory usage ===")
p(run("free -h"))

p("\n=== 10. nginx worker / connection limits ===")
p(run("grep -E 'worker_processes|worker_connections|keepalive_timeout' /etc/nginx/nginx.conf 2>/dev/null | head -10"))

client.close()
p("\nDone.")
