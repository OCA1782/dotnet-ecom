"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import ProductFilters, { type ProductFiltersProps } from "./ProductFilters";

function countActiveFilters(p: ProductFiltersProps): number {
  let n = 0;
  if (p.searchTerm) n++;
  if (p.activeCategory) n++;
  if (p.minFiyat || p.maxFiyat) n++;
  if (p.activeBrandIds.length > 0) n++;
  if (p.activeRating) n++;
  if (p.activeSiralama) n++;
  if (p.activeIndirimli) n++;
  if (p.activeNitelikler) n++;
  if (p.activeVehicleModel) n++;
  if (p.activeOemNo) n++;
  if (p.activeChassis) n++;
  if (p.activeMotor) n++;
  return n;
}

export default function MobileFilterSheet(props: ProductFiltersProps) {
  const [open, setOpen] = useState(false);
  const count = countActiveFilters(props);

  return (
    <div className="lg:hidden mb-4">
      {/* Trigger bar */}
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between gap-2 py-2.5 px-4 rounded-xl border border-teal-200 bg-white text-teal-700 text-sm font-semibold shadow-sm hover:bg-teal-50 transition"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal size={15} />
          Filtrele &amp; Sırala
        </span>
        {count > 0 && (
          <span className="bg-teal-600 text-white rounded-full text-xs font-bold w-5 h-5 flex items-center justify-center leading-none">
            {count}
          </span>
        )}
      </button>

      {/* Bottom sheet */}
      {open && (
        <div
          className="fixed inset-0 z-[99]"
          onClick={() => setOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Sheet panel */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[88vh] flex flex-col z-10"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle + header */}
            <div className="flex flex-col items-center pt-3 pb-2 border-b border-slate-100 px-5">
              <div className="w-10 h-1 rounded-full bg-slate-200 mb-3" />
              <div className="w-full flex items-center justify-between">
                <h2 className="font-bold text-slate-800 text-base">
                  Filtrele &amp; Sırala
                  {count > 0 && (
                    <span className="ml-2 text-teal-600 text-sm font-normal">({count} aktif)</span>
                  )}
                </h2>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable filter content */}
            <div className="overflow-y-auto flex-1 p-5">
              <ProductFilters
                {...props}
                onNavigate={() => setOpen(false)}
                className="space-y-6"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
