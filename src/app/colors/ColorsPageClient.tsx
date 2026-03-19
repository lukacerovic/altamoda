"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronRight, ShoppingCart, X,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface BrandLine {
  slug: string;
  name: string;
  brand: string;
  count: number;
}

interface ColorItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  shadeCode: string;
  hexValue: string;
  level: number;
  undertoneCode: string;
  undertoneName: string;
  price: number;
  brand: { name: string; slug: string } | null;
  productLine: { name: string; slug: string } | null;
  image: string | null;
}

const levels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const undertones = [
  { key: "N", label: "Natural" },
  { key: "A", label: "Pepeljasta" },
  { key: "G", label: "Zlatna" },
  { key: "C", label: "Bakar" },
  { key: "R", label: "Crvena" },
  { key: "V", label: "Ljubičasta" },
  { key: "M", label: "Mat" },
  { key: "B", label: "Braon" },
];

interface Props {
  initialBrandLines: BrandLine[];
  initialColors: ColorItem[];
  initialTotal: number;
}

export default function ColorsPageClient({ initialBrandLines, initialColors, initialTotal }: Props) {
  const [brandLines] = useState<BrandLine[]>(initialBrandLines);
  const [activeBrand, setActiveBrand] = useState(initialBrandLines[0]?.slug || "");
  const [colors, setColors] = useState<ColorItem[]>(initialColors);
  const [total, setTotal] = useState(initialTotal);
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [filterUndertone, setFilterUndertone] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<ColorItem | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch colors when brand tab or filters change
  useEffect(() => {
    async function fetchColors() {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeBrand) params.set("brandLine", activeBrand);
      if (filterLevel) params.set("level", String(filterLevel));
      if (filterUndertone) params.set("undertone", filterUndertone);

      try {
        const res = await fetch(`/api/products/colors?${params}`);
        const data = await res.json();
        if (data.success) {
          // Flatten grouped colors into array
          const flat: ColorItem[] = [];
          for (const level of Object.keys(data.data.colors)) {
            for (const ut of Object.keys(data.data.colors[level])) {
              flat.push(...data.data.colors[level][ut]);
            }
          }
          setColors(flat);
          setTotal(data.data.total);
        }
      } catch (err) {
        console.error("Failed to fetch colors:", err);
      }
      setLoading(false);
    }

    fetchColors();
  }, [activeBrand, filterLevel, filterUndertone]);

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-[#8c4a5a]">Početna</Link><ChevronRight className="w-3 h-3" /><span className="text-[#2d2d2d]">Boje za Kosu</span>
        </nav>

        <h1 className="text-3xl font-bold text-[#2d2d2d] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Paleta Boja za Kosu</h1>
        <p className="text-gray-500 mb-8">Odaberite savršen ton iz naše profesionalne palete boja</p>

        {/* Brand tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {brandLines.map((b) => (
            <button
              key={b.slug}
              onClick={() => { setActiveBrand(b.slug); setSelectedColor(null); }}
              className={`px-6 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeBrand === b.slug ? "bg-[#8c4a5a] text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-[#8c4a5a]"}`}
            >
              {b.name} <span className="text-xs opacity-70">({b.count})</span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-6 mb-8">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Nivo svetloće</span>
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
            <p className="text-sm text-gray-500 mb-4">{loading ? "Učitavanje..." : `${total} nijansi`}</p>
            {colors.length === 0 && !loading ? (
              <div className="bg-white rounded-lg p-12 text-center">
                <p className="text-gray-500">Nema boja za odabrane filtere</p>
              </div>
            ) : (
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
                {colors.map((color) => (
                  <button key={color.id} onClick={() => setSelectedColor(color)} className={`group relative flex flex-col items-center gap-1 ${selectedColor?.id === color.id ? "scale-110" : ""} transition-transform`}>
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 transition-all hover:scale-110 ${selectedColor?.id === color.id ? "border-[#8c4a5a] ring-2 ring-[#8c4a5a]/30" : "border-white shadow-sm hover:border-[#8c4a5a]"}`} style={{ backgroundColor: color.hexValue }} />
                    <span className="text-[10px] text-gray-500 font-medium">{color.shadeCode}</span>
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#2d2d2d] text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {color.name}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#2d2d2d] rotate-45 -mt-1" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected color detail */}
          {selectedColor && (
            <div className="hidden lg:block w-72 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                <button onClick={() => setSelectedColor(null)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                <div className="w-20 h-20 rounded-full mx-auto mb-4 shadow-lg border-4 border-white" style={{ backgroundColor: selectedColor.hexValue }} />
                <div className="text-center mb-4">
                  <span className="text-xs text-[#8c4a5a] font-medium uppercase tracking-wider">{selectedColor.productLine?.name || selectedColor.brand?.name}</span>
                  <h3 className="text-lg font-bold text-[#2d2d2d] mt-1">{selectedColor.shadeCode}</h3>
                  <p className="text-sm text-gray-500">{selectedColor.name}</p>
                </div>
                <div className="space-y-2 text-sm mb-6">
                  <div className="flex justify-between"><span className="text-gray-500">Nivo</span><span className="font-medium">{selectedColor.level}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Podton</span><span className="font-medium">{selectedColor.undertoneName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Cena</span><span className="font-bold text-[#2d2d2d]">{selectedColor.price.toLocaleString("sr-RS")} RSD</span></div>
                </div>
                <Link href={`/products/${selectedColor.slug}`} className="block w-full bg-[#8c4a5a] hover:bg-[#6e3848] text-white py-3 rounded font-medium transition-colors text-center mb-2">
                  Pogledaj proizvod
                </Link>
                <button className="w-full border border-[#8c4a5a] text-[#8c4a5a] hover:bg-[#8c4a5a] hover:text-white py-3 rounded font-medium transition-colors flex items-center justify-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> Dodaj u Korpu
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
