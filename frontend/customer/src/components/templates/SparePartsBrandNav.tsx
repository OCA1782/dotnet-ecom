"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Brand } from "@/types";

// Common car models by brand name (case-insensitive match)
const MODEL_MAP: Record<string, string[]> = {
  "opel":          ["Astra","Corsa","Zafira","Combo","Insignia","Mokka","Crossland X","Grandland X","Adam","Agila","Meriva","Vectra","Omega","Kadett","Signum","Antara","Cascada"],
  "chevrolet":     ["Aveo","Cruze","Spark","Captiva","Lacetti","Epica","Trax","Orlando","Malibu","Corvette"],
  "bmw":           ["1 Serisi","2 Serisi","3 Serisi","4 Serisi","5 Serisi","6 Serisi","7 Serisi","8 Serisi","X1","X2","X3","X4","X5","X6","X7","M2","M3","M4","M5","Z4"],
  "mercedes-benz": ["A Serisi","B Serisi","C Serisi","E Serisi","S Serisi","GLA","GLB","GLC","GLE","GLS","CLA","CLS","AMG GT","Sprinter","Vito"],
  "mercedes":      ["A Serisi","B Serisi","C Serisi","E Serisi","S Serisi","GLA","GLB","GLC","GLE","GLS","CLA","CLS","Sprinter","Vito"],
  "volkswagen":    ["Golf","Passat","Polo","Tiguan","Touareg","T-Roc","T-Cross","Arteon","ID.3","ID.4","Caddy","Transporter","Amarok","Sharan"],
  "audi":          ["A1","A2","A3","A4","A5","A6","A7","A8","Q2","Q3","Q5","Q7","Q8","TT","R8","RS3","RS6","S3","S4"],
  "ford":          ["Focus","Fiesta","Mondeo","Kuga","EcoSport","Puma","Mustang","Galaxy","S-MAX","Transit","Tourneo","Ranger","Explorer","Edge"],
  "seat":          ["Ibiza","Leon","Toledo","Ateca","Arona","Tarraco","Altea","Exeo","Alhambra"],
  "skoda":         ["Fabia","Octavia","Superb","Kamiq","Karoq","Kodiaq","Rapid","Yeti","Scala","Enyaq"],
  "renault":       ["Clio","Megane","Laguna","Scenic","Kadjar","Captur","Koleos","Sandero","Duster","Talisman","Fluence","Symbol","Kangoo","Master","Trafic"],
  "peugeot":       ["108","206","207","208","308","408","508","2008","3008","5008","Partner","Expert","Boxer"],
  "citroen":       ["C1","C2","C3","C4","C5","C6","C3 Aircross","C4 Cactus","C5 Aircross","Berlingo","Dispatch","Jumpy","Jumper"],
  "citroën":       ["C1","C2","C3","C4","C5","C6","C3 Aircross","C4 Cactus","C5 Aircross","Berlingo","Dispatch","Jumpy","Jumper"],
  "fiat":          ["500","Punto","Doblo","Fiorino","Stilo","Bravo","Tipo","Linea","Fullback","Egea","500X","Panda"],
  "toyota":        ["Corolla","Yaris","Auris","Avensis","RAV4","Land Cruiser","Hilux","Prius","C-HR","Camry","Verso","Aygo"],
  "hyundai":       ["i10","i20","i30","i40","Accent","Elantra","Sonata","Tucson","Santa Fe","ix35","Kona","Ioniq","H-1"],
  "kia":           ["Picanto","Rio","Ceed","Sportage","Sorento","Stinger","Soul","Niro","Stonic","ProCeed","EV6"],
  "honda":         ["Civic","Jazz","CR-V","HR-V","Accord","Legend","FR-V","Insight"],
  "nissan":        ["Micra","Note","Juke","Qashqai","X-Trail","Navara","Pathfinder","370Z","GT-R","Leaf","Pulsar"],
  "mazda":         ["2","3","6","CX-3","CX-5","CX-9","MX-5","626","323"],
  "volvo":         ["V40","V60","V70","V90","S40","S60","S80","S90","XC40","XC60","XC90"],
  "subaru":        ["Impreza","Legacy","Outback","Forester","XV","BRZ"],
  "mitsubishi":    ["Colt","Galant","Outlander","Eclipse Cross","ASX","L200","Pajero","Space Star"],
  "suzuki":        ["Swift","Vitara","Baleno","Jimny","Ignis","Across","S-Cross","Grand Vitara","Alto"],
  "jeep":          ["Wrangler","Cherokee","Grand Cherokee","Renegade","Compass","Commander","Gladiator"],
  "land rover":    ["Defender","Discovery","Range Rover","Freelander","Range Rover Sport","Range Rover Evoque","Velar"],
  "alfa romeo":    ["Giulia","Stelvio","Giulietta","MiTo","147","156","159","Brera"],
  "dacia":         ["Sandero","Logan","Duster","Lodgy","Dokker","Spring"],
  "lancia":        ["Delta","Ypsilon","Thema","Musa"],
  "porsche":       ["911","Cayenne","Macan","Panamera","Boxster","Cayman","Taycan"],
  "saab":          ["9-3","9-5","9000"],
  "infiniti":      ["Q50","Q60","QX50","QX60","QX80"],
  "lexus":         ["IS","ES","GS","LS","UX","NX","RX","LX","CT"],
  "tofaş":         ["Doğan","Şahin","Kartal","Tempra","Fiorino","Brava","Uno"],
  "tofa":          ["Doğan","Şahin","Kartal","Tempra","Fiorino"],
};

function getModels(brandName: string): string[] {
  const key = brandName.toLowerCase().trim();
  if (MODEL_MAP[key]) return MODEL_MAP[key];
  // Partial match
  const partialKey = Object.keys(MODEL_MAP).find(k => key.includes(k) || k.includes(key));
  return partialKey ? MODEL_MAP[partialKey] : [];
}

// Simple car silhouette SVG (changes style by index for variety)
function CarIcon({ index }: { index: number }) {
  const colors = ["#94a3b8","#64748b","#475569","#6b7280","#9ca3af"];
  const c = colors[index % colors.length];
  return (
    <svg viewBox="0 0 120 60" className="w-full h-full" fill="none">
      <rect x="8" y="30" width="104" height="16" rx="4" fill={c} opacity="0.3"/>
      <path d="M14 30 L28 14 L85 14 L104 30" stroke={c} strokeWidth="2.5" fill={c} fillOpacity="0.15"/>
      <circle cx="30" cy="48" r="9" fill={c} opacity="0.8"/>
      <circle cx="30" cy="48" r="5" fill="white" opacity="0.6"/>
      <circle cx="88" cy="48" r="9" fill={c} opacity="0.8"/>
      <circle cx="88" cy="48" r="5" fill="white" opacity="0.6"/>
      <rect x="55" y="16" width="20" height="12" rx="2" fill={c} opacity="0.15"/>
      <rect x="35" y="16" width="18" height="12" rx="2" fill={c} opacity="0.15"/>
    </svg>
  );
}

interface Props {
  brands: Brand[];
  activeBrandSlug?: string;
}

export default function SparePartsBrandNav({ brands, activeBrandSlug }: Props) {
  const router = useRouter();
  const [openBrand, setOpenBrand] = useState<Brand | null>(null);
  const [activeBrand, setActiveBrand] = useState<string | null>(activeBrandSlug ?? null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        setOpenBrand(null);
      }
    }
    if (openBrand) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openBrand]);

  // Close on ESC
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenBrand(null);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  function handleBrandClick(brand: Brand) {
    const models = getModels(brand.name);
    if (models.length > 0) {
      setOpenBrand(prev => (prev?.id === brand.id ? null : brand));
    } else {
      // No model data → go directly to products filtered by brand
      setActiveBrand(brand.id);
      setOpenBrand(null);
      router.push(`/urunler?markalar=${brand.id}`);
    }
  }

  function handleModelClick(brand: Brand, model: string) {
    setActiveBrand(brand.id);
    setOpenBrand(null);
    router.push(`/urunler?markalar=${brand.id}&s=${encodeURIComponent(model)}`);
  }

  const models = openBrand ? getModels(openBrand.name) : [];

  // Show top brands by sort order; if too many, only first 24 in pills + "..." button
  const displayBrands = brands.slice(0, 30);

  return (
    <div className="relative bg-white border-b border-gray-100 shadow-sm" ref={overlayRef}>
      {/* Brand pill row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-0 overflow-x-auto scrollbar-none py-1">
          {displayBrands.map(brand => (
            <button
              key={brand.id}
              onClick={() => handleBrandClick(brand)}
              className={`flex-shrink-0 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wide transition-all duration-150 border-b-2 whitespace-nowrap ${
                activeBrand === brand.id || openBrand?.id === brand.id
                  ? "border-orange-500 text-orange-600 bg-orange-50"
                  : "border-transparent text-gray-600 hover:text-orange-600 hover:border-orange-300 hover:bg-orange-50/50"
              }`}
            >
              {brand.name}
            </button>
          ))}
          {brands.length > 30 && (
            <button
              onClick={() => router.push("/urunler")}
              className="flex-shrink-0 px-3.5 py-2 text-[11px] font-bold text-gray-400 hover:text-orange-500 transition-colors border-b-2 border-transparent whitespace-nowrap"
            >
              +{brands.length - 30} →
            </button>
          )}
        </div>
      </div>

      {/* Model dropdown overlay */}
      {openBrand && models.length > 0 && (
        <div className="absolute left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-gray-800 uppercase tracking-wide">{openBrand.name}</span>
                <span className="text-[10px] text-gray-400 font-semibold">— Model Seçin</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setActiveBrand(openBrand.id); setOpenBrand(null); router.push(`/urunler?markalar=${openBrand.id}`); }}
                  className="text-[11px] text-orange-600 font-bold hover:underline"
                >
                  Tüm {openBrand.name} Ürünlerini Gör →
                </button>
                <button onClick={() => setOpenBrand(null)} className="text-gray-400 hover:text-gray-600 ml-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
              {models.map((model, i) => (
                <button
                  key={model}
                  onClick={() => handleModelClick(openBrand, model)}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-gray-100 hover:border-orange-300 hover:bg-orange-50 transition-all duration-150 group text-center"
                >
                  <div className="w-full h-10 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
                    <CarIcon index={i} />
                  </div>
                  <span className="text-[10px] font-semibold text-gray-600 group-hover:text-orange-600 leading-tight transition-colors line-clamp-2">{model}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
