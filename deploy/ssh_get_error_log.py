# -*- coding: utf-8 -*-
"""
R2 migration hata logunu sunucudan indirir, URL bazlı gruplar, özet raporu üretir.
Çıktı: deploy/r2_migration_errors_report.txt
"""
import os, sys, collections
import paramiko

sys.stdout.reconfigure(encoding='utf-8')

_local_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(_local_env):
    with open(_local_env, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, _, v = line.partition('=')
                if k.strip() not in os.environ:
                    os.environ[k.strip()] = v.strip()

host     = os.environ['DEPLOY_SSH_HOST']
user     = os.environ['DEPLOY_SSH_USER']
password = os.environ['DEPLOY_SSH_PASSWORD']

print("Sunucuya bağlanılıyor...")
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

print("Hata logu indiriliyor (/tmp/r2_migration_errors.log)...")
sftp = client.open_sftp()
local_raw = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'r2_migration_errors_raw.tsv')
sftp.get('/tmp/r2_migration_errors.log', local_raw)
sftp.close()
client.close()

print(f"Dosya indirildi: {local_raw}")

# Parse
records = []
with open(local_raw, encoding='utf-8', errors='replace') as f:
    for line in f:
        parts = line.rstrip('\n').split('\t')
        if len(parts) >= 3:
            image_id, url, reason = parts[0], parts[1], '\t'.join(parts[2:])
        elif len(parts) == 2:
            image_id, url, reason = parts[0], parts[1], ''
        else:
            continue
        records.append((image_id, url, reason))

print(f"Toplam hata kaydı: {len(records)}")

# Hata nedenlerini grupla
reason_counter = collections.Counter()
domain_counter  = collections.Counter()
for _, url, reason in records:
    short_reason = reason[:80]
    reason_counter[short_reason] += 1
    try:
        from urllib.parse import urlparse
        domain = urlparse(url).netloc
        domain_counter[domain] += 1
    except Exception:
        pass

# Rapor yaz
report_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'r2_migration_errors_report.txt')
with open(report_path, 'w', encoding='utf-8') as out:
    out.write(f"R2 Migration Hata Raporu\n")
    out.write(f"Toplam hata: {len(records)}\n\n")

    out.write("=== Hata Nedeni Dağılımı (en yaygın 30) ===\n")
    for reason, count in reason_counter.most_common(30):
        out.write(f"  {count:>6}  {reason}\n")

    out.write("\n=== Domain Dağılımı (en yaygın 30) ===\n")
    for domain, count in domain_counter.most_common(30):
        out.write(f"  {count:>6}  {domain}\n")

    out.write("\n=== Hatalı URL Listesi (ilk 500) ===\n")
    for i, (img_id, url, reason) in enumerate(records[:500]):
        out.write(f"{url}\n")

    if len(records) > 500:
        out.write(f"\n... ve {len(records)-500} kayıt daha (r2_migration_errors_raw.tsv dosyasında tam liste)\n")

print(f"\nRapor oluşturuldu: {report_path}")
print("\nÖzet:")
print(f"  Toplam hata: {len(records)}")
print("\nEn yaygın 10 hata nedeni:")
for reason, count in reason_counter.most_common(10):
    print(f"  {count:>6}  {reason}")
print("\nEn yaygın 10 domain:")
for domain, count in domain_counter.most_common(10):
    print(f"  {count:>6}  {domain}")
