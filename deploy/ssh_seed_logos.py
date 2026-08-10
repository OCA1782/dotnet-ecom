# -*- coding: utf-8 -*-
"""
SiteSettings tablosuna varsayilan logo/favicon URL'lerini seed eder.
Mevcut kayit varsa Value'yu gunceller, yoksa INSERT eder.
"""
import os, sys, io, paramiko
sys.stdout.reconfigure(encoding='utf-8')

_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
with open(_env, encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, _, v = line.partition('=')
            if k.strip() not in os.environ:
                os.environ[k.strip()] = v.strip()

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(os.environ['DEPLOY_SSH_HOST'], username=os.environ['DEPLOY_SSH_USER'],
            password=os.environ['DEPLOY_SSH_PASSWORD'], timeout=15)

def run_sql(sql, timeout=30):
    sftp = ssh.open_sftp()
    sftp.putfo(io.BytesIO(sql.encode('utf-8')), '/tmp/_seed_logos.sql')
    sftp.close()
    _, out, err = ssh.exec_command(
        'docker exec -i ecom-postgres-1 psql -U ecom -d EcomDb < /tmp/_seed_logos.sql',
        timeout=timeout
    )
    return (out.read() + err.read()).decode('utf-8', errors='replace').strip()

LOGO_WITH_TEXT = 'https://images.autoforcepart.com/static/autoforcepart-logo-with-text.png'
LOGO_NO_TEXT   = 'https://images.autoforcepart.com/static/autoforcepart-logo-no-text.png'

settings = [
    ('AdminLogoNamed',    LOGO_WITH_TEXT, 'Appearance'),
    ('AdminLogoIcon',     LOGO_NO_TEXT,   'Appearance'),
    ('AdminFaviconUrl',   LOGO_NO_TEXT,   'Appearance'),
    ('CustomerLogoNamed', LOGO_WITH_TEXT, 'Appearance'),
    ('CustomerLogoIcon',  LOGO_NO_TEXT,   'Appearance'),
    ('CustomerFaviconUrl',LOGO_NO_TEXT,   'Appearance'),
]

# UPDATE var olanlari, INSERT olmayanları
sql_parts = []
for key, value, group in settings:
    sql_parts.append(f"""
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "SiteSettings" WHERE "Key" = '{key}' AND "IsDeleted" = false) THEN
    UPDATE "SiteSettings"
    SET "Value" = '{value}', "Group" = '{group}', "UpdatedDate" = NOW()
    WHERE "Key" = '{key}' AND "IsDeleted" = false;
  ELSE
    INSERT INTO "SiteSettings" ("Id","Key","Value","Group","CreatedDate","IsDeleted")
    VALUES (gen_random_uuid(), '{key}', '{value}', '{group}', NOW(), false);
  END IF;
END $$;
""")

print('=== Logo/Favicon seed ediliyor ===')
print(run_sql('\n'.join(sql_parts)))

print('\n=== Dogrulama ===')
verify_sql = """
SELECT "Key", "Value"
FROM "SiteSettings"
WHERE "Key" IN ('AdminLogoNamed','AdminLogoIcon','AdminFaviconUrl',
                'CustomerLogoNamed','CustomerLogoIcon','CustomerFaviconUrl')
  AND "IsDeleted" = false
ORDER BY "Key";
"""
print(run_sql(verify_sql))

ssh.close()
