import Link from "next/link";
import { getSettings } from "@/lib/settings";

function IconInstagram() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.849L1.254 2.25H8.08l4.258 5.632L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

function IconYouTube() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function IconLinkedIn() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export default async function Footer() {
  const settings = await getSettings();

  const siteName = settings.SiteName || "Keyvora";
  const logoUrl = settings.LogoUrl || "/logo-icon.png";
  const tagline = settings.Footer_Tagline || "Keyifli alışverişin yeni adresi.\nSevdiğin ürünler, güvenli ödeme.";
  const email = settings.ContactEmail || "";
  const phone = settings.ContactPhone || "";

  const socials = [
    { icon: <IconInstagram />, label: "Instagram", url: settings.SocialInstagram || "" },
    { icon: <IconX />, label: "X", url: settings.SocialTwitter || "" },
    { icon: <IconYouTube />, label: "YouTube", url: settings.SocialYoutube || "" },
    { icon: <IconLinkedIn />, label: "LinkedIn", url: settings.SocialLinkedin || "" },
  ].filter(s => s.url);

  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#12304A] text-slate-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Marka */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 bg-white rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt={siteName} className="w-full h-full object-contain p-0.5" />
              </div>
              <span className="text-white font-bold text-xl">{siteName}</span>
            </div>
            <p className="text-sm text-slate-400 mb-5 leading-relaxed whitespace-pre-line">
              {tagline}
            </p>
            {socials.length > 0 ? (
              <div className="flex gap-2">
                {socials.map(s => (
                  <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                    className="w-9 h-9 bg-white/10 hover:bg-[#19B7B1] rounded-xl flex items-center justify-center text-slate-300 hover:text-white transition-all duration-200">
                    {s.icon}
                  </a>
                ))}
              </div>
            ) : (
              <div className="flex gap-2">
                {[
                  { icon: <IconInstagram />, label: "Instagram" },
                  { icon: <IconX />, label: "X" },
                  { icon: <IconYouTube />, label: "YouTube" },
                  { icon: <IconLinkedIn />, label: "LinkedIn" },
                ].map(s => (
                  <a key={s.label} href="#" aria-label={s.label}
                    className="w-9 h-9 bg-white/10 hover:bg-[#19B7B1] rounded-xl flex items-center justify-center text-slate-300 hover:text-white transition-all duration-200">
                    {s.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Hesabım */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Hesabım</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/giris" className="hover:text-white transition">Giriş Yap</Link></li>
              <li><Link href="/kayit" className="hover:text-white transition">Kayıt Ol</Link></li>
              <li><Link href="/hesabim/siparisler" className="hover:text-white transition">Siparişlerim</Link></li>
              <li><Link href="/hesabim/adresler" className="hover:text-white transition">Adreslerim</Link></li>
            </ul>
          </div>

          {/* Yardım */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Yardım</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/sss" className="hover:text-white transition">SSS</Link></li>
              <li><Link href="/iade-degisim" className="hover:text-white transition">İade & Değişim</Link></li>
              <li><Link href="/kargo-takibi" className="hover:text-white transition">Kargo Takibi</Link></li>
              <li><Link href="/iletisim" className="hover:text-white transition">İletişim</Link></li>
            </ul>
          </div>

          {/* Kurumsal + İletişim */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Kurumsal</h4>
            <ul className="space-y-2.5 text-sm mb-5">
              <li><Link href="/hakkimizda" className="hover:text-white transition">Hakkımızda</Link></li>
              <li><Link href="/kvkk" className="hover:text-white transition">KVKK</Link></li>
              <li><Link href="/gizlilik" className="hover:text-white transition">Gizlilik Politikası</Link></li>
            </ul>
            {(email || phone) && (
              <div className="space-y-1.5 text-xs text-slate-500">
                <p className="text-slate-400 font-medium text-sm">İletişim</p>
                {email && <p>{email}</p>}
                {phone && <p>{phone}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Ödeme yöntemleri */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">© {year} {siteName}. Tüm hakları saklıdır.</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 mr-1">Güvenli ödeme:</span>
            {["VISA", "MC", "TROY", "SSL"].map(p => (
              <span key={p} className="bg-white/10 text-slate-300 text-[10px] font-bold px-2 py-1 rounded-md tracking-wide">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
