# -*- coding: utf-8 -*-
"""
R2 Fresh Migration — Control Script
  --start   : Worker'i baslatir (varsayilan)
  --status  : Ilerlemeyi gosterir
  --stop    : Worker'i durdurur
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

# =============================================================================
# Worker script — server'a /tmp/r2_fresh_worker.py olarak yuklenir
# =============================================================================
WORKER_SCRIPT = r'''#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
R2 Fresh Migration Worker
Log: /tmp/r2_fresh_migration.log
Progress: /tmp/r2_fresh_progress.txt
"""
import os, sys, time, subprocess, logging, concurrent.futures
import psycopg2, psycopg2.extras, requests, boto3
from botocore.config import Config
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

LOG_FILE      = '/tmp/r2_fresh_migration.log'
PROGRESS_FILE = '/tmp/r2_fresh_progress.txt'
WORKERS       = 20
BATCH_SIZE    = 200

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler(sys.stdout),
    ]
)
log = logging.getLogger(__name__)


def load_env(path='/opt/ecom/.env'):
    d = {}
    try:
        with open(path) as f:
            for line in f:
                line = line.strip()
                if '=' in line and not line.startswith('#'):
                    k, _, v = line.partition('=')
                    d[k.strip()] = v.strip()
    except Exception:
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


def get_pg_ip():
    r = subprocess.run(
        ['docker', 'inspect', 'ecom-postgres-1',
         '--format', '{{.NetworkSettings.Networks.ecom_default.IPAddress}}'],
        capture_output=True, text=True
    )
    return r.stdout.strip() or '172.18.0.4'


PG_IP  = get_pg_ip()
DB_DSN = (
    f'host={PG_IP} port=5432 dbname=EcomDb '
    f'user={PG_USER} password={PG_PASS} sslmode=disable'
)
log.info(f'Postgres: {PG_IP}  R2 bucket: {R2_BUCKET}')


# ── Helpers ───────────────────────────────────────────────────────────────────
MIME_EXT = {
    'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/png': '.png',
    'image/gif': '.gif',  'image/webp': '.webp', 'image/svg+xml': '.svg',
    'image/bmp': '.bmp',  'image/tiff': '.tif',
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


def make_http_session():
    sess = requests.Session()
    retry = Retry(total=3, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])
    adapter = HTTPAdapter(
        max_retries=retry,
        pool_connections=WORKERS,
        pool_maxsize=WORKERS + 5,
    )
    sess.mount('https://', adapter)
    sess.mount('http://', adapter)
    sess.headers['User-Agent'] = (
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
        'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
    )
    return sess


# ── DB helpers ────────────────────────────────────────────────────────────────
def setup_log_table(conn):
    with conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS "ImageMigrationLog" (
                "Id"             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "ProductImageId" uuid NOT NULL UNIQUE,
                "ProductId"      uuid NOT NULL,
                "OldImageUrl"    text,
                "R2ImageUrl"     text,
                "Status"         text NOT NULL DEFAULT 'pending',
                "ErrorMessage"   text,
                "MigratedAt"     timestamptz,
                "CreatedAt"      timestamptz NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS "IX_IML_Status"    ON "ImageMigrationLog"("Status");
            CREATE INDEX IF NOT EXISTS "IX_IML_ProductId" ON "ImageMigrationLog"("ProductId");
        """)
    conn.commit()
    log.info('ImageMigrationLog tablosu hazir')


def get_stats(conn):
    with conn.cursor() as cur:
        cur.execute("""
            SELECT
                COUNT(*) FILTER (WHERE "Status" = 'success')          AS success,
                COUNT(*) FILTER (WHERE "Status" = 'failed')           AS failed,
                COUNT(*) FILTER (WHERE "Status" = 'skipped_static')   AS skipped_static,
                COUNT(*) FILTER (WHERE "Status" = 'purged_broken_r2') AS purged_broken,
                COUNT(*) FILTER (WHERE "Status" = 'skipped_null')     AS skipped_null,
                COUNT(*) FILTER (WHERE "Status" = 'skipped_noimage')  AS skipped_noimage
            FROM "ImageMigrationLog"
        """)
        row = cur.fetchone()
        return {
            'success':         row[0] or 0,
            'failed':          row[1] or 0,
            'skipped_static':  row[2] or 0,
            'purged_broken':   row[3] or 0,
            'skipped_null':    row[4] or 0,
            'skipped_noimage': row[5] or 0,
        }


def get_batch(conn, batch_size):
    """Henuz islenmemis ProductImages batch'i getirir."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT pi."Id"::text, pi."ProductId"::text, pi."ImageUrl"
            FROM "ProductImages" pi
            WHERE pi."IsDeleted" = false
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
                ("ProductImageId","ProductId","OldImageUrl","R2ImageUrl",
                 "Status","ErrorMessage","MigratedAt")
            VALUES (%s::uuid, %s::uuid, %s, %s, %s, %s, NOW())
            ON CONFLICT ("ProductImageId") DO UPDATE
                SET "Status"       = EXCLUDED."Status",
                    "R2ImageUrl"   = EXCLUDED."R2ImageUrl",
                    "ErrorMessage" = EXCLUDED."ErrorMessage",
                    "MigratedAt"   = NOW()
        """, (img_id, prod_id, old_url, r2_url, status, err[:1000] if err else None))

        if status == 'success' and r2_url:
            # DB'yi yeni R2 URL ile guncelle
            cur.execute("""
                UPDATE "ProductImages"
                SET "ImageUrl" = %s
                WHERE "Id" = %s::uuid AND "IsDeleted" = false
            """, (r2_url, img_id))
        elif status == 'purged_broken_r2':
            # Kirik R2 URL — kaynak bilinmiyor, gorsel kaydini devre disi birak
            cur.execute("""
                UPDATE "ProductImages"
                SET "IsDeleted" = true
                WHERE "Id" = %s::uuid AND "IsDeleted" = false
            """, (img_id,))
        # 'failed' durumunda URL'ye dokunma — log kaydi yeterli, tekrar denenebilir

    conn.commit()


# ── Per-image migration ────────────────────────────────────────────────────────
def migrate_one(img_id, prod_id, old_url, s3, session):
    """
    Returns (new_r2_url_or_None, status, error_msg)

    status values:
      success          — R2'ye yuklendi, DB guncellendi
      failed           — indirme/yukleme hatasi, DB URL null yapildi
      skipped_static   — static CDN URL, dokunulmadi
      purged_broken_r2 — DB'de R2 URL vardi ama R2 bos, null yapildi
      skipped_null     — URL zaten NULL/bos
    """
    # NULL / bos
    if not old_url or old_url.strip() == '':
        return None, 'skipped_null', ''

    # OYP no-image placeholder — R2'ye yukleme
    if 'onlineyedekparca.com/img/product-no-image' in old_url:
        return None, 'skipped_noimage', 'OYP no-image placeholder'

    # Kirik R2 URL (R2 bos oldugu icin) — null yap
    if 'images.autoforcepart.com/products/' in old_url:
        return None, 'purged_broken_r2', 'R2 cleared — original source lost'

    # Static CDN — gecerli, dokunma
    if 'images.autoforcepart.com/static/' in old_url:
        return None, 'skipped_static', ''

    # Indir
    try:
        resp = session.get(old_url, timeout=30)
        resp.raise_for_status()
        if len(resp.content) < 100:
            return None, 'failed', f'Icerik cok kucuk ({len(resp.content)} byte)'
    except Exception as e:
        return None, 'failed', f'Indirme hatasi: {e}'

    ct  = resp.headers.get('Content-Type', '')
    ext = get_ext(old_url, ct)
    key = f"products/{img_id.replace('-', '')}{ext}"

    try:
        s3.put_object(
            Bucket=R2_BUCKET,
            Key=key,
            Body=resp.content,
            ContentType=ct.split(';')[0].strip() or 'image/jpeg',
        )
    except Exception as e:
        return None, 'failed', f'R2 yukleme hatasi: {e}'

    return f'{R2_PUBLIC_URL}/{key}', 'success', ''


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    log.info('=== R2 Fresh Migration Worker Basladi ===')
    log.info(f'Workers={WORKERS}  BatchSize={BATCH_SIZE}')

    s3 = boto3.client(
        's3',
        endpoint_url=f'https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com',
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
        config=Config(signature_version='s3v4', max_pool_connections=WORKERS + 10),
        region_name='auto',
    )

    conn = psycopg2.connect(DB_DSN)
    setup_log_table(conn)

    stats = get_stats(conn)
    log.info(
        f'Resume durumu: '
        f'success={stats["success"]:,}  failed={stats["failed"]:,}  '
        f'skipped_static={stats["skipped_static"]:,}  '
        f'purged_broken={stats["purged_broken"]:,}  '
        f'skipped_null={stats["skipped_null"]:,}'
    )

    t_start = time.time()
    session = make_http_session()
    total = sum(stats.values())

    while True:
        batch = get_batch(conn, BATCH_SIZE)
        if not batch:
            log.info('Isleme alacak gorsel kalmadi.')
            break

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
                stats[status if status in stats else 'failed'] = \
                    stats.get(status, 0) + 1
                total += 1

        elapsed = time.time() - t_start
        rate    = total / max(elapsed, 1)
        log.info(
            f'Toplam: {total:,} | '
            f'success={stats["success"]:,}  failed={stats["failed"]:,}  '
            f'purged={stats["purged_broken"]:,}  '
            f'static={stats["skipped_static"]:,}  '
            f'rate={rate:.1f}/s  elapsed={elapsed/60:.1f}m'
        )
        with open(PROGRESS_FILE, 'w', encoding='utf-8') as pf:
            pf.write(
                f'total={total}\n'
                f'success={stats["success"]}\n'
                f'failed={stats["failed"]}\n'
                f'purged_broken_r2={stats["purged_broken"]}\n'
                f'skipped_static={stats["skipped_static"]}\n'
                f'skipped_noimage={stats["skipped_noimage"]}\n'
                f'skipped_null={stats["skipped_null"]}\n'
                f'rate={rate:.1f}/s\n'
                f'elapsed={elapsed:.0f}s\n'
                f'timestamp={time.strftime("%Y-%m-%d %H:%M:%S")}\n'
            )

    stats = get_stats(conn)
    log.info(
        f'=== TAMAMLANDI: '
        f'success={stats["success"]:,}  failed={stats["failed"]:,}  '
        f'purged_broken_r2={stats["purged_broken"]:,}  '
        f'skipped_static={stats["skipped_static"]:,}  '
        f'skipped_null={stats["skipped_null"]:,} ==='
    )
    conn.close()


if __name__ == '__main__':
    main()
'''


# =============================================================================
# Control functions
# =============================================================================

def make_ssh():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SSH_HOST, username=SSH_USER, password=SSH_PASS, timeout=15)
    return ssh


def run(ssh, cmd, timeout=60):
    _, out, err = ssh.exec_command(cmd, timeout=timeout)
    return (out.read() + err.read()).decode('utf-8', errors='replace').strip()


def run_sql(ssh, sql, timeout=120):
    sftp = ssh.open_sftp()
    sftp.putfo(io.BytesIO(sql.encode('utf-8')), '/tmp/_ctrl.sql')
    sftp.close()
    return run(ssh, f'docker exec -i {CONTAINER} psql -U {DB_USER} -d {DB_NAME} < /tmp/_ctrl.sql', timeout=timeout)


def cmd_start():
    ssh = make_ssh()

    print('=== [1] R2 products/ kontrol ===')
    r = run(ssh, "python3 -c \""
            "import boto3; from botocore.config import Config; "
            "import os; "
            "_e={l.split('=',1)[0].strip(): l.split('=',1)[1].strip() for l in open('/opt/ecom/.env') if '=' in l and not l.startswith('#')}; "
            "s3=boto3.client('s3',endpoint_url=f'https://{_e[chr(82)+chr(50)+chr(95)+chr(65)+chr(67)+chr(67)+chr(79)+chr(85)+chr(78)+chr(84)+chr(95)+chr(73)+chr(68)]}.r2.cloudflarestorage.com',"
            "aws_access_key_id=_e['R2_ACCESS_KEY_ID'],aws_secret_access_key=_e['R2_SECRET_ACCESS_KEY'],"
            "config=Config(signature_version='s3v4'),region_name='auto'); "
            "r=s3.list_objects_v2(Bucket=_e['R2_BUCKET'],Prefix='products/',MaxKeys=5); "
            "print('R2 products/ nesneler:', r.get('KeyCount',0), '| Truncated:', r.get('IsTruncated',False))"
            "\"", timeout=30)
    print(f'  {r}')

    print('\n=== [2] DB ProductImages ozet ===')
    sql = r"""
SELECT
  CASE
    WHEN "ImageUrl" LIKE 'https://images.autoforcepart.com/products/%' THEN 'R2-products (KIRIK)'
    WHEN "ImageUrl" LIKE 'https://images.autoforcepart.com/static/%'   THEN 'Static CDN'
    WHEN "ImageUrl" LIKE '%onlineyedekparca%'                           THEN 'OYP'
    WHEN "ImageUrl" IS NULL OR "ImageUrl" = ''                          THEN 'NULL/Bos'
    WHEN "ImageUrl" LIKE 'http%'                                        THEN 'Diger external'
    ELSE 'Diger'
  END AS tip,
  COUNT(*) AS adet
FROM "ProductImages"
WHERE "IsDeleted" = false
GROUP BY 1
ORDER BY adet DESC;
"""
    print(run_sql(ssh, sql))

    print('\n=== [3] Onceki instance kontrol / temizle ===')
    r = run(ssh, "ps aux | grep '[r]2_fresh_worker.py' | awk '{print $2}'")
    if r:
        print(f'  Mevcut worker bulundu (PID={r}), durduruluyor...')
        run(ssh, "pkill -f 'python3 /tmp/r2_fresh_worker.py' 2>/dev/null || true")
        import time; time.sleep(2)
    else:
        print('  Temiz — onceki worker yok')

    print('\n=== [4] Worker yukleniyor ===')
    sftp = ssh.open_sftp()
    sftp.putfo(io.BytesIO(WORKER_SCRIPT.encode('utf-8')), '/tmp/r2_fresh_worker.py')
    sftp.close()
    print('  /tmp/r2_fresh_worker.py yuklendi')

    print('\n=== [5] Python paketleri kontrol ===')
    r = run(ssh, "python3 -c 'import boto3, requests, psycopg2; print(\"OK\")'", timeout=15)
    if 'OK' not in r:
        print('  Eksik paket — yukleniyor...')
        run(ssh, 'pip3 install boto3 requests psycopg2-binary --quiet', timeout=180)
    else:
        print('  Tum paketler hazir')

    print('\n=== [6] Log dosyasi sifirlaniyor ===')
    run(ssh, 'truncate -s 0 /tmp/r2_fresh_migration.log 2>/dev/null || true')
    run(ssh, 'rm -f /tmp/r2_fresh_progress.txt 2>/dev/null || true')

    print('\n=== [7] Worker nohup ile baslatiliyor ===')
    run(ssh, 'nohup python3 /tmp/r2_fresh_worker.py >> /tmp/r2_fresh_migration.log 2>&1 &', timeout=10)

    import time
    time.sleep(4)
    r = run(ssh, "pgrep -f r2_fresh_worker.py || echo 'BASLAMADI'")
    if 'BASLAMADI' in r:
        print('  HATA: Worker baslamadi! Son log:')
        print(run(ssh, 'tail -30 /tmp/r2_fresh_migration.log'))
    else:
        print(f'  Worker baslatildi, PID={r}')
        print('\n  Ilk log:')
        print(run(ssh, 'cat /tmp/r2_fresh_migration.log'))

    ssh.close()
    print('\nDurum icin: python deploy/r2_fresh_migration.py --status')


def cmd_status():
    ssh = make_ssh()

    print('=== Worker durumu ===')
    r = run(ssh, "ps aux | grep '[r]2_fresh_worker.py' | awk '{print $2}'")
    if r:
        print(f'CALISIYOR (PID={r})')
    else:
        print('DURDU / TAMAMLANDI')

    print('\n=== Progress ===')
    print(run(ssh, 'cat /tmp/r2_fresh_progress.txt 2>/dev/null || echo "Henuz yok"'))

    print('\n=== Son log (30 satir) ===')
    print(run(ssh, 'tail -30 /tmp/r2_fresh_migration.log 2>/dev/null'))

    print('\n=== DB ImageMigrationLog ozet ===')
    sql = r"""
SELECT "Status", COUNT(*) AS adet
FROM "ImageMigrationLog"
GROUP BY "Status"
ORDER BY adet DESC;
"""
    print(run_sql(ssh, sql))

    ssh.close()


def cmd_stop():
    ssh = make_ssh()
    r = run(ssh, "pkill -f 'python3 /tmp/r2_fresh_worker.py' && echo 'DURDURULDU' || echo 'Zaten calismiyor'")
    print(r)
    ssh.close()


# =============================================================================
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
