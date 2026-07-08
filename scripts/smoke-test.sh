#!/usr/bin/env bash
# smoke-test.sh — Ecom kritik özellik doğrulama scripti
# Kullanım: bash scripts/smoke-test.sh
# Her değişiklik öncesi ve sonrası çalıştır. Tüm testler PASS olmalı.

API="http://localhost:5124"
FRONTEND="http://localhost:3000"
PASS=0
FAIL=0
SKIP=0

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

pass() { echo -e "${GREEN}PASS${NC} $1"; PASS=$((PASS+1)); }
fail() { echo -e "${RED}FAIL${NC} $1"; FAIL=$((FAIL+1)); }
skip() { echo -e "${YELLOW}SKIP${NC} $1"; SKIP=$((SKIP+1)); }

echo "════════════════════════════════════════"
echo -e "${BOLD} Ecom Smoke Test — $(date '+%Y-%m-%d %H:%M')${NC}"
echo "════════════════════════════════════════"

# ── 1. BACKEND SAĞLIK ────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}[ Backend API ]${NC}"

HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$API/api/products?page=1&pageSize=1" 2>/dev/null || true)
if [ "$HTTP" = "200" ]; then
  pass "API /api/products → 200"
else
  fail "API /api/products → $HTTP (backend çalışıyor mu?)"
fi

# ── 2. FEATURED ÜRÜNLER ──────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}[ Featured Ürünler ]${NC}"

FEATURED_RESP=$(curl -s --max-time 5 "$API/api/products?page=1&pageSize=20&featured=true" 2>/dev/null || true)
FEATURED_COUNT=$(echo "$FEATURED_RESP" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const r=JSON.parse(d);process.stdout.write(String(r.items?.length||0));}catch{process.stdout.write('0');}})" 2>/dev/null || echo "0")

if [ "${FEATURED_COUNT:-0}" -ge 8 ] 2>/dev/null; then
  pass "Featured ürün sayısı: $FEATURED_COUNT (≥8)"
else
  fail "Featured ürün sayısı: ${FEATURED_COUNT:-0} (beklenen ≥8) — DB'de UPDATE TOP 8 Products SET IsFeatured=1 gerekli"
fi

# ── 3. KATEGORİ UUID SORGU HIZI ──────────────────────────────────────────────
echo ""
echo -e "${BOLD}[ CategoryId Sorgu Hızı ]${NC}"

CAT_RESP=$(curl -s --max-time 5 "$API/api/categories?showInVehicleNav=true" 2>/dev/null || true)
CAT_ID=$(echo "$CAT_RESP" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const data=JSON.parse(d);const opel=data.find(b=>b.name==='Opel');const af=opel?.subCategories?.find(m=>m.name==='Astra F');process.stdout.write(af?.id||'');}catch{process.stdout.write('');}})" 2>/dev/null || true)

if [ -z "${CAT_ID:-}" ]; then
  skip "CategoryId hız testi — Opel/Astra F kategorisi bulunamadı"
else
  START_S=$(date +%s)
  START_MS=$(date +%s%3N 2>/dev/null || echo "$((START_S * 1000))")
  HTTP2=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$API/api/products?page=1&pageSize=24&categoryId=$CAT_ID" 2>/dev/null || true)
  END_MS=$(date +%s%3N 2>/dev/null || echo "$(($(date +%s) * 1000))")
  ELAPSED=$((END_MS - START_MS))
  if [ "$HTTP2" = "200" ] && [ "$ELAPSED" -lt 2000 ]; then
    pass "CategoryId sorgusu: ${ELAPSED}ms (<2s) — indexed FK ✓"
  elif [ "$HTTP2" = "200" ]; then
    fail "CategoryId sorgusu yavaş: ${ELAPSED}ms (beklenen <2000ms)"
  else
    fail "CategoryId sorgusu HTTP ${HTTP2:-err}"
  fi
fi

# ── 4. FRONTEND SAYFALAR ─────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}[ Frontend Sayfalar ]${NC}"

FE_HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 12 "$FRONTEND/" 2>/dev/null || true)
if [ "$FE_HTTP" = "200" ]; then
  pass "Anasayfa → 200"
else
  skip "Anasayfa → ${FE_HTTP:-err} (frontend çalışıyor mu?)"
fi

URUNLER_HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 12 "$FRONTEND/urunler" 2>/dev/null || true)
if [ "$URUNLER_HTTP" = "200" ]; then
  pass "/urunler → 200"
else
  skip "/urunler → ${URUNLER_HTTP:-err}"
fi

# ── 5. ANASAYFA BÖLÜM KONTROLÜ ───────────────────────────────────────────────
echo ""
echo -e "${BOLD}[ Anasayfa Bölümleri ]${NC}"

if [ "$FE_HTTP" = "200" ]; then
  HOME_HTML=$(curl -s --max-time 20 "$FRONTEND/" 2>/dev/null || true)
  if echo "$HOME_HTML" | grep -q "Öne Çıkan Ürünler" 2>/dev/null; then
    pass "Anasayfa: 'Öne Çıkan Ürünler' bölümü render"
  else
    fail "Anasayfa: 'Öne Çıkan Ürünler' görünmüyor (featured ürün var mı?)"
  fi
  if echo "$HOME_HTML" | grep -q "Haftanın Fırsatları" 2>/dev/null; then
    pass "Anasayfa: 'Haftanın Fırsatları' bölümü render"
  else
    fail "Anasayfa: 'Haftanın Fırsatları' görünmüyor (indirimli ürün var mı?)"
  fi
else
  skip "Anasayfa bölüm kontrolü — frontend erişilemiyor"
  skip "Anasayfa bölüm kontrolü — frontend erişilemiyor"
fi

# ── 6. BREADCRUMB (URL parametreli) ──────────────────────────────────────────
echo ""
echo -e "${BOLD}[ Breadcrumb ]${NC}"

if [ "$FE_HTTP" = "200" ] && [ -n "${CAT_ID:-}" ]; then
  BCRUMB_HTML=$(curl -s --max-time 20 "$FRONTEND/urunler?kategoriler=$CAT_ID&arac=Astra%20F&marka=Opel" 2>/dev/null || true)
  if echo "$BCRUMB_HTML" | grep -q "Opel Astra F" 2>/dev/null; then
    pass "Breadcrumb h1: 'Opel Astra F'"
  else
    fail "Breadcrumb h1 eksik — params.marka/arac birleşik gösterim çalışmıyor"
  fi
  if echo "$BCRUMB_HTML" | grep -q "marka=Opel" 2>/dev/null; then
    pass "Breadcrumb Opel linki mevcut"
  else
    fail "Breadcrumb Opel linki eksik"
  fi
else
  skip "Breadcrumb testi — frontend veya categoryId erişilemiyor"
  skip "Breadcrumb testi — frontend veya categoryId erişilemiyor"
fi

# ── 7. KOD YAPISI KONTROLLERI ────────────────────────────────────────────────
echo ""
echo -e "${BOLD}[ Kod Yapısı ]${NC}"

SPNAV="frontend/customer/src/components/templates/SparePartsBrandNav.tsx"
PAGE="frontend/customer/src/app/urunler/page.tsx"
LAYOUT="frontend/customer/src/app/layout.tsx"

if grep -q "if (!isPending)" "$SPNAV" 2>/dev/null; then
  pass "SparePartsBrandNav: navigatingTo isPending ile temizleniyor"
else
  fail "SparePartsBrandNav: navigatingTo temizleme kodu eksik"
fi

if grep -q "cancelClickCount" "$SPNAV" 2>/dev/null; then
  pass "SparePartsBrandNav: 4-tıklama overlay iptali var"
else
  fail "SparePartsBrandNav: cancelClickCount eksik"
fi

if grep -q "kategoriler=\${model.id}" "$SPNAV" 2>/dev/null; then
  pass "SparePartsBrandNav: handleModelClick kategoriler UUID kullanıyor"
else
  fail "SparePartsBrandNav: handleModelClick kategoriler eksik — LIKE sorgusu çok yavaş!"
fi

if grep -q "params.arac && !params.kategoriler" "$PAGE" 2>/dev/null; then
  pass "urunler/page.tsx: vehicleModel LIKE kategoriler varsa skip"
else
  fail "urunler/page.tsx: LIKE skip kodu eksik"
fi

if grep -q "params.marka" "$PAGE" 2>/dev/null; then
  pass "urunler/page.tsx: marka breadcrumb parametresi var"
else
  fail "urunler/page.tsx: marka parametresi eksik"
fi

if grep -q "force-dynamic" "$PAGE" 2>/dev/null; then
  pass "urunler/page.tsx: force-dynamic mevcut"
else
  fail "urunler/page.tsx: force-dynamic eksik — settings stale kalır!"
fi

if grep -q "SparePartsBrandNav" "$LAYOUT" 2>/dev/null; then
  pass "layout.tsx: SparePartsBrandNav sticky header içinde"
else
  fail "layout.tsx: SparePartsBrandNav eksik — nav tüm sayfalarda görünmez"
fi

# ── ÖZET ─────────────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════"
TOTAL=$((PASS + FAIL + SKIP))
echo " Toplam: $TOTAL  PASS: $PASS  FAIL: $FAIL  SKIP: $SKIP"
echo "════════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}${BOLD}SONUÇ: $FAIL test başarısız — commit etme!${NC}"
  exit 1
else
  echo -e "${GREEN}${BOLD}SONUÇ: Tüm testler geçti ✓${NC}"
  exit 0
fi
