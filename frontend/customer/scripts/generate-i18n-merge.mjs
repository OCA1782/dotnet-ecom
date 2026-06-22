// Faz 2 Step 1: i18n.ts için merge içeriği üretir
// Çalıştır: node --experimental-strip-types scripts/generate-i18n-merge.mjs
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pagesDir = join(__dirname, '../src/lib/i18n/pages');

// Mevcut i18n.ts'deki key'ler (çakışma kontrolü — bunları atla)
const existingKeys = new Set([
  'nav.home','nav.products','nav.cart','nav.login','nav.register',
  'nav.my_account','nav.my_orders','nav.my_addresses','nav.my_favorites',
  'nav.my_reviews','nav.my_coupons','nav.my_invoices','nav.my_returns',
  'nav.logout','nav.search_placeholder',
  'home.categories','home.categories_desc','home.all','home.see_all',
  'home.featured','home.featured_desc','home.discounts','home.discounts_desc',
  'home.campaigns','home.campaigns_desc',
  'benefit.fast_shipping','benefit.fast_shipping_desc','benefit.secure_payment',
  'benefit.secure_payment_desc','benefit.easy_return','benefit.easy_return_desc',
  'benefit.support','benefit.support_desc',
  'hero.badge','hero.title1','hero.title2','hero.desc','hero.cta_shop','hero.cta_campaigns',
  'product.add_to_cart','product.buy_now','product.out_of_stock','product.review',
  'product.featured_badge','product.new_badge','product.sale_badge',
  'cart.title','cart.empty','cart.total','cart.checkout','cart.continue_shopping','cart.items',
  'common.loading','common.save','common.cancel','common.close','common.search',
  'common.filter','common.sort','common.back','common.view_all',
  'auth.email','auth.password','auth.remember_me','auth.login','auth.logging_in',
  'auth.register','auth.no_account','auth.have_account','auth.forgot_password',
  'auth.google_continue','auth.or','auth.error',
  'header.account','header.orders','header.favorites','header.addresses',
  'header.invoices','header.returns','header.coupons','header.reviews',
  'header.logout','header.greeting','header.search.view_all_products','header.search.all_results',
  'footer.account','footer.help','footer.corporate','footer.contact',
  'footer.login','footer.register','footer.faq','footer.returns_exchange',
  'footer.shipment_tracking','footer.about','footer.privacy','footer.safe_payment',
  'footer.copyright','footer.tagline',
  'social.instagram','social.x','social.youtube','social.linkedin',
  'chat.error',
]);

const langs = ['tr','en','de','es'];
const merged = { tr: {}, en: {}, de: {}, es: {} };

const modules = [
  'ana-sayfa', 'auth', 'sepet', 'odeme', 'hesabim',
  'siparisler', 'hesabim-sub', 'urunler', 'diger'
];

for (const modName of modules) {
  const filePath = join(pagesDir, `${modName}.ts`);
  const src = readFileSync(filePath, 'utf-8');

  // Parse each lang block
  for (const lang of langs) {
    // Find `  tr: {` (with leading spaces/newlines)
    const startMarker = `  ${lang}: {`;
    const startIdx = src.indexOf(startMarker);
    if (startIdx === -1) { console.warn(`No ${lang} block in ${modName}`); continue; }

    // Find the matching closing brace
    const blockStart = startIdx + startMarker.length;
    let depth = 1;
    let i = blockStart;
    while (i < src.length && depth > 0) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}') depth--;
      i++;
    }
    const block = src.slice(blockStart, i - 1);

    // Extract key-value pairs — handles double-quoted strings with embedded special chars
    // Pattern: "key": "value"  — keys don't have quotes inside them
    const lines = block.split('\n');
    for (const line of lines) {
      // Match: "key": "value"  (double quotes, may have escaped chars or apostrophes in value)
      const m = line.match(/^\s*"([^"]+)"\s*:\s*"(.*?)(?<!\\)",?\s*$/);
      if (!m) continue;
      const key = m[1];
      const val = m[2];
      if (!existingKeys.has(key)) {
        merged[lang][key] = val;
      }
    }
  }
}

function generateBlock(dict) {
  return Object.entries(dict)
    .map(([k, v]) => {
      const escaped = v.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      return `    '${k}': '${escaped}'`;
    })
    .join(',\n');
}

const counts = langs.map(l => `${l.toUpperCase()}: ${Object.keys(merged[l]).length}`).join(', ');
console.log('KEY COUNTS:', counts);

for (const lang of langs) {
  const out = generateBlock(merged[lang]);
  writeFileSync(join(__dirname, `i18n-merge-${lang}.txt`), out, 'utf-8');
  console.log(`Written i18n-merge-${lang}.txt (${out.split('\n').length} lines)`);
}
