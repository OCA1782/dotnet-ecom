# -*- coding: utf-8 -*-
"""
R2 Image Migration — Control Script
1. R2 products/ bosluğunu teyit eder
2. Server DB'de ImageMigrationLog tablosu olusturur
3. Worker script'i server'a yukler ve nohup ile calistirir
4. Ilerlemeyi sorgulayabilirsiniz:
      python deploy/r2_migrate_images.py --status
"""
import os, sys, io, argparse, paramiko
sys.stdout.reconfigure(encoding='utf-8')

_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
with open(_env, encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, _, v = line.partition('=')
            if k.strip() not in os.environ:
                os.environ[k.strip()] = v.strip()

SSH_HOST  = os.environ['DEPLOY_SSH_HOST']
SSH_USER  = os.environ['DEPLOY_SSH_USER']
SSH_PASS  = os.environ['DEPLOY_SSH_PASSWORD']
CONTAINER = 'ecom-postgres-1'
DB_USER   = 'ecom'
DB_NAME   = 'EcomDb'

# ─────────────────────────────────────────────────────────────────────────────
# Server'da calisacak worker script (string olarak gomulu)
# /tmp/r2_worker.py olarak yuklenip nohup ile calistirilir
# ─────────────────────────────────────────────────────────────────────────────
WORKER_SCRIPT = r'''#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
R2 Image Migration Worker — calisir: /tmp/r2_worker.py
Cikti: /tmp/r2_migration.log
"""
import os, sys, time, subprocess, logging, concurrent.futures
import psycopg2, psycopg2.extras, requests, boto3
from botocore.config import Config
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

LOG_FILE      = '/tmp/r2_migration.log'
PROGRESS_FILE = '/tmp/r2_migration_progress.txt'
WORKERS       = 20
BATCH_SIZE    = 200

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[logging.FileHandler(LOG_FILE), logging.StreamHandler(sys.stdout)]
)
log = logging.getLogger(__name__)

# ── Env ──────────────────────────────────────────────────────────────────────
def load_env(path='/opt/ecom/.env'):
    d = {}
    try:
        with open(path) as f:
            for line in f:
                line = line.strip()
                if '=' in line and not line.startswith('#'):
                    k, _, v = line.partition('=')
                    d[k.strip()] = v.strip()
    except:
        pass
    return d

_env = load_env()

R2_ACCOUNT_ID = _env.get('R2_ACCOUNT_ID', '')
R2_ACCESS_KEY = _env.get('R2_ACCESS_KEY_ID', '')
R2_SECRET_KEY = _env.get('R2_SECRET_ACCESS_KEY', '')
R2_BUCKET     = _env.get('R2_BUCKET', 'autoforcepart-bucket')
R2_PUBLIC_URL = 'https://images.autoforcepart.com'
PG_USER       = _env.get('POSTGRES_USER', 'ecom')
PG_PASS       = _env.get('POSTGRES_PASSWORD', '')

# ── Postgres IP (container) ───────────────────────────────────────────────────
def get_pg_ip():
    r = subprocess.run(
        ['docker', 'inspect', 'ecom-postgres-1',
         '--format', '{{.NetworkSettings.Networks.ecom_default.IPAddress}}'],
        capture_output=True, text=True
    )
    return r.stdout.strip() or '172.18.0.4'

PG_IP  = get_pg_ip()
DB_DSN = f'host={PG_IP} port=5432 dbname=EcomDb user={PG_USER} password={PG_PASS} sslmode=disable'
log.info(f'Postgres: {PG_IP}  R2 bucket: {R2_BUCKET}')

# ── Helpers ───────────────────────────────────────────────────────────────────
MIME_EXT = {
    'image/jpeg': '.jpg', 'image/jpg': '.jpg',
    'image/png': '.png', 'image/gif': '.gif',
    'image/webp': '.webp', 'image/svg+xml': '.svg',
    'image/bmp': '.bmp', 'image/tiff': '.tif',
}

def get_ext(url, ct=''):
    if ct:
        base = ct.split(';')[0].strip().lower()
        if base in MIME_EXT:
            return MIME_EXT[base]
    path = url.split('?')[0].split('#')[0].rstrip('/')
    dot  = path.rfind('.')
    if dot > 0:
        e = path[dot:].lower()
        if e in ('.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tif', '.tiff'):
            return '.jpg' if e == '.jpeg' else e
    return '.jpg'

def make_session():
    sess = requests.Session()
    retry = Retry(total=3, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])
    adapter = HTTPAdapter(max_retries=retry, pool_connections=WORKERS, pool_maxsize=WORKERS+5)
    sess.mount('https://', adapter)
    sess.mount('http://', adapter)
    sess.headers['User-Agent'] = (
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
        'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
    )
    return sess

# ── DB ────────────────────────────────────────────────────────────────────────
def setup_log_table(conn):
    with conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS "ImageMigrationLog" (
                "Id"             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "ProductImageId" uuid NOT NULL UNIQUE,
                "ProductId"      uuid NOT NULL,
                "OldImageUrl"    text,
                "R2ImageUrl"     text,
                "Status"         text DEFAULT 'pending',
                "ErrorMessage"   text,
                "MigratedAt"     timestamptz,
                "CreatedAt"      timestamptz DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS "IX_IML_Status" ON "ImageMigrationLog"("Status");
            CREATE INDEX IF NOT EXISTS "IX_IML_ProductId" ON "ImageMigrationLog"("ProductId");
        """)
    conn.commit()
    log.info('ImageMigrationLog table ready')

def get_stats(conn):
    with conn.cursor() as cur:
        cur.execute("""
            SELECT
                COUNT(*) FILTER (WHERE "Status" = 'success')  AS success,
                COUNT(*) FILTER (WHERE "Status" = 'failed')   AS failed,
                COUNT(*) FILTER (WHERE "Status" = 'skipped')  AS skipped
            FROM "ImageMigrationLog"
        """)
        row = cur.fetchone()
        return row[0] or 0, row[1] or 0, row[2] or 0

def get_batch(conn, batch_size):
    with conn.cursor() as cur:
        cur.execute("""
            SELECT pi."Id"::text, pi."ProductId"::text, pi."ImageUrl"
            FROM "ProductImages" pi
            WHERE pi."IsDeleted" = false
              AND pi."ImageUrl" IS NOT NULL
              AND pi."ImageUrl" != ''
              AND NOT EXISTS (
                  SELECT 1 FROM "ImageMigrationLog" l
                  WHERE l."ProductImageId" = pi."Id"
              )
            ORDER BY pi."Id"
            LIMIT %s
        """, (batch_size,))
        return cur.fetchall()

def save_result(conn, img_id, prod_id, old_url, r2_url, status, err=''):
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO "ImageMigrationLog"
                ("ProductImageId","ProductId","OldImageUrl","R2ImageUrl","Status","ErrorMessage","MigratedAt")
            VALUES (%s::uuid,%s::uuid,%s,%s,%s,%s,NOW())
            ON CONFLICT ("ProductImageId") DO UPDATE
                SET "Status"=EXCLUDED."Status",
                    "R2ImageUrl"=EXCLUDED."R2ImageUrl",
                    "ErrorMessage"=EXCLUDED."ErrorMessage",
                    "MigratedAt"=NOW()
        """, (img_id, prod_id, old_url, r2_url, status, err[:500] if err else None))

        if status == 'success' and r2_url:
            cur.execute("""
                UPDATE "ProductImages" SET "ImageUrl" = %s
                WHERE "Id" = %s::uuid AND "IsDeleted" = false
            """, (r2_url, img_id))
    conn.commit()

# ── Worker ────────────────────────────────────────────────────────────────────
def migrate_one(img_id, prod_id, old_url, s3, session):
    """Returns (new_url, status, error_msg)"""
    # Kirilan eski R2 URL'leri indirilemiyor
    if 'images.autoforcepart.com/products/' in old_url:
        return None, 'skipped', 'Broken R2 URL — R2 cleared, original source unknown'

    try:
        resp = session.get(old_url, timeout=30)
        resp.raise_for_status()
        if len(resp.content) < 100:
            return None, 'failed', f'Content too small ({len(resp.content)} bytes)'
    except Exception as e:
        return None, 'failed', f'Download: {e}'

    ct  = resp.headers.get('Content-Type', '')
    ext = get_ext(old_url, ct)
    key = f"products/{img_id.replace('-', '')}{ext}"

    try:
        s3.put_object(
            Bucket=R2_BUCKET, Key=key, Body=resp.content,
            ContentType=ct.split(';')[0].strip() or 'image/jpeg',
        )
    except Exception as e:
        return None, 'failed', f'R2 upload: {e}'

    return f'{R2_PUBLIC_URL}/{key}', 'success', ''

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    log.info('=== R2 Image Migration Worker Started ===')
    log.info(f'Workers={WORKERS} BatchSize={BATCH_SIZE}')

    s3 = boto3.client('s3',
        endpoint_url=f'https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com',
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
        config=Config(signature_version='s3v4', max_pool_connections=WORKERS + 10),
        region_name='auto',
    )

    conn = psycopg2.connect(DB_DSN)
    setup_log_table(conn)

    n_success, n_failed, n_skipped = get_stats(conn)
    log.info(f'Resume: success={n_success:,} failed={n_failed:,} skipped={n_skipped:,}')

    t_start = time.time()
    total_processed = n_success + n_failed + n_skipped
    session = make_session()

    while True:
        batch = get_batch(conn, BATCH_SIZE)
        if not batch:
            log.info('No more images to process.')
            break

        log.info(f'Batch: {len(batch)} images...')

        with concurrent.futures.ThreadPoolExecutor(max_workers=WORKERS) as ex:
            future_map = {
                ex.submit(migrate_one, iid, pid, url, s3, session): (iid, pid, url)
                for iid, pid, url in batch
            }
            for fut in concurrent.futures.as_completed(future_map):
                iid, pid, url = future_map[fut]
                try:
                    new_url, status, err = fut.result()
                except Exception as e:
                    new_url, status, err = None, 'failed', str(e)

                save_result(conn, iid, pid, url, new_url, status, err)

                if status == 'success':   n_success += 1
                elif status == 'failed':  n_failed  += 1
                else:                     n_skipped += 1
                total_processed += 1

        elapsed = time.time() - t_start
        rate = (n_success + n_failed + n_skipped - (get_stats(conn)[0] + get_stats(conn)[1] + get_stats(conn)[2]) + total_processed) / max(elapsed, 1)
        rate = total_processed / max(elapsed, 1)

        log.info(
            f'Total: success={n_success:,} failed={n_failed:,} '
            f'skipped={n_skipped:,} rate={rate:.1f}/s elapsed={elapsed/60:.1f}m'
        )
        with open(PROGRESS_FILE, 'w') as pf:
            pf.write(
                f'success={n_success}\nfailed={n_failed}\nskipped={n_skipped}\n'
                f'rate={rate:.1f}/s\nelapsed={elapsed:.0f}s\n'
                f'timestamp={time.strftime("%Y-%m-%d %H:%M:%S")}\n'
            )

    n_success, n_failed, n_skipped = get_stats(conn)
    log.info(f'=== DONE: success={n_success:,} failed={n_failed:,} skipped={n_skipped:,} ===')
    conn.close()

if __name__ == '__main__':
    main()
'''

# ─────────────────────────────────────────────────────────────────────────────
# Control functions
# ─────────────────────────────────────────────────────────────────────────────

def make_ssh():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SSH_HOST, username=SSH_USER, password=SSH_PASS, timeout=15)
    return ssh

def run(ssh, cmd, timeout=60):
    _, out, err = ssh.exec_command(cmd, timeout=timeout)
    return (out.read() + err.read()).decode('utf-8', errors='replace').strip()


def cmd_start():
    """Upload worker and start with nohup."""
    ssh = make_ssh()

    # 1. R2 bosluk teyidi
    print("=== [1] R2 products/ teyit ediliyor ===")
    check_sql = "SELECT COUNT(*) FROM \"ProductImages\" WHERE \"IsDeleted\"=false AND \"ImageUrl\" IS NOT NULL;"
    r = run(ssh, f'docker exec -i {CONTAINER} psql -U {DB_USER} -d {DB_NAME} -t -c "{check_sql}"', timeout=60)
    print(f"  ProductImages (aktif): {r.strip()}")

    # 2. Worker yukle
    print("\n=== [2] Worker script yukleniyor ===")
    sftp = ssh.open_sftp()
    sftp.putfo(io.BytesIO(WORKER_SCRIPT.encode('utf-8')), '/tmp/r2_worker.py')
    sftp.close()
    print("  /tmp/r2_worker.py yuklendi")

    # 3. boto3 / requests kontrol et
    print("\n=== [3] Python paket kontrol ===")
    r = run(ssh, "python3 -c 'import boto3, requests, psycopg2, concurrent.futures; print(\"OK\")'", timeout=15)
    if 'OK' not in r:
        print("  Eksik paket — yukleniyor...")
        run(ssh, "pip3 install boto3 requests psycopg2-binary --quiet", timeout=120)
    else:
        print("  Tum paketler mevcut")

    # 4. Onceki instance kontrolu
    print("\n=== [4] Onceki instance kontrolu ===")
    r = run(ssh, "pgrep -f r2_worker.py || echo 'Calismiyor'")
    if r and r != 'Calismiyor':
        print(f"  UYARI: Worker zaten calisiyor! PID={r}")
        print("  Cikiliyor. Durdurmak icin: ssh server 'pkill -f r2_worker.py'")
        ssh.close()
        return

    # 5. Log dosyasini temizle
    run(ssh, "truncate -s 0 /tmp/r2_migration.log 2>/dev/null || true")

    # 6. nohup ile baslat
    print("\n=== [5] Worker baslatiliyor (nohup) ===")
    run(ssh, "nohup python3 /tmp/r2_worker.py >> /tmp/r2_migration.log 2>&1 &", timeout=10)
    import time; time.sleep(3)

    r = run(ssh, "pgrep -f r2_worker.py || echo 'BASLAMADI'")
    if 'BASLAMADI' in r:
        print("  HATA: Worker baslamadi! Log:")
        print(run(ssh, "tail -20 /tmp/r2_migration.log"))
    else:
        print(f"  Worker calisiyor PID={r}")
        print("\n  Ilk log satirlari:")
        print(run(ssh, "tail -10 /tmp/r2_migration.log"))

    ssh.close()
    print("\nIlerleme icin: python deploy/r2_migrate_images.py --status")


def cmd_status():
    """Show migration progress."""
    ssh = make_ssh()

    print("=== Worker durumu ===")
    print(run(ssh, "pgrep -f r2_worker.py && echo 'CALISIYOR' || echo 'DURDU'"))

    print("\n=== Progress ===")
    print(run(ssh, "cat /tmp/r2_migration_progress.txt 2>/dev/null || echo 'Henuz yok'"))

    print("\n=== Son log satirlari ===")
    print(run(ssh, "tail -20 /tmp/r2_migration.log 2>/dev/null"))

    print("\n=== DB ozet ===")
    sql = """
SELECT
    "Status",
    COUNT(*) AS adet
FROM "ImageMigrationLog"
GROUP BY "Status"
ORDER BY adet DESC;
"""
    sftp = ssh.open_sftp()
    sftp.putfo(io.BytesIO(sql.encode()), '/tmp/mig_status.sql')
    sftp.close()
    print(run(ssh, f'docker exec -i {CONTAINER} psql -U {DB_USER} -d {DB_NAME} < /tmp/mig_status.sql', timeout=30))

    ssh.close()


def cmd_stop():
    """Stop the worker."""
    ssh = make_ssh()
    r = run(ssh, "pkill -f r2_worker.py && echo 'DURDURULDU' || echo 'Calismiyor'")
    print(r)
    ssh.close()


# ─────────────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--status', action='store_true', help='Ilerlemeyi goster')
    parser.add_argument('--stop',   action='store_true', help='Worker durdur')
    args = parser.parse_args()

    if args.status:
        cmd_status()
    elif args.stop:
        cmd_stop()
    else:
        cmd_start()
