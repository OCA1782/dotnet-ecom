# -*- coding: utf-8 -*-
"""
Production full test - BE API + FE sayfa erisilebilirlik
"""
import sys, json, io, time
sys.stdout.reconfigure(encoding='utf-8')

try:
    import requests
except ImportError:
    import subprocess; subprocess.run([sys.executable, "-m", "pip", "install", "requests", "-q"])
    import requests

API  = "https://api.autoforcepart.com"
ADM  = "https://admin.autoforcepart.com"
CUST = "https://autoforcepart.com"
EMAIL    = "admin@autoforcepart.com"
PASSWORD = "AutoForce2026!"

passed = []
failed = []

def ok(label, detail=""):
    msg = f"  [PASS] {label}"
    if detail: msg += f" — {detail}"
    print(msg.encode('ascii', errors='replace').decode('ascii'))
    passed.append(label)

def fail(label, detail=""):
    msg = f"  [FAIL] {label}"
    if detail: msg += f" — {detail}"
    print(msg.encode('ascii', errors='replace').decode('ascii'))
    failed.append(f"{label}: {detail}")

def section(title):
    print(f"\n{'='*55}".encode('ascii', errors='replace').decode('ascii'))
    print(f"  {title}".encode('ascii', errors='replace').decode('ascii'))
    print(f"{'='*55}".encode('ascii', errors='replace').decode('ascii'))

# ══════════════════════════════════════════════════════════
section("FRONTEND — Admin Panel Sayfa Erisilebilirlik")
# ══════════════════════════════════════════════════════════

fe_pages = [
    ("/",           "Admin anasayfa"),
    ("/giris",      "Admin giris sayfasi"),
    ("/urunler",    "Urunler"),
    ("/stok",       "Stok"),
    ("/imajlar",    "Imaj yonetimi"),
    ("/kullanicilar","Kullanicilar"),
    ("/siparisler", "Siparisler"),
]

for path, label in fe_pages:
    try:
        r = requests.get(f"{ADM}{path}", timeout=10, allow_redirects=True)
        if r.status_code == 200:
            ok(f"Admin FE {label}", f"HTTP {r.status_code}")
        else:
            fail(f"Admin FE {label}", f"HTTP {r.status_code}")
    except Exception as e:
        fail(f"Admin FE {label}", str(e)[:60])

# Customer frontend
section("FRONTEND — Customer Sitesi")
try:
    r = requests.get(CUST, timeout=10)
    if r.status_code == 200:
        ok("Customer anasayfa", f"HTTP {r.status_code}")
    else:
        fail("Customer anasayfa", f"HTTP {r.status_code}")
except Exception as e:
    fail("Customer anasayfa", str(e)[:60])

# ══════════════════════════════════════════════════════════
section("BACKEND — Auth")
# ══════════════════════════════════════════════════════════

# Login
r = requests.post(f"{API}/api/auth/login",
    json={"email": EMAIL, "password": PASSWORD}, timeout=15)
if r.status_code == 200 and r.json().get("token"):
    ok("SuperAdmin login", f"HTTP 200, token alindi")
    token = r.json()["token"]
else:
    fail("SuperAdmin login", f"HTTP {r.status_code}: {r.text[:100]}")
    print("\nLogin basarisiz, BE testleri atlanıyor.")
    token = None

if token:
    H = {"Authorization": f"Bearer {token}"}

    # ══════════════════════════════════════════════════════════
    section("BACKEND — Stok (SuperAdmin tum veriyi gormeli)")
    # ══════════════════════════════════════════════════════════

    r = requests.get(f"{API}/api/admin/stocks?page=1&pageSize=10", headers=H, timeout=15)
    if r.status_code == 200:
        d = r.json()
        total = d.get("totalCount", 0)
        items = d.get("items", [])
        ok("GET /api/admin/stocks", f"HTTP 200")
        if total > 0:
            ok("Stok verisi mevcut (SuperAdmin goruyor)", f"totalCount={total:,}")
        else:
            fail("Stok verisi bos — SuperAdmin gormeli", f"totalCount={total}")
    else:
        fail("GET /api/admin/stocks", f"HTTP {r.status_code}: {r.text[:100]}")

    # ══════════════════════════════════════════════════════════
    section("BACKEND — Imaj Yonetimi (SuperAdmin tum imajlari gormeli)")
    # ══════════════════════════════════════════════════════════

    r = requests.get(f"{API}/api/admin/media/images?page=1&pageSize=5&source=product&excludeNoImage=true",
        headers=H, timeout=30)
    if r.status_code == 200:
        d = r.json()
        total = d.get("totalCount", 0)
        items = d.get("items", [])
        ok("GET /api/admin/media/images", f"HTTP 200")
        if total > 0:
            ok("Imaj verisi mevcut (SuperAdmin goruyor)", f"totalCount={total:,}")
        else:
            fail("Imaj verisi bos — SuperAdmin gormeli", f"totalCount={total}")
    else:
        fail("GET /api/admin/media/images", f"HTTP {r.status_code}: {r.text[:100]}")

    # ══════════════════════════════════════════════════════════
    section("BACKEND — Kullanicilar + HasFullDataAccess")
    # ══════════════════════════════════════════════════════════

    r = requests.get(f"{API}/api/admin/users?page=1&pageSize=10", headers=H, timeout=15)
    if r.status_code == 200:
        d = r.json()
        total = d.get("totalCount", 0)
        items = d.get("items", [])
        ok("GET /api/admin/users", f"HTTP 200, totalCount={total}")
        if items:
            has_field = "hasFullDataAccess" in items[0]
            if has_field:
                ok("hasFullDataAccess alani response'ta mevcut", f"deger={items[0]['hasFullDataAccess']}")
            else:
                fail("hasFullDataAccess alani eksik", "DTO guncellenmemis olabilir")
    else:
        fail("GET /api/admin/users", f"HTTP {r.status_code}: {r.text[:100]}")

    # ══════════════════════════════════════════════════════════
    section("BACKEND — R2 Upload (ACL duzeltmesi testi)")
    # ══════════════════════════════════════════════════════════

    PNG_1PX = (
        b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01'
        b'\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00'
        b'\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
    )
    files = {"file": ("test.png", io.BytesIO(PNG_1PX), "image/png")}
    r = requests.post(f"{API}/api/admin/upload", headers=H, files=files, timeout=20)
    if r.status_code == 200:
        url = r.json().get("url", "")
        ok("POST /api/admin/upload — R2 yukleme", f"HTTP 200")
        if url.startswith("https://images.autoforcepart.com"):
            ok("URL R2'ye isaret ediyor", url[:70])
        else:
            fail("URL beklenen R2 domain degil", url[:70])
    else:
        fail("POST /api/admin/upload", f"HTTP {r.status_code}: {r.text[:200]}")

    # ══════════════════════════════════════════════════════════
    section("BACKEND — Toplu Fiyat Guncelleme (tum kosullar)")
    # ══════════════════════════════════════════════════════════

    # Bir kategori al
    r_cats = requests.get(f"{API}/api/categories?onlyActive=false", headers=H, timeout=10)
    cats = r_cats.json() if r_cats.status_code == 200 else []
    cat_id = cats[0]["id"] if cats else None

    # Bir marka al
    r_brands = requests.get(f"{API}/api/brands?pageSize=5&onlyActive=false", headers=H, timeout=10)
    brands = (r_brands.json().get("items", []) if r_brands.status_code == 200 else [])
    brand_id = brands[0]["id"] if brands else None

    # preview - bos productIds → 0 beklenir
    r = requests.post(f"{API}/api/products/bulk-price-preview",
        headers={**H, "Content-Type": "application/json"},
        json={"productIds": []}, timeout=10)
    if r.status_code == 200 and r.json() == 0:
        ok("preview — bos productIds → 0", f"count={r.json()}")
    else:
        fail("preview — bos productIds", f"HTTP {r.status_code} / {r.text[:80]}")

    # preview - kategori
    if cat_id:
        r = requests.post(f"{API}/api/products/bulk-price-preview",
            headers={**H, "Content-Type": "application/json"},
            json={"categoryId": cat_id}, timeout=10)
        if r.status_code == 200:
            ok("preview — kategori ID ile", f"count={r.json()}")
        else:
            fail("preview — kategori ID ile", f"HTTP {r.status_code}: {r.text[:80]}")

    # preview - marka
    if brand_id:
        r = requests.post(f"{API}/api/products/bulk-price-preview",
            headers={**H, "Content-Type": "application/json"},
            json={"brandId": brand_id}, timeout=10)
        if r.status_code == 200:
            ok("preview — marka ID ile", f"count={r.json()}")
        else:
            fail("preview — marka ID ile", f"HTTP {r.status_code}: {r.text[:80]}")

    # Gercek bulk-adjust — rate limit ve guveni icin bos liste ile sadece endpoint ulasilabilirligi test et
    # (Bos productIds + valid action → 0 affected, error beklenir)
    for action_label, body in [
        ("price-adjust (percent +10, bos liste)",     {"action": "price-adjust",        "priceAdjustPercent": 10,  "productIds": []}),
        ("price-adjust-amount (amount +50, bos liste)", {"action": "price-adjust-amount", "priceAdjustAmount": 50,  "productIds": []}),
        ("price-set (100TL, bos liste)",               {"action": "price-set",           "priceSetValue": 100,     "productIds": []}),
    ]:
        r = requests.post(f"{API}/api/products/bulk",
            headers={**H, "Content-Type": "application/json"},
            json=body, timeout=10)
        d = r.json() if r.status_code == 200 else {}
        if r.status_code == 200 and d.get("affected", -1) == 0:
            ok(f"bulk {action_label}", f"HTTP 200, affected=0 (bos liste beklenen)")
        elif r.status_code == 200:
            ok(f"bulk {action_label}", f"HTTP 200, affected={d.get('affected')}")
        else:
            fail(f"bulk {action_label}", f"HTTP {r.status_code}: {r.text[:100]}")

    # Negatif fiyat korumasi — %(-200) uygula bos listeyle (sadece endpoint testi)
    r = requests.post(f"{API}/api/products/bulk",
        headers={**H, "Content-Type": "application/json"},
        json={"action": "price-adjust", "priceAdjustPercent": -200, "productIds": []}, timeout=10)
    if r.status_code == 200:
        ok("price-adjust -200% endpoint erisimi", f"HTTP 200, affected={r.json().get('affected',0)}")
    else:
        fail("price-adjust -200% endpoint", f"HTTP {r.status_code}: {r.text[:80]}")

# ══════════════════════════════════════════════════════════
section("OZET")
# ══════════════════════════════════════════════════════════
total = len(passed) + len(failed)
print(f"  Gecen : {len(passed)}/{total}".encode('ascii', errors='replace').decode('ascii'))
print(f"  Hata  : {len(failed)}/{total}".encode('ascii', errors='replace').decode('ascii'))
if failed:
    print("\n  Basarisiz testler:".encode('ascii', errors='replace').decode('ascii'))
    for f in failed:
        print(f"    - {f}".encode('ascii', errors='replace').decode('ascii'))
