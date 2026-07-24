# -*- coding: utf-8 -*-
"""
MSSQL backup'indan PostgreSQL'e veri yukler.
Onkosul: ssh_migrate_export.py calistirilmis olmali (/opt/ecom/mssql_backup/ mevcut).
MSSQL calismiyor olabilir — sadece PostgreSQL gerekli.
"""
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

pg_user = run("grep POSTGRES_USER /opt/ecom/.env | cut -d= -f2-").strip()
pg_db   = run("grep POSTGRES_DB /opt/ecom/.env | cut -d= -f2-").strip() or "EcomDb"

IMPORT_ORDER = [
    "Users", "UserRoles", "Brands", "Categories",
    "Products", "ProductImages", "Stocks",
    "Coupons", "Orders", "OrderItems",
    "Payments", "Invoices", "InvoiceItems", "Shipments",
    "ProductReviews", "Announcements", "Campaigns",
    "MailTemplates", "SiteSettings", "ExternalSources",
    "UploadedFiles", "LicenseAssignments",
]

DATETIME_TYPES = {'datetime2', 'datetime', 'smalldatetime', 'date', 'time'}
UUID_TYPES     = {'uniqueidentifier'}

def to_pg_value(val, mssql_type):
    dtype = mssql_type.lower() if mssql_type else 'nvarchar'
    if val is None:
        return 'NULL'
    if dtype in UUID_TYPES:
        return f"'{str(val).lower()}'"
    if dtype in DATETIME_TYPES:
        s = str(val)
        if s.endswith('Z') or '+' in s:
            return f"'{s}'"
        return f"'{s}Z'"
    if isinstance(val, bool):
        return 'true' if val else 'false'
    if isinstance(val, (int, float)):
        return str(val)
    escaped = str(val).replace("'", "''")
    return f"'{escaped}'"

def pg_default_for_type(pg_type, is_nullable):
    """PostgreSQL kolonunun tipi icin uygun varsayilan SQL degeri."""
    if is_nullable == 'YES':
        return 'NULL'
    t = pg_type.lower()
    if 'bool' in t:
        return 'false'
    if 'int' in t or 'numeric' in t or 'decimal' in t or 'real' in t or 'double' in t:
        return '0'
    if 'char' in t or 'text' in t:
        return "''"
    if 'uuid' in t:
        return 'NULL'  # uuid NOT NULL olmalidir zaten, bu durumda hata verir
    if 'timestamp' in t or 'date' in t:
        return 'NULL'
    return 'NULL'

# PostgreSQL kolon schemalarini cek
def get_pg_columns(table):
    """PostgreSQL tablosunun kolonlarini {name: {type, nullable, default}} olarak dondur."""
    result = run(
        f"docker exec ecom-postgres-1 psql -U {pg_user} -d {pg_db} -t -c \""
        f"SELECT column_name, data_type, is_nullable, column_default "
        f"FROM information_schema.columns "
        f"WHERE table_name='{table}' AND table_schema='public' "
        f"ORDER BY ordinal_position\" 2>&1"
    )
    cols = {}
    for line in result.splitlines():
        parts = [p.strip() for p in line.split('|')]
        if len(parts) >= 3 and parts[0]:
            cols[parts[0]] = {
                'type': parts[1],
                'nullable': parts[2],
                'default': parts[3] if len(parts) > 3 else None
            }
    return cols

def build_inserts(table, mssql_cols, rows, pg_cols):
    if not rows:
        return []

    # Gecerli MSSQL kolon isimleri (harf/_ ile baslayan)
    valid_mssql = {c: t for c, t in mssql_cols.items() if c[0].isalpha() or c[0] == '_'}

    # INSERT kolonlari: PG'de olan tum kolonlar (sequence/default haricinde)
    skip_defaults = {'nextval', 'gen_random_uuid'}
    insert_cols = []
    for col, meta in pg_cols.items():
        d = meta.get('default') or ''
        if any(s in d for s in skip_defaults):
            continue  # otomatik uretilen kolonlar
        insert_cols.append(col)

    if not insert_cols:
        insert_cols = list(valid_mssql.keys())

    quoted_cols = ', '.join(f'"{c}"' for c in insert_cols)
    stmts = []

    for row in rows:
        values = []
        for col in insert_cols:
            if col in row:
                mssql_type = valid_mssql.get(col, 'nvarchar')
                values.append(to_pg_value(row[col], mssql_type))
            elif col in valid_mssql:
                # MSSQL'de var ama JSON row'da yok -> NULL
                values.append('NULL')
            else:
                # PG'de var, MSSQL'de yok -> tip bazli varsayilan
                pg_meta = pg_cols.get(col, {})
                values.append(pg_default_for_type(pg_meta.get('type', ''), pg_meta.get('nullable', 'YES')))
        val_str = ', '.join(values)
        stmts.append(f'INSERT INTO "{table}" ({quoted_cols}) VALUES ({val_str});')
    return stmts

# --- MAIN ---

sftp = client.open_sftp()
backup_data = {}
for table in IMPORT_ORDER:
    try:
        with sftp.open(f'/opt/ecom/mssql_backup/{table}.json', 'r') as f:
            backup_data[table] = json.loads(f.read())
    except Exception as e:
        print(f"  [{table}] backup bulunamadi: {e}")
        backup_data[table] = {"columns": {}, "rows": []}
sftp.close()

# PG kolon schemalari
print("PostgreSQL kolon schemalari aliniyor...")
pg_schemas = {}
for table in IMPORT_ORDER:
    pg_schemas[table] = get_pg_columns(table)

# SQL dosyasi olustur
sql_lines = ["-- MSSQL -> PostgreSQL Migration", "BEGIN;",
             "SET session_replication_role = replica;", ""]

sql_lines.append("-- Truncate (tum tablolar)")
for table in reversed(IMPORT_ORDER):
    sql_lines.append(f'TRUNCATE TABLE "{table}" RESTART IDENTITY CASCADE;')
sql_lines.append("")

for table in IMPORT_ORDER:
    data = backup_data[table]
    mssql_cols = data.get("columns", {})
    rows = data.get("rows", [])
    if not rows:
        sql_lines.append(f'-- {table}: 0 satir (atlanıyor)')
        continue
    pg_cols = pg_schemas.get(table, {})
    sql_lines.append(f'-- {table}: {len(rows)} satir')
    stmts = build_inserts(table, mssql_cols, rows, pg_cols)
    sql_lines.extend(stmts)
    sql_lines.append("")

sql_lines += ["SET session_replication_role = DEFAULT;", "COMMIT;"]
sql_content = '\n'.join(sql_lines)

sftp = client.open_sftp()
with sftp.open('/tmp/ecom_migration.sql', 'w') as f:
    f.write(sql_content)
sftp.close()

print("SQL dosyasi hazirlandi, import basliyor...")
run("docker cp /tmp/ecom_migration.sql ecom-postgres-1:/tmp/")
result = run(
    f"docker exec ecom-postgres-1 psql -U {pg_user} -d {pg_db} "
    f"-f /tmp/ecom_migration.sql 2>&1",
    timeout=120
)

errors = [l for l in result.splitlines() if 'ERROR' in l or 'FATAL' in l]
if errors:
    print(f"\n=== HATALAR ({len(errors)}) ===")
    for e in errors[:15]:
        print(f"  {e}")
else:
    print("  Import basarili (hata yok)")

print("\n=== PostgreSQL satir sayilari ===")
all_ok = True
for table in IMPORT_ORDER:
    count = run(
        f"docker exec ecom-postgres-1 psql -U {pg_user} -d {pg_db} "
        f"-t -c 'SELECT COUNT(*) FROM \"{table}\";' 2>/dev/null"
    ).strip()
    expected = len(backup_data[table].get("rows", []))
    ok = count == str(expected)
    if not ok:
        all_ok = False
    status = "OK" if ok else f"UYUSMUYOR (beklenen:{expected})"
    print(f"  {table:30s}: {count:>4} [{status}]")

print(f"\n=== {'BASARILI' if all_ok else 'HATALAR VAR — yukaridaki tabloyu kontrol et'} ===")
client.close()
