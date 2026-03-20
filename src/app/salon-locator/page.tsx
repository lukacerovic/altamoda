"use client";

import { useState } from "react";
import {
  MapPin,
  Search,
  Star,
  Phone,
  Clock,
  Award,
  Navigation,
  ChevronDown,
} from "lucide-react";

const salons = [
  { id: 1, name: "Salon Glamour", address: "Knez Mihailova 24, Beograd", phone: "+381 11 234 5678", rating: 4.9, reviews: 128, partner: true, hours: "Pon-Sub: 09:00-20:00", city: "Beograd", x: 45, y: 35 },
  { id: 2, name: "Studio Belle", address: "Bulevar Oslobođenja 112, Novi Sad", phone: "+381 21 456 7890", rating: 4.7, reviews: 89, partner: true, hours: "Pon-Pet: 09:00-19:00, Sub: 09:00-15:00", city: "Novi Sad", x: 30, y: 25 },
  { id: 3, name: "Hair Atelier", address: "Nikole Pašića 18, Niš", phone: "+381 18 345 6789", rating: 4.8, reviews: 67, partner: true, hours: "Pon-Sub: 08:00-20:00", city: "Niš", x: 65, y: 65 },
  { id: 4, name: "Chic & Style", address: "Kralja Petra I 45, Kragujevac", phone: "+381 34 567 8901", rating: 4.6, reviews: 45, partner: false, hours: "Pon-Pet: 09:00-19:00", city: "Kragujevac", x: 48, y: 50 },
  { id: 5, name: "Prestige Hair Studio", address: "Korzo 15, Subotica", phone: "+381 24 678 9012", rating: 4.8, reviews: 92, partner: true, hours: "Pon-Sub: 09:00-21:00", city: "Subotica", x: 28, y: 10 },
];

const cities = ["Svi gradovi", "Beograd", "Novi Sad", "Niš", "Kragujevac", "Subotica"];

export default function SalonLocatorPage() {
  const [selectedCity, setSelectedCity] = useState("Svi gradovi");
  const [selectedSalon, setSelectedSalon] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = salons.filter((s) => {
    if (selectedCity !== "Svi gradovi" && s.city !== selectedCity) return false;
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) && !s.address.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const selected = salons.find((s) => s.id === selectedSalon);

  return (
    <div className="min-h-screen bg-stone-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-10">
          <MapPin className="w-12 h-12 text-secondary mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold text-black mb-3" style={{ fontFamily: "'Noto Serif', serif" }}>
            Pronađite Salon
          </h1>
          <p className="text-[#666]">Otkrijte Alta Moda partnerske salone u vašoj blizini</p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8 max-w-2xl mx-auto">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Pretražite salone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-sm text-sm focus:border-black transition-all"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
          </div>
          <div className="relative">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="appearance-none w-full sm:w-48 px-4 py-3 bg-white border border-stone-200 rounded-sm text-sm focus:border-black pr-10 cursor-pointer"
            >
              {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999] pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Map */}
          <div className="flex-1">
            <div className="bg-white rounded-sm border border-stone-200 overflow-hidden shadow-sm relative" style={{ height: "500px" }}>
              {/* Mock map background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#e8f4e8] to-[#d4e8d4]">
                {/* Grid lines for map effect */}
                <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
                {/* Map label */}
                <div className="absolute top-4 left-4 bg-white/90 px-3 py-1.5 rounded-sm shadow-sm text-xs font-medium text-[#666]">
                  <Navigation className="w-3 h-3 inline mr-1" /> Srbija
                </div>
                {/* Pin markers */}
                {filtered.map((salon) => (
                  <button
                    key={salon.id}
                    onClick={() => setSelectedSalon(salon.id)}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all ${selectedSalon === salon.id ? "scale-125 z-10" : "hover:scale-110"}`}
                    style={{ left: `${salon.x}%`, top: `${salon.y}%` }}
                  >
                    <div className={`flex flex-col items-center`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${selectedSalon === salon.id ? "bg-black" : salon.partner ? "bg-stone-900" : "bg-[#666]"}`}>
                        <MapPin className="w-4 h-4 text-white" />
                      </div>
                      <div className={`mt-1 px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${selectedSalon === salon.id ? "bg-black text-white" : "bg-white text-[#333] shadow-sm"}`}>
                        {salon.name}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected salon detail */}
            {selected && (
              <div className="mt-4 bg-white rounded-sm border border-black/30 p-6 animate-slideUp">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-black">{selected.name}</h3>
                      {selected.partner && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-black/10 text-secondary text-[10px] font-semibold rounded-full">
                          <Award className="w-3 h-3" /> PARTNER
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#666] flex items-center gap-1"><MapPin className="w-3 h-3" /> {selected.address}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-[#735b28] text-secondary" />
                    <span className="font-semibold text-sm">{selected.rating}</span>
                    <span className="text-xs text-[#999]">({selected.reviews})</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 mt-4 text-sm text-[#666]">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-secondary" /> {selected.phone}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-secondary" /> {selected.hours}</span>
                </div>
              </div>
            )}
          </div>

          {/* Salon List */}
          <div className="w-full lg:w-96 space-y-3">
            <p className="text-sm text-[#666] mb-2">{filtered.length} salona pronađeno</p>
            {filtered.map((salon) => (
              <button
                key={salon.id}
                onClick={() => setSelectedSalon(salon.id)}
                className={`w-full text-left bg-white rounded-sm border p-4 hover:shadow-sm transition-all ${
                  selectedSalon === salon.id ? "border-black shadow-sm" : "border-stone-200"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-black">{salon.name}</h3>
                      {salon.partner && (
                        <span className="px-1.5 py-0.5 bg-black/10 text-secondary text-[9px] font-bold rounded">PARTNER</span>
                      )}
                    </div>
                    <p className="text-xs text-[#999] mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {salon.address}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-[#735b28] text-secondary" />
                    <span className="text-xs font-semibold">{salon.rating}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-[#999]">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {salon.phone}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {salon.hours.split(",")[0]}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
