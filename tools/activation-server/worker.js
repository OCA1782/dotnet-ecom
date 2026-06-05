/**
 * Ecom Lisans Aktivasyon Sunucusu — Cloudflare Worker
 *
 * Kurulum:
 *   1. https://workers.cloudflare.com → yeni Worker oluştur
 *   2. Bu dosyayı yapıştır
 *   3. Settings → Variables → VALID_HASHES secret'ını ekle (virgülle ayrılmış SHA-256 hash listesi)
 *   4. Worker URL'ini .env → LICENSE_ACTIVATION_URL'e yapıştır
 *
 * Hash nasıl hesaplanır:
 *   Node.js: require('crypto').createHash('sha256').update(licenseToken.trim()).digest('hex')
 *   PowerShell: [System.BitConverter]::ToString([System.Security.Cryptography.SHA256]::Create().ComputeHash([System.Text.Encoding]::UTF8.GetBytes($token.Trim()))).Replace('-','').ToLower()
 *   Admin Panel: Lisans Üretici'de token üretildikten sonra "Hash Kopyala" butonu (ileride eklenebilir)
 *
 * VALID_HASHES örnek değer:
 *   a3f9c1d2e8b4...,7e2a5b1c9f3d...
 */

export default {
  async fetch(request, env) {
    // CORS — yalnızca POST
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response("Bad Request", { status: 400 });
    }

    const { hash, hostname } = body;

    if (!hash || typeof hash !== "string") {
      return new Response("Bad Request: hash required", { status: 400 });
    }

    // Yetkili hash listesi (Cloudflare secret'tan okunur)
    const validHashes = (env.VALID_HASHES || "")
      .split(",")
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean);

    if (validHashes.length === 0) {
      // Secret tanımlı değilse hiçbir lisansa izin verme
      return new Response("No valid licenses configured", { status: 503 });
    }

    const isValid = validHashes.includes(hash.toLowerCase());

    if (!isValid) {
      // Yetkisiz hash — loglama için hostname de kullanılabilir
      console.log(`REJECTED: hash=${hash} hostname=${hostname}`);
      return new Response("Forbidden", { status: 403 });
    }

    console.log(`ACTIVATED: hash=${hash.slice(0, 12)}... hostname=${hostname}`);
    return new Response("OK", { status: 200 });
  },
};
