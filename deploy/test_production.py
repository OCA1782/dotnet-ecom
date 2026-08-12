# -*- coding: utf-8 -*-
"""Production live test - tum duzeltmeleri test eder"""
import sys, json, io
sys.stdout.reconfigure(encoding='utf-8')

try:
    import requests
except ImportError:
    import subprocess; subprocess.run([sys.executable, "-m", "pip", "install", "requests", "-q"])
    import requests

BASE = "https://api.autoforcepart.com"
EMAIL = "admin@autoforcepart.com"
PASSWORD = "AutoForce2026!"

def p(t):
    print(t.encode('ascii', errors='replace').decode('ascii'))

def status(label, ok, detail=""):
    icon = "OK" if ok else "FAIL"
    msg = f"[{icon}] {label}"
    if detail: msg += f": {detail}"
    p(msg)

# ─── 1. LOGIN ────────────────────────────────────────────────────────────────
p("\n=== 1. LOGIN ===")
r = requests.post(f"{BASE}/api/auth/admin/login",
    json={"email": EMAIL, "password": PASSWORD}, timeout=15)
status("POST /api/auth/admin/login", r.status_code == 200, f"HTTP {r.status_code}")

if r.status_code != 200:
    p(f"  Response: {r.text[:300]}")
    p("Login basarisiz, test durduruluyor.")
    sys.exit(1)

data = r.json()
token = data.get("token", "")
status("Token alindi", bool(token), f"...{token[-20:]}" if token else "YOK")

headers = {"Authorization": f"Bearer {token}"}

# ─── 2. STOK ─────────────────────────────────────────────────────────────────
p("\n=== 2. STOK EKRANI ===")
r = requests.get(f"{BASE}/api/admin/stocks?page=1&pageSize=5", headers=headers, timeout=15)
status("GET /api/admin/stocks", r.status_code == 200, f"HTTP {r.status_code}")
if r.status_code == 200:
    d = r.json()
    total = d.get("totalCount", 0)
    items = len(d.get("items", []))
    status("Stok verisi", total > 0, f"totalCount={total}, sayfa icindeki={items}")
    if items > 0:
        p(f"  Ornek: {d['items'][0].get('productName','?')} — miktar: {d['items'][0].get('quantity','?')}")
else:
    p(f"  Hata: {r.text[:200]}")

# ─── 3. IMAJLAR ──────────────────────────────────────────────────────────────
p("\n=== 3. IMAJ YONETIMI EKRANI ===")
r = requests.get(f"{BASE}/api/admin/media/images?page=1&pageSize=5&source=product&excludeNoImage=true",
    headers=headers, timeout=30)
status("GET /api/admin/media/images", r.status_code == 200, f"HTTP {r.status_code}")
if r.status_code == 200:
    d = r.json()
    total = d.get("totalCount", 0)
    items = len(d.get("items", []))
    status("Imaj verisi", total > 0, f"totalCount={total}, sayfa icindeki={items}")
    if items > 0:
        p(f"  Ornek: {d['items'][0].get('sourceName','?')} — {d['items'][0].get('url','?')[:60]}")
else:
    p(f"  Hata: {r.text[:200]}")

# ─── 4. KULLANICILAR + HasFullDataAccess ─────────────────────────────────────
p("\n=== 4. KULLANICILAR + HasFullDataAccess ALANI ===")
r = requests.get(f"{BASE}/api/admin/users?page=1&pageSize=5", headers=headers, timeout=15)
status("GET /api/admin/users", r.status_code == 200, f"HTTP {r.status_code}")
if r.status_code == 200:
    d = r.json()
    total = d.get("totalCount", 0)
    items = d.get("items", [])
    status("Kullanici listesi", total > 0, f"totalCount={total}")
    if items:
        first = items[0]
        has_field = "hasFullDataAccess" in first
        status("hasFullDataAccess alani mevcut", has_field,
               f"deger={first.get('hasFullDataAccess','YOK')}")
        p(f"  Ornek kullanici: {first.get('email','?')} — roller: {first.get('roles','?')}")
else:
    p(f"  Hata: {r.text[:200]}")

# ─── 5. AVATAR UPLOAD (R2) ───────────────────────────────────────────────────
p("\n=== 5. AVATAR UPLOAD (R2 ACL DUZELTMESI) ===")
# 1x1 px minimal PNG
PNG_1PX = (
    b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01'
    b'\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00'
    b'\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
)
files = {"file": ("test.png", io.BytesIO(PNG_1PX), "image/png")}
r = requests.post(f"{BASE}/api/admin/upload", headers=headers, files=files, timeout=20)
status("POST /api/admin/upload", r.status_code == 200, f"HTTP {r.status_code}")
if r.status_code == 200:
    d = r.json()
    url = d.get("url", "")
    status("R2 URL alindi", url.startswith("https://images.autoforcepart.com"), url[:70])
else:
    p(f"  Hata: {r.text[:300]}")

# ─── 6. TOPLU FIYAT GUNCELLEME ───────────────────────────────────────────────
p("\n=== 6. TOPLU FIYAT GUNCELLEME ===")

# 6a. Preview - secili urun yok → 0 donmeli
r = requests.post(f"{BASE}/api/products/bulk-price-preview",
    headers={**headers, "Content-Type": "application/json"},
    json={"productIds": []}, timeout=10)
status("POST /bulk-price-preview (bos liste)", r.status_code == 200, f"HTTP {r.status_code}")
if r.status_code == 200:
    p(f"  count={r.json()}")

# 6b. Preview - bir kategori ID al
r_cats = requests.get(f"{BASE}/api/categories?onlyActive=false", headers=headers, timeout=10)
cats = r_cats.json() if r_cats.status_code == 200 else []
cat_id = cats[0].get("id") if cats else None

if cat_id:
    r = requests.post(f"{BASE}/api/products/bulk-price-preview",
        headers={**headers, "Content-Type": "application/json"},
        json={"categoryId": cat_id}, timeout=10)
    status(f"POST /bulk-price-preview (categoryId)", r.status_code == 200, f"HTTP {r.status_code}")
    if r.status_code == 200:
        count = r.json()
        status("Kategori preview sayisi", count >= 0, f"count={count}")

# 6c. price-adjust (percent) - hedef kategori, DRY RUN degil ama mevcut fiyatla ayni % → 0 etki
# Gercek degisiklik yapmamak icin sadece endpoint erisilebilirligini test et
r = requests.post(f"{BASE}/api/products/bulk",
    headers={**headers, "Content-Type": "application/json"},
    json={"action": "price-adjust", "priceAdjustPercent": 0, "productIds": []},
    timeout=10)
# 0 percent ve bos liste → validation hatasi bekleniyor (ama 401/403 degil)
status("POST /api/products/bulk erisim (validation hatasi beklenir)", r.status_code in [200, 400], f"HTTP {r.status_code}")
if r.status_code == 200:
    d = r.json()
    p(f"  affected={d.get('affected')}, errors={d.get('errors')}")

p("\n=== TEST TAMAMLANDI ===")
