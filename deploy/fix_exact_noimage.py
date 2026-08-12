# -*- coding: utf-8 -*-
import os, sys, paramiko
sys.stdout = __import__('io').TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'), encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, _, v = line.partition('=')
            if k.strip() not in os.environ:
                os.environ[k.strip()] = v.strip()

OLD = 'https://www.onlineyedekparca.com/img/product-no-image.png'
NEW = 'https://images.autoforcepart.com/static/autoforcepart-no-image.png'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(os.environ['DEPLOY_SSH_HOST'], username=os.environ['DEPLOY_SSH_USER'], password=os.environ['DEPLOY_SSH_PASSWORD'], timeout=15)

def pg(sql, timeout=300):
    stdin, stdout, stderr = client.exec_command(
        'docker exec -i ecom-postgres-1 psql -U ecom -d EcomDb -t', timeout=timeout)
    stdin.write(sql.encode('utf-8'))
    stdin.channel.shutdown_write()
    return (stdout.read() + stderr.read()).decode('utf-8', errors='replace').strip()

cnt = pg(f"SELECT COUNT(*) FROM \"ProductImages\" WHERE \"ImageUrl\" = '{OLD}';")
print(f'Guncellenecek kayit: {cnt.strip()}')

r = pg(f"UPDATE \"ProductImages\" SET \"ImageUrl\" = '{NEW}' WHERE \"ImageUrl\" = '{OLD}';")
print(f'Sonuc: {r}')

verify = pg(f"SELECT COUNT(*) FROM \"ProductImages\" WHERE \"ImageUrl\" = '{OLD}';")
print(f'Kalan eski URL: {verify.strip()}')

total_new = pg(f"SELECT COUNT(*) FROM \"ProductImages\" WHERE \"ImageUrl\" = '{NEW}';")
print(f'Toplam R2 no-image: {total_new.strip()}')

client.close()
print('Tamamlandi.')
