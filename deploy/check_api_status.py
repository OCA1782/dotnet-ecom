import paramiko, time, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.210.40.242', username='bilgi', password='nAqAcUFeb9vUbruMon0b!', timeout=10)

def run(cmd, timeout=15):
    _, out, err = client.exec_command(cmd, timeout=timeout)
    return (out.read() + err.read()).decode('utf-8', errors='replace').strip()

for i in range(12):
    status = run("docker inspect ecom-api-1 --format '{{.State.Status}} {{.State.Health.Status}}'")
    print(f"[{(i+1)*5}s] {status}")
    if 'healthy' in status:
        break
    time.sleep(5)

print("\nSon loglar:")
print(run("docker logs ecom-api-1 --tail 8 2>&1"))

print("\nContainer listesi:")
print(run("docker ps --format 'table {{.Names}}\t{{.Status}}' 2>&1"))

client.close()
