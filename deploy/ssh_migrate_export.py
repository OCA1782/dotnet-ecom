# -*- coding: utf-8 -*-
import os, sys, json
import paramiko

sys.stdout.reconfigure(encoding='utf-8')

host = os.environ['DEPLOY_SSH_HOST']
user = os.environ['DEPLOY_SSH_USER']
password = os.environ['DEPLOY_SSH_PASSWORD']

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run(cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()

sa_pass = run("grep SA_PASSWORD /opt/ecom/.env | cut -d= -f2-").strip()

TABLES = [
    "Users", "UserRoles", "Brands", "Categories",
    "Products", "ProductImages", "Stocks",
    "Coupons", "Orders", "OrderItems",
    "Payments", "Invoices", "InvoiceItems", "Shipments",
    "ProductReviews", "Announcements", "Campaigns",
    "MailTemplates", "SiteSettings", "ExternalSources",
    "UploadedFiles", "LicenseAssignments",
]

run("mkdir -p /opt/ecom/mssql_backup")
sftp = client.open_sftp()

def sqlcmd(query, timeout=60):
    stdin, stdout, stderr = client.exec_command(
        f"docker exec ecom-db-1 /opt/mssql-tools18/bin/sqlcmd "
        f"-S localhost -U sa -P '{sa_pass}' -d EcomDb -C -y 0 "
        f"-Q \"{query}\" 2>/dev/null",
        timeout=timeout
    )
    return stdout.read().decode('utf-8', errors='replace')

def clean_json_output(raw):
    lines = raw.splitlines()
    cleaned = []
    for line in lines:
        s = line.strip()
        if not s:
            continue
        if 'rows affected' in s.lower():
            continue
        if all(c in '- ' for c in s):
            continue
        cleaned.append(s)
    return ''.join(cleaned).strip()

total_rows = 0

for table in TABLES:
    print(f"  {table} export ediliyor...", end='', flush=True)

    # Kolon meta verisi
    meta_raw = sqlcmd(
        f"SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS "
        f"WHERE TABLE_NAME='{table}' ORDER BY ORDINAL_POSITION"
    )
    cols = {}
    for line in meta_raw.splitlines():
        parts = line.split('|') if '|' in line else line.split()
        if len(parts) >= 2:
            col = parts[0].strip()
            dtype = parts[1].strip() if len(parts) > 1 else ''
            if col and dtype and not col.startswith('-') and col != 'COLUMN_NAME':
                cols[col] = dtype

    # Veri export (FOR JSON PATH)
    json_raw = sqlcmd(f"SET NOCOUNT ON; SELECT * FROM [{table}] FOR JSON PATH")
    json_str = clean_json_output(json_raw)

    try:
        rows = json.loads(json_str) if json_str else []
        row_count = len(rows)
    except json.JSONDecodeError:
        rows = []
        row_count = 0
        print(f" JSON parse hatasi!")

    export = {"columns": cols, "rows": rows}
    with sftp.open(f'/opt/ecom/mssql_backup/{table}.json', 'w') as f:
        f.write(json.dumps(export, ensure_ascii=False, indent=2))

    print(f" {row_count} satir")
    total_rows += row_count

sftp.close()
client.close()

print(f"\nToplam: {total_rows} satir")
print("Backup: /opt/ecom/mssql_backup/")
print("Import icin: python deploy/ssh_migrate_import.py")
