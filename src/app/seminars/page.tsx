"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight, Calendar, MapPin as MapPinIcon,
  Users, Clock, X, List, Grid3X3,
} from "lucide-react";

const seminars = [
  { id: 1, title: "Balayage Masterclass", instructor: "Marco Rossi", date: "25. mart 2026", time: "10:00 - 16:00", location: "Alta Moda Studio, Beograd", price: 15000, spots: 8, totalSpots: 20, category: "Koloristika", image: "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=400&h=300&fit=crop" },
  { id: 2, title: "Napredne Tehnike Šišanja", instructor: "Elena Vukčević", date: "2. april 2026", time: "09:00 - 15:00", location: "Hotel Hyatt, Beograd", price: 12000, spots: 15, totalSpots: 30, category: "Šišanje", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop" },
  { id: 3, title: "Kérastase Ritual Tretmani", instructor: "Sophie Laurent", date: "10. april 2026", time: "11:00 - 17:00", location: "Alta Moda Studio, Beograd", price: 8000, spots: 5, totalSpots: 15, category: "Nega", image: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=400&h=300&fit=crop" },
  { id: 4, title: "Business & Salon Management", instructor: "Nikola Jovanović", date: "18. april 2026", time: "10:00 - 14:00", location: "Online (Zoom)", price: 5000, spots: 50, totalSpots: 100, category: "Biznis", image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&h=300&fit=crop" },
];

const pastSeminars = [
  { title: "Olaplex Edukacija", instructor: "James Miller", date: "5. mart 2026", attendees: 25, image: "https://images.unsplash.com/photo-1519735777090-ec97162dc266?w=400&h=250&fit=crop" },
  { title: "Creative Coloring Workshop", instructor: "Ana Petrović", date: "20. feb 2026", attendees: 18, image: "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=400&h=250&fit=crop" },
  { title: "Men's Grooming Trends", instructor: "Stefan Marković", date: "10. feb 2026", attendees: 22, image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=250&fit=crop" },
];

export default function SeminarsPage() {
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [showRegistration, setShowRegistration] = useState<number | null>(null);

  const selectedSeminar = seminars.find((s) => s.id === showRegistration);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Hero */}
      <section className="relative h-[280px] md:h-[350px] overflow-hidden">
        <img src="https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=1600&h=600&fit=crop" alt="Seminari" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#1a1a1a]/70" />
        <div className="relative max-w-7xl mx-auto px-4 h-full flex items-center justify-center text-center">
          <div>
            <span className="text-[#c8a96e] text-xs uppercase tracking-[0.25em] font-medium">Edukacija</span>
            <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-4 text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Seminari i Radionice</h1>
            <p className="text-white/60 max-w-lg mx-auto">Unapredite svoje veštine uz naše profesionalne seminare sa vrhunskim edukatorima.</p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-[#c8a96e]">Početna</Link><ChevronRight className="w-3 h-3" /><span className="text-[#1a1a1a]">Seminari</span>
        </nav>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: "'Playfair Display', serif" }}>Predstojeći seminari</h2>
            <p className="text-gray-500 mt-1">{seminars.length} seminara u ponudi</p>
          </div>
          <div className="hidden sm:flex items-center border border-gray-200 rounded overflow-hidden">
            <button onClick={() => setViewMode("list")} className={`p-2 ${viewMode === "list" ? "bg-[#c8a96e] text-white" : "text-gray-400 hover:text-[#1a1a1a]"}`}><List className="w-4 h-4" /></button>
            <button onClick={() => setViewMode("calendar")} className={`p-2 ${viewMode === "calendar" ? "bg-[#c8a96e] text-white" : "text-gray-400 hover:text-[#1a1a1a]"}`}><Grid3X3 className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Upcoming seminars */}
        <div className="space-y-4 mb-16">
          {seminars.map((seminar) => (
            <div key={seminar.id} className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col md:flex-row md:items-center gap-0 hover:shadow-md transition-all">
              <div className="flex-shrink-0 relative w-full md:w-56 h-44 md:h-full overflow-hidden">
                <img src={seminar.image} alt={seminar.title} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-center">
                  <span className="text-lg font-bold text-[#c8a96e] block leading-tight">{seminar.date.split(".")[0]}</span>
                  <span className="text-[10px] text-gray-500 uppercase">{seminar.date.split(" ")[1]?.replace(".", "")}</span>
                </div>
              </div>
              <div className="p-6 flex flex-col md:flex-row md:items-center gap-6 flex-1">
                <div className="flex-1">
                  <span className="text-xs text-[#c8a96e] font-medium uppercase tracking-wider">{seminar.category}</span>
                  <h3 className="text-lg font-bold text-[#1a1a1a] mt-1">{seminar.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">Predavač: <strong>{seminar.instructor}</strong></p>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><MapPinIcon className="w-3.5 h-3.5 text-[#c8a96e]" /> {seminar.location}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[#c8a96e]" /> {seminar.time}</span>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-[#c8a96e]" /> Slobodnih mesta: {seminar.spots}/{seminar.totalSpots}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xl font-bold text-[#1a1a1a]">{seminar.price.toLocaleString("sr-RS")} RSD</span>
                  <button onClick={() => setShowRegistration(seminar.id)} className="bg-[#c8a96e] hover:bg-[#a8894e] text-white px-6 py-2.5 rounded font-medium text-sm transition-colors">Prijavite se</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Past seminars */}
        <div>
          <h2 className="text-2xl font-bold text-[#1a1a1a] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>Prosli Seminari</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {pastSeminars.map((s) => (
              <div key={s.title} className="bg-white rounded-lg shadow-sm overflow-hidden opacity-90 hover:opacity-100 transition-opacity">
                <div className="relative h-40 overflow-hidden">
                  <img src={s.image} alt={s.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute top-3 right-3 px-2 py-1 bg-white/80 backdrop-blur-sm text-[10px] font-semibold text-gray-600 rounded">Završen</span>
                  <h3 className="absolute bottom-3 left-3 right-3 font-semibold text-white text-sm">{s.title}</h3>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-500">Predavač: {s.instructor}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {s.date}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {s.attendees} učesnika</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      {showRegistration && selectedSeminar && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowRegistration(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 relative animate-scaleIn">
              <button onClick={() => setShowRegistration(null)} className="absolute top-4 right-4"><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
              <h3 className="text-xl font-bold text-[#1a1a1a] mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Prijava na Seminar</h3>
              <p className="text-sm text-[#c8a96e] mb-6">{selectedSeminar.title} - {selectedSeminar.date}</p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Ime</label><input type="text" className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Prezime</label><input type="text" className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm" /></div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label><input type="tel" className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Naziv salona (opciono)</label><input type="text" className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Napomena</label><textarea rows={2} className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm resize-none" /></div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-lg font-bold text-[#1a1a1a]">{selectedSeminar.price.toLocaleString("sr-RS")} RSD</span>
                  <button className="bg-[#c8a96e] hover:bg-[#a8894e] text-white px-6 py-3 rounded font-medium transition-colors">Potvrdite Prijavu</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
