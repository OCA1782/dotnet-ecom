import sys, psycopg2
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

cat_conn = psycopg2.connect(
    host='127.0.0.1', port=5436, dbname='catalogiq',
    user='catalogiq', password='catalogiq', connect_timeout=10
)
cur = cat_conn.cursor()

SITE_ID = 'bc87db68-ebd1-4a35-8656-75ba5b422d72'

# Find SKUs that appear more than once
cur.execute("""
    SELECT "Sku", COUNT(*) as cnt
    FROM "NormalizedProducts"
    WHERE "SourceSiteId"=%s
      AND "IsDeleted"=false
      AND "Title" IS NOT NULL
      AND "Sku" IS NOT NULL
      AND "PriceCurrent">0
    GROUP BY "Sku"
    HAVING COUNT(*) > 1
    ORDER BY cnt DESC
""", (SITE_ID,))
dupes = cur.fetchall()
print(f"Toplam tekrarlayan SKU sayisi: {len(dupes):,}")
total_extra = sum(r[1]-1 for r in dupes)
print(f"Fazladan kayit sayisi: {total_extra:,}")
print()

# Analyze if they are truly identical
birebir_ayni = 0
farkli = 0
farkli_ornekler = []

for sku, cnt in dupes[:5000]:  # Check first 5000 dupe groups
    cur.execute("""
        SELECT "Title", "Brand", "PriceCurrent", "CategoryPath", "LongDescription"
        FROM "NormalizedProducts"
        WHERE "SourceSiteId"=%s AND "Sku"=%s AND "IsDeleted"=false
          AND "Title" IS NOT NULL AND "PriceCurrent">0
        ORDER BY "CreatedAt"
    """, (SITE_ID, sku))
    rows = cur.fetchall()
    titles = set(r[0] for r in rows)
    brands = set(r[1] for r in rows)
    prices = set(float(r[2]) for r in rows if r[2])

    if len(titles) == 1 and len(brands) == 1 and len(prices) <= 1:
        birebir_ayni += 1
    else:
        farkli += 1
        if len(farkli_ornekler) < 10:
            farkli_ornekler.append({
                'sku': sku,
                'count': cnt,
                'titles': list(titles)[:3],
                'brands': list(brands)[:3],
                'prices': sorted(prices)[:3],
            })

print(f"Ilk 5000 SKU grubunda:")
print(f"  Birebir ayni urun: {birebir_ayni:,}")
print(f"  Farkli urunler (farkli title/brand/fiyat): {farkli:,}")
print()

if farkli_ornekler:
    print("== Farkli icerige sahip tekrarlayan SKU ornekleri ==")
    for ex in farkli_ornekler:
        print(f"\nSKU: {ex['sku']} ({ex['count']} kayit)")
        print(f"  Basliklar: {ex['titles']}")
        print(f"  Markalar:  {ex['brands']}")
        print(f"  Fiyatlar:  {ex['prices']}")

# Full check for all dupes
print("\nTum tekrarlayan SKUlar icin analiz...")
birebir_ayni_total = 0
farkli_total = 0
for sku, cnt in dupes:
    cur.execute("""
        SELECT "Title", "Brand", "PriceCurrent"
        FROM "NormalizedProducts"
        WHERE "SourceSiteId"=%s AND "Sku"=%s AND "IsDeleted"=false
          AND "Title" IS NOT NULL AND "PriceCurrent">0
    """, (SITE_ID, sku))
    rows = cur.fetchall()
    titles = set(r[0] for r in rows)
    brands = set(r[1] for r in rows)
    prices = set(round(float(r[2]),2) for r in rows if r[2])
    if len(titles) == 1 and len(brands) == 1 and len(prices) <= 1:
        birebir_ayni_total += 1
    else:
        farkli_total += 1

print(f"TOPLAM SONUC:")
print(f"  Birebir ayni urun (duplicate satir): {birebir_ayni_total:,}")
print(f"  FARKLI urunler (ayni SKU, farkli icerik): {farkli_total:,}")

cat_conn.close()
print("Done")
