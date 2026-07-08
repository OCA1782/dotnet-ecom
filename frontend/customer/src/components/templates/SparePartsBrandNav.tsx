"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";

// ─── Detaylı araç modelleri ──────────────────────────────────────────────────
const MODEL_MAP: Record<string, string[]> = {
  "opel": [
    "Astra F","Astra G","Astra H","Astra J","Astra K",
    "Corsa A","Corsa B","Corsa C","Corsa D","Corsa E","Corsa F",
    "Zafira A","Zafira B","Zafira C",
    "Combo B","Combo C","Combo D","Combo E",
    "Insignia A","Insignia B",
    "Vectra A","Vectra B","Vectra C",
    "Omega A","Omega B",
    "Meriva A","Meriva B",
    "Mokka","Mokka X",
    "Crossland X","Grandland X",
    "Kadett E","Antara","Adam","Agila B","Signum","Cascada",
  ],
  "chevrolet": [
    "Aveo T200","Aveo T250","Aveo T300",
    "Cruze J300","Cruze J400",
    "Spark M200","Spark M300",
    "Captiva C100","Captiva C140",
    "Lacetti","Epica","Trax","Orlando","Malibu",
  ],
  "bmw": [
    "1 Serisi E81","1 Serisi E87","1 Serisi F20","1 Serisi F40",
    "2 Serisi F22","2 Serisi F45","2 Serisi G42",
    "3 Serisi E30","3 Serisi E36","3 Serisi E46","3 Serisi E90","3 Serisi F30","3 Serisi G20",
    "4 Serisi F32","4 Serisi G22",
    "5 Serisi E34","5 Serisi E39","5 Serisi E60","5 Serisi F10","5 Serisi G30",
    "6 Serisi E63","6 Serisi F12",
    "7 Serisi E38","7 Serisi E65","7 Serisi F01","7 Serisi G11",
    "X1 E84","X1 F48","X1 U11",
    "X3 E83","X3 F25","X3 G01",
    "X5 E53","X5 E70","X5 F15","X5 G05",
    "X6 E71","X6 F16",
    "M3 E36","M3 E46","M3 E90","M3 F80",
    "M5 E39","M5 E60","M5 F10",
    "Z4 E85","Z4 E89",
  ],
  "mercedes-benz": [
    "A Serisi W168","A Serisi W169","A Serisi W176","A Serisi W177",
    "B Serisi W245","B Serisi W246","B Serisi W247",
    "C Serisi W202","C Serisi W203","C Serisi W204","C Serisi W205","C Serisi W206",
    "E Serisi W210","E Serisi W211","E Serisi W212","E Serisi W213",
    "S Serisi W220","S Serisi W221","S Serisi W222",
    "GLA X156","GLA X247",
    "GLC X253","GLE W166","GLE W167","GLS X166",
    "CLA C117","CLA C118","CLS C218","CLS C257",
    "Sprinter W901","Sprinter W906","Sprinter W907",
    "Vito W638","Vito W639","Vito W447",
  ],
  "volkswagen": [
    "Golf I","Golf II","Golf III","Golf IV","Golf V","Golf VI","Golf VII","Golf VIII",
    "Passat B3","Passat B4","Passat B5","Passat B6","Passat B7","Passat B8",
    "Polo 6N","Polo 6N2","Polo 9N","Polo 6R","Polo AW",
    "Tiguan I","Tiguan II",
    "Touareg I","Touareg II","Touareg III",
    "T-Roc","T-Cross","Arteon",
    "Caddy I","Caddy II","Caddy III","Caddy IV",
    "Transporter T4","Transporter T5","Transporter T6",
    "Amarok I","Amarok II","Sharan I","Sharan II",
    "ID.3","ID.4",
  ],
  "audi": [
    "A1 8X","A1 GB",
    "A3 8L","A3 8P","A3 8V","A3 8Y",
    "A4 B5","A4 B6","A4 B7","A4 B8","A4 B9",
    "A5 8T","A5 F5",
    "A6 C4","A6 C5","A6 C6","A6 C7","A6 C8",
    "A7 4G","A7 4K",
    "A8 D2","A8 D3","A8 D4","A8 D5",
    "Q2","Q3 8U","Q3 F3",
    "Q5 8R","Q5 FY",
    "Q7 4L","Q7 4M","Q8 4M",
    "TT 8N","TT 8J","TT 8S",
    "RS3","RS4 B5","RS4 B7","RS4 B8","RS6 C5","RS6 C7",
    "S3 8L","S3 8P","S4 B5","S4 B6","S4 B8",
  ],
  "ford": [
    "Focus I","Focus II","Focus III","Focus IV",
    "Fiesta III","Fiesta IV","Fiesta V","Fiesta VI","Fiesta VII",
    "Mondeo I","Mondeo II","Mondeo III","Mondeo IV","Mondeo V",
    "Kuga I","Kuga II","Kuga III",
    "EcoSport","Puma II",
    "Galaxy I","Galaxy II","Galaxy III",
    "S-MAX I","S-MAX II",
    "Transit V184","Transit V347","Transit V363",
    "Tourneo Connect","Tourneo Custom",
    "Ranger III","Ranger IV",
    "Mustang V","Mustang VI",
  ],
  "seat": [
    "Ibiza I","Ibiza II","Ibiza III","Ibiza IV","Ibiza V",
    "Leon I","Leon II","Leon III","Leon IV",
    "Toledo I","Toledo II","Toledo III","Toledo IV",
    "Ateca","Arona","Tarraco","Altea","Alhambra II",
  ],
  "skoda": [
    "Fabia I","Fabia II","Fabia III",
    "Octavia I","Octavia II","Octavia III","Octavia IV",
    "Superb I","Superb II","Superb III",
    "Yeti","Kamiq","Karoq","Kodiaq",
    "Rapid","Scala","Enyaq",
  ],
  "renault": [
    "Clio I","Clio II","Clio III","Clio IV","Clio V",
    "Megane I","Megane II","Megane III","Megane IV",
    "Laguna I","Laguna II","Laguna III",
    "Scenic I","Scenic II","Scenic III",
    "Kadjar","Captur I","Captur II",
    "Koleos I","Koleos II",
    "Sandero I","Sandero II","Sandero III",
    "Symbol I","Symbol II","Symbol III",
    "Fluence","Talisman",
    "Kangoo I","Kangoo II","Kangoo III",
    "Master II","Master III","Trafic II","Trafic III",
  ],
  "peugeot": [
    "106","107","108",
    "206","207","208 I","208 II",
    "306","307","308 I","308 II",
    "407","408","508 I","508 II",
    "2008 I","2008 II","3008 I","3008 II","5008 I","5008 II",
    "Partner I","Partner II","Partner III",
    "Expert I","Expert II","Boxer II","Boxer III",
  ],
  "citroen": [
    "C1 I","C1 II",
    "C2","C3 I","C3 II","C3 III",
    "C4 I","C4 II","C4 III",
    "C5 I","C5 II","C5 X",
    "C3 Aircross","C4 Cactus","C5 Aircross",
    "Berlingo I","Berlingo II","Berlingo III",
    "Jumpy I","Jumpy II","Jumpy III",
    "Jumper I","Jumper II",
    "C6",
  ],
  "fiat": [
    "500 312","500 334",
    "Punto I","Punto II","Punto III",
    "Doblo I","Doblo II","Doblo III",
    "Fiorino III","Fiorino IV",
    "Tipo I","Tipo II",
    "Bravo II","Stilo",
    "Linea","Egea","500X","Panda II","Panda III",
    "Uno II",
  ],
  "toyota": [
    "Corolla E10","Corolla E11","Corolla E12","Corolla E15","Corolla E16","Corolla E21",
    "Yaris P1","Yaris P2","Yaris P3","Yaris P4",
    "Auris I","Auris II",
    "Avensis I","Avensis II","Avensis III",
    "RAV4 I","RAV4 II","RAV4 III","RAV4 IV","RAV4 V",
    "Land Cruiser J100","Land Cruiser J150","Land Cruiser J200","Land Cruiser J300",
    "Hilux VII","Hilux VIII",
    "Prius II","Prius III","Prius IV",
    "C-HR","Camry VII","Camry VIII",
    "Aygo I","Aygo II",
  ],
  "hyundai": [
    "i10 I","i10 II","i10 III",
    "i20 I","i20 II","i20 III",
    "i30 I","i30 II","i30 III",
    "i40 I",
    "Accent III","Accent IV",
    "Elantra IV","Elantra V","Elantra VI",
    "Sonata IV","Sonata V",
    "Tucson I","Tucson II","Tucson III","Tucson IV",
    "Santa Fe I","Santa Fe II","Santa Fe III","Santa Fe IV",
    "ix35","Kona","Ioniq","H-1 II",
  ],
  "kia": [
    "Picanto I","Picanto II","Picanto III",
    "Rio I","Rio II","Rio III","Rio IV",
    "Ceed I","Ceed II","Ceed III",
    "Sportage I","Sportage II","Sportage III","Sportage IV","Sportage V",
    "Sorento I","Sorento II","Sorento III","Sorento IV",
    "Soul I","Soul II","Soul III",
    "Niro I","Stonic","ProCeed","EV6",
  ],
  "honda": [
    "Civic IV","Civic V","Civic VI","Civic VII","Civic VIII","Civic IX","Civic X","Civic XI",
    "Jazz I","Jazz II","Jazz III","Jazz IV",
    "CR-V I","CR-V II","CR-V III","CR-V IV","CR-V V",
    "HR-V I","HR-V II","HR-V III",
    "Accord V","Accord VI","Accord VII","Accord VIII",
    "FR-V",
  ],
  "nissan": [
    "Micra K11","Micra K12","Micra K13","Micra K14",
    "Note E11","Note E12",
    "Juke F15","Juke F16",
    "Qashqai J10","Qashqai J11","Qashqai J12",
    "X-Trail T30","X-Trail T31","X-Trail T32",
    "Navara D22","Navara D40","Navara D23",
    "Leaf ZE0","Leaf ZE1","Pulsar C13",
  ],
  "mazda": [
    "Mazda 2 DJ","Mazda 2 DY",
    "Mazda 3 BK","Mazda 3 BL","Mazda 3 BM","Mazda 3 BP",
    "Mazda 6 GG","Mazda 6 GH","Mazda 6 GJ","Mazda 6 GL",
    "CX-3","CX-5 KE","CX-5 KF","CX-9",
    "MX-5 NA","MX-5 NB","MX-5 NC","MX-5 ND",
    "626 GE","323 BJ",
  ],
  "volvo": [
    "V40 I","V40 II",
    "V60 I","V60 II",
    "V70 I","V70 II","V70 III",
    "V90 I","V90 II",
    "S40 I","S40 II",
    "S60 I","S60 II","S60 III",
    "S80 I","S80 II",
    "S90 II",
    "XC40","XC60 I","XC60 II","XC90 I","XC90 II",
  ],
  "mitsubishi": [
    "Colt VI","Colt VII",
    "Galant VIII","Galant IX",
    "Outlander I","Outlander II","Outlander III",
    "Eclipse Cross","ASX",
    "L200 III","L200 IV","L200 V",
    "Pajero III","Pajero IV",
    "Space Star II",
  ],
  "suzuki": [
    "Swift I","Swift II","Swift III","Swift IV","Swift V",
    "Vitara I","Vitara II","Vitara III",
    "Baleno I","Baleno II",
    "Jimny III","Jimny IV",
    "Ignis I","Ignis II",
    "S-Cross I","S-Cross II",
    "Grand Vitara II","Grand Vitara III",
  ],
  "jeep": [
    "Wrangler TJ","Wrangler JK","Wrangler JL",
    "Cherokee XJ","Cherokee KJ","Cherokee KL",
    "Grand Cherokee WJ","Grand Cherokee WK","Grand Cherokee WK2","Grand Cherokee WL",
    "Renegade BU","Compass MK49","Compass MP52",
    "Commander XK","Gladiator JT",
  ],
  "land rover": [
    "Defender 90","Defender 110","Defender L663",
    "Discovery I","Discovery II","Discovery III","Discovery IV","Discovery V",
    "Freelander I","Freelander II",
    "Range Rover I","Range Rover II","Range Rover III","Range Rover IV","Range Rover V",
    "Range Rover Sport I","Range Rover Sport II",
    "Range Rover Evoque I","Range Rover Evoque II",
    "Velar",
  ],
  "alfa romeo": [
    "Giulia 952","Stelvio 949",
    "Giulietta 940","MiTo 955",
    "147 937","156 932","159 939",
    "Brera 939",
  ],
  "dacia": [
    "Sandero I","Sandero II","Sandero III",
    "Logan I","Logan II","Logan III",
    "Duster I","Duster II","Duster III",
    "Lodgy","Dokker","Spring",
  ],
  "porsche": [
    "911 996","911 997","911 991","911 992",
    "Cayenne 9PA","Cayenne 92A","Cayenne E3",
    "Macan 95B","Panamera 970","Panamera 971",
    "Boxster 986","Boxster 987","Boxster 981","Boxster 982",
    "Cayman 987","Cayman 981","Taycan",
  ],
  "subaru": [
    "Impreza GC","Impreza GD","Impreza GE","Impreza GP","Impreza GJ","Impreza GT",
    "Legacy III","Legacy IV","Legacy V",
    "Outback II","Outback III","Outback IV","Outback V",
    "Forester I","Forester II","Forester III","Forester IV","Forester V",
    "XV I","XV II","BRZ I","BRZ II",
  ],
  "saab": [
    "9-3 YS3D","9-3 YS3F",
    "9-5 YS3E","9-5 YS3G",
    "9000",
  ],
  "lexus": [
    "IS200","IS220","IS250","IS300h","IS350",
    "ES300h","ES350",
    "GS300","GS430","GS450h",
    "LS400","LS430","LS460","LS500h",
    "UX250h","NX200t","NX300h","NX350h",
    "RX300","RX330","RX350","RX450h",
    "LX470","LX570","CT200h",
  ],
  "tofas": [
    "Doğan","Doğan SLX",
    "Şahin","Şahin S",
    "Kartal","Kartal SLX",
    "Tempra","Fiorino","Brava","Uno",
  ],
};

// ─── Pill nav araç markaları ─────────────────────────────────────────────────
const CAR_BRANDS: { key: string; label: string }[] = [
  { key: "opel",          label: "Opel"          },
  { key: "chevrolet",     label: "Chevrolet"     },
  { key: "bmw",           label: "BMW"           },
  { key: "mercedes-benz", label: "Mercedes-Benz" },
  { key: "volkswagen",    label: "Volkswagen"    },
  { key: "audi",          label: "Audi"          },
  { key: "ford",          label: "Ford"          },
  { key: "seat",          label: "Seat"          },
  { key: "skoda",         label: "Skoda"         },
  { key: "renault",       label: "Renault"       },
  { key: "peugeot",       label: "Peugeot"       },
  { key: "citroen",       label: "Citroën"       },
  { key: "fiat",          label: "Fiat"          },
  { key: "toyota",        label: "Toyota"        },
  { key: "hyundai",       label: "Hyundai"       },
  { key: "kia",           label: "Kia"           },
  { key: "honda",         label: "Honda"         },
  { key: "nissan",        label: "Nissan"        },
  { key: "mazda",         label: "Mazda"         },
  { key: "volvo",         label: "Volvo"         },
  { key: "mitsubishi",    label: "Mitsubishi"    },
  { key: "suzuki",        label: "Suzuki"        },
  { key: "jeep",          label: "Jeep"          },
  { key: "land rover",    label: "Land Rover"    },
  { key: "alfa romeo",    label: "Alfa Romeo"    },
  { key: "dacia",         label: "Dacia"         },
  { key: "porsche",       label: "Porsche"       },
  { key: "subaru",        label: "Subaru"        },
  { key: "saab",          label: "Saab"          },
  { key: "lexus",         label: "Lexus"         },
  { key: "tofas",         label: "Tofaş"         },
];

// ─── imagin.studio — generation kodunu soyarak base model slug üret ──────────
const MAKE_SLUG: Record<string, string> = {
  "mercedes-benz": "mercedes-benz",
  "land rover":    "land-rover",
  "alfa romeo":    "alfa-romeo",
  "tofas":         "fiat",
};

function getModelFamily(brandKey: string, modelName: string): string {
  const m = modelName.trim();
  const lower = m.toLowerCase();

  // BMW: "3 Serisi E30" / "3 Serisi G20" → "3-series"
  const bmwS = lower.match(/^(\d)\s+serisi?/);
  if (bmwS) return `${bmwS[1]}-series`;
  // Mercedes: "C Serisi W204" → "c-class"
  const mbC = lower.match(/^([a-z])\s+serisi?/);
  if (mbC && brandKey === "mercedes-benz") return `${mbC[1]}-class`;

  // Chassis/generation kodu soy: "Astra H", "Golf VI", "Passat B8", "X5 E53"
  // Sona gelen: tek harf | Romen | alfanümerik kod (E30, F30, G20, B8, W204, MkN)
  const stripped = m
    .replace(/\s+Mk\s*\d+\s*$/i, "")              // Mk1, Mk2
    .replace(/\s+[A-Z]\d+[A-Za-z]?\s*$/g, "")     // E30, F30, W204, B8, G20, U11, J300
    .replace(/\s+[A-Z]{2,4}\s*$/g, "")             // YS3D, GE, BJ
    .replace(/\s+[IVXLC]{1,4}\s*$/g, "")           // VI, III, IV, IX
    .replace(/\s+[A-Z]\s*$/g, "")                   // trailing single letter: Astra H
    .trim()
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  return stripped || lower.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

const PAINT_CYCLE = [
  "color-red","color-blue","color-midnight-blue","color-silver",
  "color-forest-green","color-white","color-grey","color-orange",
];

function getModelImageUrl(brandKey: string, modelName: string, idx: number): string {
  const make = MAKE_SLUG[brandKey] ?? brandKey.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const family = getModelFamily(brandKey, modelName);
  const paint = PAINT_CYCLE[idx % PAINT_CYCLE.length];
  // angle=23 → yan/profil görünümü
  return `https://cdn.imagin.studio/getimage?customer=img&make=${make}&modelFamily=${family}&angle=23&width=500&zoomType=fullscreen&paintId=${paint}`;
}

function FallbackIcon() {
  return (
    <svg viewBox="0 0 120 60" className="w-full h-full" fill="none">
      <rect x="8" y="30" width="104" height="16" rx="4" fill="#cbd5e1" opacity="0.5"/>
      <path d="M14 30 L28 14 L85 14 L104 30" fill="#cbd5e1" fillOpacity="0.3"/>
      <circle cx="30" cy="48" r="9" fill="#94a3b8" opacity="0.8"/>
      <circle cx="30" cy="48" r="5" fill="white" opacity="0.6"/>
      <circle cx="88" cy="48" r="9" fill="#94a3b8" opacity="0.8"/>
      <circle cx="88" cy="48" r="5" fill="white" opacity="0.6"/>
    </svg>
  );
}

function ModelImage({ brandKey, modelName, idx, imageUrl }: { brandKey: string; modelName: string; idx: number; imageUrl?: string }) {
  const [failed, setFailed] = useState(false);
  const src = (!failed && imageUrl) ? imageUrl : getModelImageUrl(brandKey, modelName, idx);
  if (failed && !imageUrl) return <FallbackIcon />;
  return (
    <img
      src={src}
      alt={modelName}
      className="w-full h-full object-contain"
      onError={() => setFailed(true)}
    />
  );
}

interface ApiCategory { id: string; name: string; slug: string; imageUrl?: string; showInVehicleNav: boolean; subCategories: ApiCategory[]; }
interface NavModel { name: string; id: string; imageUrl?: string; }
export interface NavBrand { key: string; label: string; id: string; models: NavModel[]; }
interface Props { brands?: unknown[]; activeBrandSlug?: string; initialBrands?: NavBrand[]; }

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5181";

function mapCategoriesToNavBrands(data: ApiCategory[]): NavBrand[] {
  const roots = data.filter(c => c.showInVehicleNav);
  if (roots.length === 0) return [];
  return roots.map(c => ({
    key: c.slug, label: c.name, id: c.id,
    models: c.subCategories.map(s => ({ name: s.name, id: s.id, imageUrl: s.imageUrl })),
  }));
}

export default function SparePartsBrandNav({ initialBrands }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [navBrands, setNavBrands] = useState<NavBrand[]>(initialBrands ?? []);
  const [openBrand, setOpenBrand]   = useState<string | null>(null);
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const [canScrollLeft, setCanScrollLeft]   = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const pillRef    = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // ── API'den araç kategorilerini çek; initialBrands verilmişse atla ───────
  useEffect(() => {
    if (initialBrands && initialBrands.length > 0) return;
    async function loadBrands() {
      try {
        const res = await fetch(`${API_BASE}/api/categories?onlyActive=true&showInVehicleNav=true`);
        if (!res.ok) throw new Error("api error");
        const data: ApiCategory[] = await res.json();
        const mapped = mapCategoriesToNavBrands(data);
        if (mapped.length > 0) { setNavBrands(mapped); return; }
      } catch { /* fallback below */ }
      // Fallback: hardcoded CAR_BRANDS (no real IDs — search-based navigation)
      setNavBrands(CAR_BRANDS.map(b => ({
        key: b.key, label: b.label, id: "",
        models: (MODEL_MAP[b.key] ?? []).map(name => ({ name, id: "" })),
      })));
    }
    void loadBrands();
  }, []);


  // ── Scroll durumunu güncelle ─────────────────────────────────────────────
  const updateScroll = useCallback(() => {
    const el = pillRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScroll();
    const el = pillRef.current;
    el?.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("resize", updateScroll);
    return () => {
      el?.removeEventListener("scroll", updateScroll);
      window.removeEventListener("resize", updateScroll);
    };
  }, [updateScroll]);

  function scrollPills(dir: "left" | "right") {
    if (!pillRef.current) return;
    pillRef.current.scrollBy({ left: dir === "left" ? -240 : 240, behavior: "smooth" });
  }

  // ── Hover açma / kapatma mantığı — timer yok, anlık ────────────────────
  function handleBrandEnter(brand: NavBrand) {
    if (brand.models.length > 0) setOpenBrand(brand.key);
    setActiveBrand(brand.key);
  }

  // Wrapper'dan (pill + dropdown) tamamen çıkınca anında kapat
  function handleWrapperLeave() {
    setOpenBrand(null);
  }

  function handleBrandClick(brand: NavBrand) {
    setNavigatingTo(brand.label);
    setOpenBrand(null);
    startTransition(() => {
      router.push(`/urunler?s=${encodeURIComponent(brand.label)}`);
    });
  }

  function handleModelClick(_brand: NavBrand, model: NavModel) {
    setNavigatingTo(model.name);
    setOpenBrand(null);
    startTransition(() => {
      router.push(`/urunler?arac=${encodeURIComponent(model.name)}`);
    });
  }

  const openBrandObj = openBrand ? navBrands.find(b => b.key === openBrand) ?? null : null;
  const models       = openBrandObj?.models ?? [];

  return (
    <div
      ref={wrapperRef}
      className="relative bg-white border-b border-gray-100 shadow-sm"
      onMouseLeave={handleWrapperLeave}
    >
      {/* Navigasyon yükleniyor göstergesi */}
      {(isPending || navigatingTo) && (
        <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
          {/* İnce turuncu progress bar */}
          <div className="h-0.5 bg-orange-200">
            <div className="h-full bg-orange-500 animate-[progress_1.2s_ease-in-out_infinite]" style={{ width: "60%", animationName: "navprogress" }} />
          </div>
          <style>{`
            @keyframes navprogress {
              0%   { width: 0%;   margin-left: 0; }
              50%  { width: 70%;  margin-left: 10%; }
              100% { width: 0%;   margin-left: 100%; }
            }
          `}</style>
          {/* Yönlendiriliyor bildirimi */}
          <div className="absolute top-0.5 right-3 bg-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-b-lg shadow-md flex items-center gap-1.5">
            <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {navigatingTo ? `${navigatingTo} yükleniyor…` : "Yükleniyor…"}
          </div>
        </div>
      )}
      {/* ── Pill şeridi + ok butonları ──────────────────────────────────── */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Sol ok */}
        {canScrollLeft && (
          <button
            onClick={() => scrollPills("left")}
            className="absolute left-0 top-0 bottom-0 z-10 flex items-center pl-1 pr-3"
            style={{ background: "linear-gradient(to right, white 60%, transparent)" }}
            aria-label="Sola kaydır"
          >
            <span className="w-7 h-7 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center text-gray-600 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-all">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </span>
          </button>
        )}

        {/* Pill container — scrollbar gizli, ok butonlarıyla kaydırılır */}
        <div
          ref={pillRef}
          className="flex items-center gap-0 py-1"
          style={{ overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>
          {navBrands.map(brand => (
            <button
              key={brand.key}
              onMouseEnter={() => handleBrandEnter(brand)}
              onClick={() => handleBrandClick(brand)}
              className={`flex-shrink-0 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wide transition-all duration-150 border-b-2 whitespace-nowrap select-none ${
                activeBrand === brand.key || openBrand === brand.key
                  ? "border-orange-500 text-orange-600 bg-orange-50"
                  : "border-transparent text-gray-600 hover:text-orange-600 hover:border-orange-300 hover:bg-orange-50/50"
              }`}
            >
              {brand.label}
            </button>
          ))}
        </div>

        {/* Sağ ok */}
        {canScrollRight && (
          <button
            onClick={() => scrollPills("right")}
            className="absolute right-0 top-0 bottom-0 z-10 flex items-center pr-1 pl-3"
            style={{ background: "linear-gradient(to left, white 60%, transparent)" }}
            aria-label="Sağa kaydır"
          >
            <span className="w-7 h-7 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center text-gray-600 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-all">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </span>
          </button>
        )}
      </div>

      {/* ── Model dropdown ──────────────────────────────────────────────── */}
      {openBrandObj && models.length > 0 && (
        <div
          className="absolute left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-2xl"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {/* Başlık */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-gray-800 uppercase tracking-wide">{openBrandObj.label}</span>
                <span className="text-[10px] text-gray-400 font-semibold">— Model Seçin</span>
                <span className="text-[10px] bg-orange-100 text-orange-600 font-bold px-2 py-0.5 rounded-full">{models.length} model</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setOpenBrand(null);
                    router.push(`/urunler?s=${encodeURIComponent(openBrandObj.label)}`);
                  }}
                  className="text-[11px] text-orange-600 font-bold hover:underline"
                >
                  Tüm {openBrandObj.label} Ürünlerini Gör →
                </button>
                <button
                  onClick={() => setOpenBrand(null)}
                  className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>
            {/* Model grid — yandan görünüm, farklı renkler, büyük kart */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9 gap-2">
              {models.map((model, idx) => {
                const isNavigating = navigatingTo === model.name;
                return (
                  <button
                    key={model.id || model.name}
                    onClick={() => handleModelClick(openBrandObj, model)}
                    disabled={isPending || navigatingTo !== null}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all duration-150 group text-center relative ${
                      isNavigating
                        ? "border-orange-400 bg-orange-50 shadow-md"
                        : "border-gray-100 hover:border-orange-300 hover:shadow-md bg-gray-50/60 hover:bg-orange-50/60"
                    }`}
                  >
                    <div className="w-full h-20 flex items-center justify-center relative">
                      <ModelImage brandKey={openBrandObj.key} modelName={model.name} idx={idx} imageUrl={model.imageUrl} />
                      {isNavigating && (
                        <div className="absolute inset-0 bg-orange-50/80 flex items-center justify-center rounded-lg">
                          <svg className="w-6 h-6 animate-spin text-orange-500" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <span className={`text-[10px] font-semibold leading-tight line-clamp-2 w-full transition-colors ${
                      isNavigating ? "text-orange-600 font-bold" : "text-gray-600 group-hover:text-orange-600"
                    }`}>{model.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
