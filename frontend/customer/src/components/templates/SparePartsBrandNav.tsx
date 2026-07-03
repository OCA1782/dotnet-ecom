"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Araç modelleri — key ile MODEL_MAP'e bakılır
const MODEL_MAP: Record<string, string[]> = {
  "opel":          ["Astra","Corsa","Zafira","Combo","Insignia","Mokka","Crossland X","Grandland X","Adam","Agila","Meriva","Vectra","Omega","Kadett","Signum","Antara","Cascada"],
  "chevrolet":     ["Aveo","Cruze","Spark","Captiva","Lacetti","Epica","Trax","Orlando","Malibu"],
  "bmw":           ["1 Serisi","2 Serisi","3 Serisi","4 Serisi","5 Serisi","6 Serisi","7 Serisi","8 Serisi","X1","X2","X3","X4","X5","X6","X7","M2","M3","M4","M5","Z4"],
  "mercedes-benz": ["A Serisi","B Serisi","C Serisi","E Serisi","S Serisi","GLA","GLB","GLC","GLE","GLS","CLA","CLS","AMG GT","Sprinter","Vito"],
  "volkswagen":    ["Golf","Passat","Polo","Tiguan","Touareg","T-Roc","T-Cross","Arteon","ID.3","ID.4","Caddy","Transporter","Amarok","Sharan"],
  "audi":          ["A1","A2","A3","A4","A5","A6","A7","A8","Q2","Q3","Q5","Q7","Q8","TT","R8","RS3","RS6","S3","S4"],
  "ford":          ["Focus","Fiesta","Mondeo","Kuga","EcoSport","Puma","Mustang","Galaxy","S-MAX","Transit","Tourneo","Ranger","Explorer"],
  "seat":          ["Ibiza","Leon","Toledo","Ateca","Arona","Tarraco","Altea","Exeo","Alhambra"],
  "skoda":         ["Fabia","Octavia","Superb","Kamiq","Karoq","Kodiaq","Rapid","Yeti","Scala","Enyaq"],
  "renault":       ["Clio","Megane","Laguna","Scenic","Kadjar","Captur","Koleos","Sandero","Duster","Talisman","Fluence","Symbol","Kangoo","Master","Trafic"],
  "peugeot":       ["108","206","207","208","308","408","508","2008","3008","5008","Partner","Expert","Boxer"],
  "citroen":       ["C1","C2","C3","C4","C5","C6","C3 Aircross","C4 Cactus","C5 Aircross","Berlingo","Jumpy","Jumper"],
  "fiat":          ["500","Punto","Doblo","Fiorino","Stilo","Bravo","Tipo","Linea","Egea","500X","Panda"],
  "toyota":        ["Corolla","Yaris","Auris","Avensis","RAV4","Land Cruiser","Hilux","Prius","C-HR","Camry","Aygo"],
  "hyundai":       ["i10","i20","i30","i40","Accent","Elantra","Sonata","Tucson","Santa Fe","ix35","Kona","Ioniq","H-1"],
  "kia":           ["Picanto","Rio","Ceed","Sportage","Sorento","Stinger","Soul","Niro","Stonic","EV6"],
  "honda":         ["Civic","Jazz","CR-V","HR-V","Accord","Legend","FR-V"],
  "nissan":        ["Micra","Note","Juke","Qashqai","X-Trail","Navara","Leaf","Pulsar"],
  "mazda":         ["2","3","6","CX-3","CX-5","CX-9","MX-5","626","323"],
  "volvo":         ["V40","V60","V70","V90","S40","S60","S80","S90","XC40","XC60","XC90"],
  "mitsubishi":    ["Colt","Galant","Outlander","Eclipse Cross","ASX","L200","Pajero","Space Star"],
  "suzuki":        ["Swift","Vitara","Baleno","Jimny","Ignis","S-Cross","Grand Vitara"],
  "jeep":          ["Wrangler","Cherokee","Grand Cherokee","Renegade","Compass","Commander"],
  "land rover":    ["Defender","Discovery","Range Rover","Freelander","Range Rover Sport","Range Rover Evoque"],
  "alfa romeo":    ["Giulia","Stelvio","Giulietta","MiTo","147","156","159"],
  "dacia":         ["Sandero","Logan","Duster","Lodgy","Dokker","Spring"],
  "porsche":       ["911","Cayenne","Macan","Panamera","Boxster","Cayman"],
  "subaru":        ["Impreza","Legacy","Outback","Forester","XV","BRZ"],
  "saab":          ["9-3","9-5","9000"],
  "lexus":         ["IS","ES","GS","LS","UX","NX","RX","LX"],
  "tofas":         ["Doğan","Şahin","Kartal","Tempra","Fiorino"],
};

// Pill nav'da gösterilecek araç markaları (sıralı, dedupe)
const CAR_BRANDS: { key: string; label: string }[] = [
  { key: "opel",        label: "Opel"         },
  { key: "chevrolet",   label: "Chevrolet"    },
  { key: "bmw",         label: "BMW"          },
  { key: "mercedes-benz", label: "Mercedes-Benz" },
  { key: "volkswagen",  label: "Volkswagen"   },
  { key: "audi",        label: "Audi"         },
  { key: "ford",        label: "Ford"         },
  { key: "seat",        label: "Seat"         },
  { key: "skoda",       label: "Skoda"        },
  { key: "renault",     label: "Renault"      },
  { key: "peugeot",     label: "Peugeot"      },
  { key: "citroen",     label: "Citroën"      },
  { key: "fiat",        label: "Fiat"         },
  { key: "toyota",      label: "Toyota"       },
  { key: "hyundai",     label: "Hyundai"      },
  { key: "kia",         label: "Kia"          },
  { key: "honda",       label: "Honda"        },
  { key: "nissan",      label: "Nissan"       },
  { key: "mazda",       label: "Mazda"        },
  { key: "volvo",       label: "Volvo"        },
  { key: "mitsubishi",  label: "Mitsubishi"   },
  { key: "suzuki",      label: "Suzuki"       },
  { key: "jeep",        label: "Jeep"         },
  { key: "land rover",  label: "Land Rover"   },
  { key: "alfa romeo",  label: "Alfa Romeo"   },
  { key: "dacia",       label: "Dacia"        },
  { key: "porsche",     label: "Porsche"      },
  { key: "subaru",      label: "Subaru"       },
  { key: "saab",        label: "Saab"         },
  { key: "lexus",       label: "Lexus"        },
  { key: "tofas",       label: "Tofaş"        },
];

// imagin.studio make slug mapping
const MAKE_SLUG_MAP: Record<string, string> = {
  "mercedes-benz": "mercedes-benz",
  "land rover":    "land-rover",
  "alfa romeo":    "alfa-romeo",
  "tofas":         "fiat",
};

// Turkish model name → imagin.studio slug
const MODEL_SLUG_MAP: Record<string, string> = {
  "1 serisi": "1-series", "2 serisi": "2-series", "3 serisi": "3-series",
  "4 serisi": "4-series", "5 serisi": "5-series", "6 serisi": "6-series",
  "7 serisi": "7-series", "8 serisi": "8-series",
  "a serisi": "a-class",  "b serisi": "b-class",  "c serisi": "c-class",
  "e serisi": "e-class",  "s serisi": "s-class",
  "crossland x": "crossland-x", "grandland x": "grandland-x",
  "c3 aircross": "c3-aircross", "c4 cactus": "c4-cactus", "c5 aircross": "c5-aircross",
  "grand cherokee": "grand-cherokee", "range rover": "range-rover",
  "range rover sport": "range-rover-sport", "range rover evoque": "range-rover-evoque",
  "space star": "space-star", "eclipse cross": "eclipse-cross",
  "land cruiser": "land-cruiser", "grand vitara": "grand-vitara",
};

function getModelImageUrl(brandKey: string, modelName: string): string {
  const make = MAKE_SLUG_MAP[brandKey] ?? brandKey.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const mn = modelName.toLowerCase().trim();
  const modelSlug = MODEL_SLUG_MAP[mn] ?? mn
    .replace(/\s+/g, "-")
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9-]/g, "");
  return `https://cdn.imagin.studio/getimage?customer=img&make=${make}&modelFamily=${modelSlug}&angle=29&width=300&zoomType=fullscreen&paintId=color-black`;
}

function CarIcon() {
  return (
    <svg viewBox="0 0 120 60" className="w-full h-full" fill="none">
      <rect x="8" y="30" width="104" height="16" rx="4" fill="#94a3b8" opacity="0.3"/>
      <path d="M14 30 L28 14 L85 14 L104 30" stroke="#94a3b8" strokeWidth="2.5" fill="#94a3b8" fillOpacity="0.15"/>
      <circle cx="30" cy="48" r="9" fill="#94a3b8" opacity="0.8"/>
      <circle cx="30" cy="48" r="5" fill="white" opacity="0.6"/>
      <circle cx="88" cy="48" r="9" fill="#94a3b8" opacity="0.8"/>
      <circle cx="88" cy="48" r="5" fill="white" opacity="0.6"/>
    </svg>
  );
}

function ModelImage({ brandKey, modelName }: { brandKey: string; modelName: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <CarIcon />;
  return (
    <img
      src={getModelImageUrl(brandKey, modelName)}
      alt={modelName}
      className="w-full h-full object-contain"
      onError={() => setFailed(true)}
    />
  );
}

// brands prop artık kullanılmıyor ama geriye dönük uyumluluk için tutuldu
interface Props {
  brands?: unknown[];
  activeBrandSlug?: string;
}

export default function SparePartsBrandNav({ }: Props) {
  const router = useRouter();
  const [openBrand, setOpenBrand] = useState<string | null>(null); // CAR_BRANDS key
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        setOpenBrand(null);
      }
    }
    if (openBrand) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openBrand]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenBrand(null);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  function handleBrandClick(brand: { key: string; label: string }) {
    const models = MODEL_MAP[brand.key] ?? [];
    if (models.length > 0) {
      setOpenBrand(prev => prev === brand.key ? null : brand.key);
    } else {
      setActiveBrand(brand.key);
      setOpenBrand(null);
      router.push(`/urunler?s=${encodeURIComponent(brand.label)}`);
    }
  }

  function handleModelClick(brand: { key: string; label: string }, model: string) {
    setActiveBrand(brand.key);
    setOpenBrand(null);
    router.push(`/urunler?s=${encodeURIComponent(brand.label + " " + model)}`);
  }

  const openBrandObj = openBrand ? CAR_BRANDS.find(b => b.key === openBrand) : null;
  const models = openBrandObj ? (MODEL_MAP[openBrandObj.key] ?? []) : [];

  return (
    <div className="relative bg-white border-b border-gray-100 shadow-sm" ref={overlayRef}>
      {/* Marka pill şeridi */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-0 overflow-x-auto scrollbar-none py-1">
          {CAR_BRANDS.map(brand => (
            <button
              key={brand.key}
              onClick={() => handleBrandClick(brand)}
              className={`flex-shrink-0 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wide transition-all duration-150 border-b-2 whitespace-nowrap ${
                activeBrand === brand.key || openBrand === brand.key
                  ? "border-orange-500 text-orange-600 bg-orange-50"
                  : "border-transparent text-gray-600 hover:text-orange-600 hover:border-orange-300 hover:bg-orange-50/50"
              }`}
            >
              {brand.label}
            </button>
          ))}
        </div>
      </div>

      {/* Model dropdown */}
      {openBrandObj && models.length > 0 && (
        <div className="absolute left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-gray-800 uppercase tracking-wide">{openBrandObj.label}</span>
                <span className="text-[10px] text-gray-400 font-semibold">— Model Seçin</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveBrand(openBrandObj.key);
                    setOpenBrand(null);
                    router.push(`/urunler?s=${encodeURIComponent(openBrandObj.label)}`);
                  }}
                  className="text-[11px] text-orange-600 font-bold hover:underline"
                >
                  Tüm {openBrandObj.label} Ürünlerini Gör →
                </button>
                <button onClick={() => setOpenBrand(null)} className="text-gray-400 hover:text-gray-600 ml-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
              {models.map((model) => (
                <button
                  key={model}
                  onClick={() => handleModelClick(openBrandObj, model)}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-gray-100 hover:border-orange-300 hover:bg-orange-50 transition-all duration-150 group text-center"
                >
                  <div className="w-full h-10 flex items-center justify-center group-hover:opacity-100 transition-opacity">
                    <ModelImage brandKey={openBrandObj.key} modelName={model} />
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
