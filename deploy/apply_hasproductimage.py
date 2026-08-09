# -*- coding: utf-8 -*-
import psycopg2, sys
sys.stdout.reconfigure(encoding='utf-8')

ECOM_DSN = "host=127.0.0.1 port=5435 dbname=EcomDb user=ecom password=ecom_dev_2026"
ecom = psycopg2.connect(ECOM_DSN)
cur = ecom.cursor()

# Kolon var mi?
cur.execute("""
    SELECT column_name FROM information_schema.columns
    WHERE table_name='Products' AND column_name='HasProductImage'
""")
col_exists = cur.fetchone() is not None
print(f"Kolon mevcut: {col_exists}")

if not col_exists:
    print("Kolon ekleniyor...")
    cur.execute('ALTER TABLE "Products" ADD COLUMN "HasProductImage" BOOLEAN NOT NULL DEFAULT FALSE')

    print("Backfill yapiliyor...")
    cur.execute("""
        UPDATE "Products" p
        SET "HasProductImage" = true
        WHERE EXISTS (
            SELECT 1 FROM "ProductImages" pi
            WHERE pi."ProductId" = p."Id"
              AND pi."IsDeleted" = false
              AND pi."ImageUrl" NOT LIKE '%no-image%'
        )
    """)
    print(f"  Backfill: {cur.rowcount} urun guncellendi")

    print("Index olusturuluyor...")
    cur.execute('CREATE INDEX IF NOT EXISTS "IX_Products_HasProductImage" ON "Products" ("HasProductImage")')

    cur.execute("""
        INSERT INTO "__EFMigrationsHistory" ("MigrationId","ProductVersion")
        VALUES ('20260809000001_AddHasProductImage','9.0.4')
        ON CONFLICT DO NOTHING
    """)

    ecom.commit()
    print("Commit tamamlandi.")
else:
    print("Kolon zaten var, backfill atlanıyor.")

cur.execute('SELECT COUNT(*) FROM "Products" WHERE "HasProductImage"=true')
t = cur.fetchone()[0]
cur.execute('SELECT COUNT(*) FROM "Products" WHERE "HasProductImage"=false')
f = cur.fetchone()[0]
print(f"HasProductImage=true : {t:,}")
print(f"HasProductImage=false: {f:,}")
cur.close(); ecom.close()
print("Tamamlandi.")
