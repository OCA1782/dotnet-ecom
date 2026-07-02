# -*- coding: utf-8 -*-
"""Prod API kaynak listesi + ürün sayısı kontrolü"""
import os, sys, json, urllib.request, urllib.error
sys.stdout.reconfigure(encoding='utf-8')

_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(_env):
    with open(_env, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, _, v = line.partition('=')
                if k.strip() not in os.environ:
                    os.environ[k.strip()] = v.strip()

API = os.environ.get('API_PUBLIC_URL', 'http://178.105.230.111:5124')
EMAIL = os.environ.get('SEED_ADMIN_EMAIL', 'admin@ecom.com')

def api_call(method, path, body=None, token=None):
    url = f"{API}{path}"
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        body_txt = e.read().decode('utf-8', errors='replace')
        return e.code, body_txt

# Try prod passwords
passwords = [
    os.environ.get('SEED_ADMIN_PASSWORD', ''),
    'Hl1PV64T@%y#aTqzzl#G2tLe',
]
token = None
for pw in passwords:
    if not pw:
        continue
    status, res = api_call("POST", "/api/auth/login", {"email": EMAIL, "password": pw})
    if status == 200 and isinstance(res, dict) and res.get("token"):
        token = res["token"]
        print(f"✓ Auth OK (şifre kullanıldı)")
        break
    else:
        print(f"  Auth denendi ({pw[:10]}...): {status}")

if not token:
    print("✗ Auth başarısız — token alınamadı")
    sys.exit(1)

# Ürün sayısı
status, prod = api_call("GET", "/api/admin/products?pageSize=1&page=1", token=token)
total = prod.get("totalCount", "?") if isinstance(prod, dict) else "?"
print(f"\nMevcut ürün sayısı: {total}")

# Soft-delete count (via DB is not possible via API, but total gives active count)

# External sources
status, sources = api_call("GET", "/api/admin/external-sources", token=token)
print(f"\nDış kaynaklar ({len(sources) if isinstance(sources, list) else '?'} adet):")
if isinstance(sources, list):
    for s in sources:
        print(f"  [{s['id']}]")
        print(f"    Ad: {s['name']}")
        print(f"    Tür: {s['type']}")
        print(f"    Aktif: {s['isActive']}")
        print(f"    Son çekim: {s.get('lastFetchedAt', '-')} ({s.get('lastFetchedCount', '-')} satır)")
        print()
