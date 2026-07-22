import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { st } from "@/lib/server-i18n";
import FooterLogoImg from "./FooterLogoImg";

const API_BASE = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5124";

async function getBrandNameToId(): Promise<Record<string, string>> {
  try {
    const res = await fetch(`${API_BASE}/api/brands?pageSize=500`, { cache: "no-store" });
    if (!res.ok) return {};
    const data = await res.json() as { items: { id: string; name: string }[] };
    return Object.fromEntries((data.items ?? []).map(b => [b.name.toUpperCase(), b.id]));
  } catch { return {}; }
}

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

function FooterBrandName({ name }: { name: string }) {
  const words = name.trim().split(/\s+/);
  const main = words.length >= 3 ? words.slice(0, -1).join(" ") : name;
  const sub = words.length >= 3 ? words[words.length - 1] : null;
  return (
    <span className="flex flex-col" style={{ gap: "2px" }}>
      <span style={{ fontFamily: "var(--font-pacifico, Georgia, serif)", fontWeight: 400, fontSize: "1.125rem", color: "#ffffff", lineHeight: 1.1 }}>
        {main}
      </span>
      {sub && (
        <span style={{ fontFamily: "var(--font-geist, system-ui, sans-serif)", fontWeight: 700, fontSize: "0.45rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", lineHeight: 1 }}>
          {sub}
        </span>
      )}
    </span>
  );
}

export default async function Footer() {
  const [settings, brandNameToId] = await Promise.all([getSettings(), getBrandNameToId()]);
  const [
    accountTitle,
    helpTitle,
    corporateTitle,
    contactTitle,
    loginLabel,
    registerLabel,
    ordersLabel,
    addressesLabel,
    faqLabel,
    returnsExchangeLabel,
    trackingLabel,
    contactLinkLabel,
    aboutLabel,
    privacyLabel,
    safePaymentLabel,
    copyrightLabel,
    taglineLabel,
    instagramLabel,
    xLabel,
    youtubeLabel,
    linkedinLabel,
  ] = await Promise.all([
    st("footer.account"),
    st("footer.help"),
    st("footer.corporate"),
    st("footer.contact"),
    st("footer.login"),
    st("footer.register"),
    st("header.orders"),
    st("header.addresses"),
    st("footer.faq"),
    st("footer.returns_exchange"),
    st("footer.shipment_tracking"),
    st("footer.contact"),
    st("footer.about"),
    st("footer.privacy"),
    st("footer.safe_payment"),
    st("footer.copyright"),
    st("footer.tagline"),
    st("social.instagram"),
    st("social.x"),
    st("social.youtube"),
    st("social.linkedin"),
  ]);

  const siteName = settings.SiteName || "";
  const logoUrl = settings.CustomerLogoIcon || settings.CustomerLogoNamed || undefined;
  const tagline = settings.Footer_Tagline || taglineLabel;
  const email = settings.ContactEmail || "";
  const phone = settings.ContactPhone || "";

  const socials = [
    { icon: <IconInstagram />, label: instagramLabel, url: settings.SocialInstagram || "" },
    { icon: <IconX />, label: xLabel, url: settings.SocialTwitter || "" },
    { icon: <IconYouTube />, label: youtubeLabel, url: settings.SocialYoutube || "" },
    { icon: <IconLinkedIn />, label: linkedinLabel, url: settings.SocialLinkedin || "" },
  ].filter(s => s.url);

  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#12304A] text-slate-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              {logoUrl && (
                <div className="w-9 h-9 bg-white rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                  <FooterLogoImg src={logoUrl} alt={siteName} />
                </div>
              )}
              <FooterBrandName name={siteName} />
            </div>
            <p className="text-sm text-slate-400 mb-5 leading-relaxed whitespace-pre-line">
              {tagline}
            </p>
            {socials.length > 0 && (
              <div className="flex gap-2">
                {socials.map(s => (
                  <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                    className="w-9 h-9 bg-white/10 hover:bg-[#19B7B1] rounded-xl flex items-center justify-center text-slate-300 hover:text-white transition-all duration-200">
                    {s.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-4">{accountTitle}</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/giris" className="hover:text-white transition">{loginLabel}</Link></li>
              <li><Link href="/kayit" className="hover:text-white transition">{registerLabel}</Link></li>
              <li><Link href="/hesabim/siparisler" className="hover:text-white transition">{ordersLabel}</Link></li>
              <li><Link href="/hesabim/adresler" className="hover:text-white transition">{addressesLabel}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-4">{helpTitle}</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/sss" className="hover:text-white transition">{faqLabel}</Link></li>
              <li><Link href="/iade-degisim" className="hover:text-white transition">{returnsExchangeLabel}</Link></li>
              <li><Link href="/kargo-takibi" className="hover:text-white transition">{trackingLabel}</Link></li>
              <li><Link href="/iletisim" className="hover:text-white transition">{contactLinkLabel}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-4">{corporateTitle}</h4>
            <ul className="space-y-2.5 text-sm mb-5">
              <li><Link href="/hakkimizda" className="hover:text-white transition">{aboutLabel}</Link></li>
              <li><Link href="/kvkk" className="hover:text-white transition">KVKK</Link></li>
              <li><Link href="/gizlilik" className="hover:text-white transition">{privacyLabel}</Link></li>
            </ul>
            {(email || phone) && (
              <div className="space-y-1.5 text-xs text-slate-500">
                <p className="text-slate-400 font-medium text-sm">{contactTitle}</p>
                {email && <p>{email}</p>}
                {phone && <p>{phone}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Spareparts: araç markası hızlı linkler */}
        {settings.CustomerTemplate === "spareparts" && (
          <div className="border-t border-white/10 pt-6 mb-6">
            <p className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest mb-4">
              Araç Markasına Göre Yedek Parça
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-x-4 gap-y-2">
              {[
                "OPEL","CHEVROLET","BMW","MERCEDES-BENZ","VOLKSWAGEN",
                "AUDI","SEAT","SKODA","RENAULT","PEUGEOT",
                "CİTROEN","FORD","FIAT","TOYOTA","KIA",
                "HYUNDAI","HONDA","VOLVO","MAZDA","SUBARU",
              ].map(brand => {
                const brandId = brandNameToId[brand.toUpperCase()];
                const href = brandId
                  ? `/urunler?markalar=${brandId}`
                  : `/urunler?s=${encodeURIComponent(brand)}`;
                return (
                  <Link key={brand} href={href}
                    className="text-xs font-semibold text-slate-500 hover:text-orange-400 transition-colors duration-150 py-1 truncate">
                    {brand}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            {copyrightLabel.replace("{year}", String(year)).replace("{siteName}", siteName)}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 mr-1">{safePaymentLabel}</span>
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
