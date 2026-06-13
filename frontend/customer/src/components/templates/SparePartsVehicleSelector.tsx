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

export default function SparePartsVehicleSelector() {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [plate, setPlate] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const qs = new URLSearchParams();
    if (plate) qs.set("s", plate);
    else if (brand && model) qs.set("s", `${brand} ${model}`);
    else if (brand) qs.set("s", brand);
    router.push(`/urunler${qs.toString() ? `?${qs}` : ""}`);
  }

  const models = brand ? (MODELS[brand] ?? []) : [];

  return (
    <form onSubmit={handleSearch} className="flex flex-col gap-2.5">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Plaka ile ara</label>
        <input
          type="text"
          value={plate}
          onChange={e => setPlate(e.target.value)}
          placeholder="34 ABC 123"
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-700 focus:border-orange-500 focus:outline-none"
        />
      </div>
      <p className="text-xs text-gray-400 leading-snug">— veya araç modelini seçin —</p>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Marka</label>
        <select
          value={brand}
          onChange={e => { setBrand(e.target.value); setModel(""); }}
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-700 focus:border-orange-500 focus:outline-none bg-white"
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
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-700 focus:border-orange-500 focus:outline-none bg-white disabled:bg-gray-50 disabled:text-gray-400"
        >
          <option value="">Model seçin</option>
          {models.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <button
        type="submit"
        className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold py-2.5 rounded-xl transition"
      >
        Parça Ara
      </button>
    </form>
  );
}
