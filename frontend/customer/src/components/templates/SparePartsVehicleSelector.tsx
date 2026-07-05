"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const BRANDS = [
  "Volkswagen","BMW","Mercedes-Benz","Opel","Ford","Renault","Peugeot",
  "Toyota","Fiat","Hyundai","Audi","Skoda","Seat","Honda","Nissan",
  "Kia","Citroën","Dacia","Volvo","Jeep",
];

const MODELS: Record<string, string[]> = {
  "Volkswagen": ["Golf","Passat","Polo","Tiguan","Caddy","Transporter","Jetta","Touareg"],
  "BMW": ["3 Serisi","5 Serisi","1 Serisi","X1","X3","X5","7 Serisi","M3"],
  "Mercedes-Benz": ["C Serisi","E Serisi","A Serisi","GLC","GLE","Sprinter","Vito","CLA"],
  "Opel": ["Astra","Corsa","Insignia","Zafira","Mokka","Crossland","Combo","Vivaro"],
  "Ford": ["Focus","Fiesta","Transit","Mondeo","Kuga","Puma","Ranger","EcoSport"],
  "Renault": ["Megane","Clio","Symbol","Kangoo","Fluence","Duster","Trafic","Master"],
  "Peugeot": ["208","308","3008","206","5008","Partner","Expert","Boxer"],
  "Toyota": ["Corolla","Yaris","RAV4","Hilux","Land Cruiser","Auris","Avensis","Prius"],
  "Fiat": ["Egea","Doblo","Ducato","Tipo","500","Bravo","Stilo","Punto"],
  "Hyundai": ["i20","i30","Tucson","Santa Fe","Elantra","Accent","ix35","Kona"],
  "Audi": ["A3","A4","A6","Q3","Q5","Q7","A1","TT"],
  "Skoda": ["Octavia","Fabia","Superb","Kodiaq","Karoq","Rapid","Scala","Roomster"],
  "Seat": ["Ibiza","Leon","Ateca","Arona","Toledo","Alhambra","Altea","Tarraco"],
  "Honda": ["Civic","Jazz","CR-V","HR-V","Accord","FR-V","Jazz"],
  "Nissan": ["Qashqai","Micra","Juke","X-Trail","Note","Navara","NV200","Leaf"],
  "Kia": ["Ceed","Sportage","Picanto","Rio","Sorento","Stonic","Soul","Niro"],
  "Citroën": ["C3","C4","C5","Berlingo","Jumpy","Dispatch","DS3","DS4"],
  "Dacia": ["Sandero","Duster","Logan","Dokker","Lodgy","Spring"],
  "Volvo": ["V40","V60","XC40","XC60","XC90","S60","S90"],
  "Jeep": ["Renegade","Compass","Cherokee","Grand Cherokee","Wrangler"],
};

type SearchMode = "vehicle" | "oem" | "chassis";

const INPUT = "w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-700 focus:border-orange-500 focus:outline-none bg-white disabled:bg-gray-50 disabled:text-gray-400";

export default function SparePartsVehicleSelector() {
  const [mode, setMode] = useState<SearchMode>("vehicle");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [motor, setMotor] = useState("");
  const [oemNo, setOemNo] = useState("");
  const [chassis, setChassis] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const qs = new URLSearchParams();
    if (mode === "oem" && oemNo.trim()) {
      qs.set("oemNo", oemNo.trim());
    } else if (mode === "chassis" && chassis.trim()) {
      qs.set("chassis", chassis.trim());
    } else {
      // vehicle mode — combine brand + model + motor into arac param (word-boundary search)
      const parts = [brand, model, motor].filter(Boolean);
      if (parts.length > 0) {
        if (model) {
          qs.set("arac", [brand, model].filter(Boolean).join(" "));
        } else if (brand) {
          qs.set("s", brand);
        }
        if (motor) qs.set("motor", motor.trim());
      }
    }
    router.push(`/urunler${qs.toString() ? `?${qs}` : ""}`);
  }

  const models = brand ? (MODELS[brand] ?? []) : [];

  const TAB = (m: SearchMode, label: string) => (
    <button
      type="button"
      onClick={() => setMode(m)}
      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
        mode === m
          ? "bg-orange-500 text-white shadow-sm"
          : "text-gray-500 hover:bg-gray-100"
      }`}
    >
      {label}
    </button>
  );

  return (
    <form onSubmit={handleSearch} className="flex flex-col gap-2.5">
      {/* Mode tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {TAB("vehicle", "Araç")}
        {TAB("oem", "OEM / Parça No")}
        {TAB("chassis", "Şasi No")}
      </div>

      {mode === "vehicle" && (
        <>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Marka</label>
            <select
              value={brand}
              onChange={e => { setBrand(e.target.value); setModel(""); }}
              className={INPUT}
            >
              <option value="">Marka seçin</option>
              {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Model</label>
            <select
              value={model}
              onChange={e => setModel(e.target.value)}
              disabled={!brand}
              className={INPUT}
            >
              <option value="">Model seçin</option>
              {models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Motor</label>
            <input
              type="text"
              value={motor}
              onChange={e => setMotor(e.target.value)}
              placeholder="örn: 1.6 TDI, 2.0 FSI, 1NZ-FE..."
              className={INPUT}
            />
          </div>
        </>
      )}

      {mode === "oem" && (
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">OEM / Parça No</label>
          <input
            type="text"
            value={oemNo}
            onChange={e => setOemNo(e.target.value)}
            placeholder="örn: TI13292D, 1K0498099A..."
            className={INPUT}
            autoFocus
          />
          <p className="text-[10px] text-gray-400 mt-1">Orijinal parça numarası veya tedarikçi ref. kodu</p>
        </div>
      )}

      {mode === "chassis" && (
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Şasi / VIN No</label>
          <input
            type="text"
            value={chassis}
            onChange={e => setChassis(e.target.value)}
            placeholder="örn: WVWZZZ1KZ6W..."
            className={INPUT}
            autoFocus
          />
          <p className="text-[10px] text-gray-400 mt-1">Araç şasi numarası (VIN)</p>
        </div>
      )}

      <button
        type="submit"
        className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold py-2.5 rounded-xl transition"
      >
        Parça Ara
      </button>
    </form>
  );
}
