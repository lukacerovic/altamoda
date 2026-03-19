"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight, ShoppingCart, X,
} from "lucide-react";

const brandTabs = [
  { key: "majirel", label: "Majirel" },
  { key: "igora", label: "Igora Royal" },
  { key: "koleston", label: "Koleston" },
  { key: "inoa", label: "INOA" },
];

const levels = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
const undertones = [
  { key: "N", label: "Natural" },
  { key: "A", label: "Pepeljasta" },
  { key: "G", label: "Zlatna" },
  { key: "C", label: "Bakar" },
  { key: "R", label: "Crvena" },
  { key: "V", label: "Ljubicasta" },
  { key: "M", label: "Mat" },
  { key: "B", label: "Braon" },
];

type ColorItem = { code: string; hex: string; name: string; level: string; undertone: string; price: number };

function generateColors(): ColorItem[] {
  const hexMap: Record<string, Record<string, string>> = {
    "1": { N: "#0a0a0a", A: "#1a1520", G: "#1a1510", C: "#1a1008", R: "#1a0808", V: "#150a1a", M: "#0f100a", B: "#1a1510" },
    "2": { N: "#1a1510", A: "#201a25", G: "#201a10", C: "#201008", R: "#200808", V: "#1a0a20", M: "#15160a", B: "#201a10" },
    "3": { N: "#3a2a1a", A: "#352a35", G: "#3a3018", C: "#3a2010", R: "#3a1510", V: "#2a1535", M: "#302a18", B: "#3a2a18" },
    "4": { N: "#4a3a2a", A: "#453545", G: "#504020", C: "#4a2a15", R: "#4a1a15", V: "#3a1a45", M: "#403a20", B: "#4a3520" },
    "5": { N: "#5a4a3a", A: "#554555", G: "#605028", C: "#5a3520", R: "#5a2520", V: "#4a2555", M: "#504a28", B: "#5a4528" },
    "6": { N: "#6a5a4a", A: "#655565", G: "#706030", C: "#6a4525", R: "#6a3025", V: "#5a3065", M: "#605a30", B: "#6a5530" },
    "7": { N: "#8a7a6a", A: "#857585", G: "#907838", C: "#8a5a30", R: "#8a4030", V: "#7a4085", M: "#7a7a38", B: "#8a7038" },
    "8": { N: "#a89878", A: "#a59598", G: "#b09548", C: "#a86a38", R: "#a85038", V: "#985098", M: "#989848", B: "#a88848" },
    "9": { N: "#c8b898", A: "#c0b0b8", G: "#d0b558", C: "#c88048", R: "#c86048", V: "#b868b0", M: "#b8b858", B: "#c8a058" },
    "10": { N: "#e8d8b8", A: "#d8c8d8", G: "#e8d068", C: "#e89858", R: "#e87858", V: "#d080c8", M: "#d0d068", B: "#e0b868" },
  };

  const colors: ColorItem[] = [];
  levels.forEach((level) => {
    undertones.forEach((ut) => {
      const hex = hexMap[level]?.[ut.key] || "#888888";
      colors.push({
        code: `${level}.${ut.key === "N" ? "0" : ut.key === "A" ? "1" : ut.key === "G" ? "3" : ut.key === "C" ? "4" : ut.key === "R" ? "6" : ut.key === "V" ? "2" : ut.key === "M" ? "7" : "8"}`,
        hex,
        name: `Nivo ${level} ${ut.label}`,
        level,
        undertone: ut.key,
        price: 890,
      });
    });
  });
  return colors;
}

const allColors = generateColors();

export default function ColorsPage() {
  const [activeBrand, setActiveBrand] = useState("majirel");
  const [filterLevel, setFilterLevel] = useState<string | null>(null);
  const [filterUndertone, setFilterUndertone] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<ColorItem | null>(null);

  const filtered = allColors.filter((c) => {
    if (filterLevel && c.level !== filterLevel) return false;
    if (filterUndertone && c.undertone !== filterUndertone) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-[#8c4a5a]">Pocetna</Link><ChevronRight className="w-3 h-3" /><span className="text-[#2d2d2d]">Boje za Kosu</span>
        </nav>

        <h1 className="text-3xl font-bold text-[#2d2d2d] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Paleta Boja za Kosu</h1>
        <p className="text-gray-500 mb-8">Odaberite savrsen ton iz nase profesionalne palete boja</p>

        {/* Brand tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {brandTabs.map((b) => (
            <button key={b.key} onClick={() => setActiveBrand(b.key)} className={`px-6 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeBrand === b.key ? "bg-[#8c4a5a] text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-[#8c4a5a]"}`}>{b.label}</button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-6 mb-8">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Nivo svetloce</span>
            <div className="flex gap-1.5 flex-wrap">
              <button onClick={() => setFilterLevel(null)} className={`w-8 h-8 rounded text-xs font-medium transition-colors ${!filterLevel ? "bg-[#8c4a5a] text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-[#8c4a5a]"}`}>Svi</button>
              {levels.map((l) => (
                <button key={l} onClick={() => setFilterLevel(filterLevel === l ? null : l)} className={`w-8 h-8 rounded text-xs font-medium transition-colors ${filterLevel === l ? "bg-[#8c4a5a] text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-[#8c4a5a]"}`}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Podton</span>
            <div className="flex gap-1.5 flex-wrap">
              <button onClick={() => setFilterUndertone(null)} className={`px-3 h-8 rounded text-xs font-medium transition-colors ${!filterUndertone ? "bg-[#8c4a5a] text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-[#8c4a5a]"}`}>Svi</button>
              {undertones.map((ut) => (
                <button key={ut.key} onClick={() => setFilterUndertone(filterUndertone === ut.key ? null : ut.key)} className={`px-3 h-8 rounded text-xs font-medium transition-colors ${filterUndertone === ut.key ? "bg-[#8c4a5a] text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-[#8c4a5a]"}`}>{ut.label}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Color grid */}
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-4">{filtered.length} nijansi</p>
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
              {filtered.map((color) => (
                <button key={color.code} onClick={() => setSelectedColor(color)} className={`group relative flex flex-col items-center gap-1 ${selectedColor?.code === color.code ? "scale-110" : ""} transition-transform`}>
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 transition-all hover:scale-110 ${selectedColor?.code === color.code ? "border-[#8c4a5a] ring-2 ring-[#8c4a5a]/30" : "border-white shadow-sm hover:border-[#8c4a5a]"}`} style={{ backgroundColor: color.hex }} />
                  <span className="text-[10px] text-gray-500 font-medium">{color.code}</span>
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#2d2d2d] text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {color.name}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#2d2d2d] rotate-45 -mt-1" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected color detail */}
          {selectedColor && (
            <div className="hidden lg:block w-72 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                <button onClick={() => setSelectedColor(null)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                <div className="w-20 h-20 rounded-full mx-auto mb-4 shadow-lg border-4 border-white" style={{ backgroundColor: selectedColor.hex }} />
                <div className="text-center mb-4">
                  <span className="text-xs text-[#8c4a5a] font-medium uppercase tracking-wider">{brandTabs.find((b) => b.key === activeBrand)?.label}</span>
                  <h3 className="text-lg font-bold text-[#2d2d2d] mt-1">{selectedColor.code}</h3>
                  <p className="text-sm text-gray-500">{selectedColor.name}</p>
                </div>
                <div className="space-y-2 text-sm mb-6">
                  <div className="flex justify-between"><span className="text-gray-500">Nivo</span><span className="font-medium">{selectedColor.level}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Podton</span><span className="font-medium">{undertones.find((u) => u.key === selectedColor.undertone)?.label}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Cena</span><span className="font-bold text-[#2d2d2d]">{selectedColor.price} RSD</span></div>
                </div>
                <button className="w-full bg-[#8c4a5a] hover:bg-[#6e3848] text-white py-3 rounded font-medium transition-colors flex items-center justify-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> Dodaj u Korpu
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
