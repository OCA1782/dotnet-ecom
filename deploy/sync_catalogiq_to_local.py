# -*- coding: utf-8 -*-
"""
Server'daki Catalogiq kayıtlarını local EcomDb'ye aktarır.
Sadece local'de olmayan kayıtlar aktarılır (Id bazlı fark).

Transfer sırası (FK bağımlılığı): Brands → Categories → Products
  → ProductVariants → ProductImages → Stocks
"""
import os, sys, io, time, uuid
import paramiko
import psycopg2

sys.stdout.reconfigure(encoding='utf-8')

_local_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(_local_env):
    with open(_local_env, encoding='utf-8') as _f:
        for _line in _f:
            _line = _line.strip()
            if '=' in _line and not _line.startswith('#'):
                _k, _, _v = _line.partition('=')
                if _k.strip() not in os.environ:
                    os.environ[_k.strip()] = _v.strip()

LOCAL_DSN = "host=127.0.0.1 port=5435 dbname=EcomDb user=ecom password=ecom_dev_2026"

host = os.environ['DEPLOY_SSH_HOST']
srv_user = os.environ['DEPLOY_SSH_USER']
srv_password = os.environ['DEPLOY_SSH_PASSWORD']

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=srv_user, password=srv_password, timeout=30)

def ssh_run(cmd, timeout=600):
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()

sftp = ssh.open_sftp()

def local_conn():
    return psycopg2.connect(LOCAL_DSN)

def get_local_ids(table):
    conn = local_conn()
    cur = conn.cursor()
    cur.execute(f'SELECT "Id"::text FROM "{table}"')
    ids = [r[0] for r in cur.fetchall()]
    cur.close(); conn.close()
    return ids

def transfer_table(table, include_deleted=False):
    """
    1. Local ID'leri al
    2. Server'da temp tablo kur
    3. Diff CSV export et (container içine)
    4. docker cp → host /tmp
    5. SFTP indir
    6. local'e COPY import
    """
    print(f"\n{'='*50}")
    print(f"  {table}")
    print(f"{'='*50}")

    # 1. Local ID'leri al
    t0 = time.time()
    ids = get_local_ids(table)
    print(f"  Local ID sayisi: {len(ids):,}")

    # 2. ID listesini server host'una yükle
    ids_txt = '\n'.join(ids).encode('utf-8')
    host_ids_path = f'/tmp/localids_{table.lower()}.txt'
    with sftp.open(host_ids_path, 'wb') as f:
        f.write(ids_txt)

    # 3. docker cp → container
    container_ids_path = f'/tmp/localids_{table.lower()}.txt'
    container_csv_path = f'/tmp/diff_{table.lower()}.csv'
    host_csv_path = f'/tmp/diff_{table.lower()}.csv'

    r = ssh_run(f"docker cp {host_ids_path} ecom-postgres-1:{container_ids_path}", timeout=30)

    # 4. Server'da diff SQL hazırla
    deleted_filter = "" if include_deleted else 'AND "IsDeleted" = false'
    sql = f"""
DROP TABLE IF EXISTS _lids_tmp;
CREATE TEMP TABLE _lids_tmp (id UUID);
COPY _lids_tmp FROM '{container_ids_path}' (FORMAT TEXT);

SELECT COUNT(*) FROM "{table}"
WHERE "Id" NOT IN (SELECT id FROM _lids_tmp)
{deleted_filter};

COPY (
    SELECT * FROM "{table}"
    WHERE "Id" NOT IN (SELECT id FROM _lids_tmp)
    {deleted_filter}
) TO '{container_csv_path}' CSV HEADER;
"""
    sql_path = f'/tmp/sync_{table.lower()}.sql'
    with sftp.open(sql_path, 'w') as f:
        f.write(sql)

    print(f"  Server export basliyor...")
    result = ssh_run(
        f"docker exec -i ecom-postgres-1 psql -U ecom -d EcomDb < {sql_path}",
        timeout=900
    )

    # Count parse
    diff_count = 0
    for line in result.splitlines():
        line = line.strip()
        if line.isdigit():
            diff_count = int(line)
            break

    print(f"  Yeni kayit: {diff_count:,} ({time.time()-t0:.0f}s)")

    if diff_count == 0:
        return 0

    # 5. docker cp container → host
    r = ssh_run(f"docker cp ecom-postgres-1:{container_csv_path} {host_csv_path}", timeout=60)

    # 6. SFTP indir
    local_csv = f'C:/TEMP/diff_{table.lower()}.csv'
    os.makedirs('C:/TEMP', exist_ok=True)
    sftp.get(host_csv_path, local_csv)
    file_size = os.path.getsize(local_csv)
    print(f"  İndirilen: {file_size/1024/1024:.1f} MB")

    # 7. Local'e import
    conn = local_conn()
    cur = conn.cursor()

    tmp = f'_sync_tmp'
    cur.execute(f'DROP TABLE IF EXISTS {tmp}')
    cur.execute(f'CREATE TEMP TABLE {tmp} AS SELECT * FROM "{table}" WHERE 1=0')
    conn.commit()

    with open(local_csv, 'r', encoding='utf-8') as f:
        cur.copy_expert(f'COPY {tmp} FROM STDIN CSV HEADER', f)

    cur.execute(f"""
        INSERT INTO "{table}"
        SELECT * FROM {tmp}
        ON CONFLICT ("Id") DO NOTHING
    """)
    inserted = cur.rowcount
    conn.commit()
    cur.close()
    conn.close()

    os.remove(local_csv)
    print(f"  Eklenen: {inserted:,} kayit")
    return inserted

# ---------- ANA TRANSFER ----------

results = {}

# Brands: Products FK olduğu için IsDeleted dahil tümünü al
for table, inc_del in [
    ('Brands',          True),
    ('Categories',      True),
    ('Products',        False),
    ('ProductVariants', False),
    ('ProductImages',   False),
    ('Stocks',          False),
]:
    try:
        results[table] = transfer_table(table, include_deleted=inc_del)
    except Exception as e:
        import traceback
        print(f"  HATA: {e}")
        traceback.print_exc()
        results[table] = f'HATA: {e}'

# ---------- AKTARIM TABLOLARI ----------
print("\n\n--- ExternalSourceImportLogs güncelleniyor ---")

CATALOGIQ_SOURCE_NAME = "Catalogiq (Server Sync)"
ADMIN_USER_ID = "eee22bd1-1a20-4c05-8726-b27fbe085641"

conn = local_conn()
cur = conn.cursor()

cur.execute('SELECT "Id" FROM "ExternalSources" WHERE "Name" = %s AND "IsDeleted" = false', (CATALOGIQ_SOURCE_NAME,))
row = cur.fetchone()
if row:
    src_id = str(row[0])
    print(f"  ExternalSource mevcut: {src_id}")
else:
    src_id = str(uuid.uuid4())
    total_inserted = sum(v for v in results.values() if isinstance(v, int))
    cur.execute("""
        INSERT INTO "ExternalSources"
            ("Id","Name","Type","Description","IsActive",
             "LastFetchedAt","LastFetchedCount","CreatedDate","UpdatedDate","IsDeleted")
        VALUES (%s,%s,'ServerSync',%s,true,NOW(),%s,NOW(),NOW(),false)
    """, (src_id, CATALOGIQ_SOURCE_NAME, 'Canlı sunucudan Catalogiq veri aktarımı', total_inserted))
    print(f"  ExternalSource oluşturuldu: {src_id}")

for table, inserted in results.items():
    if isinstance(inserted, int) and inserted >= 0:
        log_id = str(uuid.uuid4())
        cur.execute("""
            INSERT INTO "ExternalSourceImportLogs"
                ("Id","ExternalSourceId","TargetEntity",
                 "InsertedCount","UpdatedCount","SkippedCount",
                 "TotalRows","ConflictStrategy","ImportedByUserId",
                 "DeletedCount","RestoredCount","CreatedDate","IsDeleted")
            VALUES (%s,%s,%s,%s,0,0,%s,'skip',%s,0,0,NOW(),false)
        """, (log_id, src_id, table, inserted, inserted, ADMIN_USER_ID))
        print(f"  Log eklendi: {table} → {inserted:,}")

conn.commit()
cur.close()
conn.close()

sftp.close()
ssh.close()

# ---------- ÖZET ----------
print("\n" + "=" * 60)
print("AKTARIM ÖZETI")
print("=" * 60)
total = 0
for table, result in results.items():
    if isinstance(result, int):
        total += result
    print(f"  {table:<25}: {result}")
print(f"  {'TOPLAM':<25}: {total:,}")
print("=" * 60)
