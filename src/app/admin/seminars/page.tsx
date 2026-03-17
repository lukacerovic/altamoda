"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  MapPin,
  Users,
  GraduationCap,
  Clock,
} from "lucide-react";

const mockSeminars = [
  { id: 1, title: "Napredne Tehnike Balayage", instructor: "Ana Marinković", date: "25.03.2026", time: "10:00 - 16:00", location: "Beograd, Hotel Metropol", capacity: 30, registered: 28, status: "active", price: 15000 },
  { id: 2, title: "Korekcija Boja - Masterclass", instructor: "Dr. Petar Simić", date: "02.04.2026", time: "09:00 - 15:00", location: "Novi Sad, Hotel Park", capacity: 25, registered: 12, status: "active", price: 12000 },
  { id: 3, title: "Schwarzkopf IGORA Prezentacija", instructor: "Stefan Nikolić", date: "10.04.2026", time: "11:00 - 14:00", location: "Online (Zoom)", capacity: 100, registered: 45, status: "active", price: 0 },
  { id: 4, title: "Kérastase Ritual Tretmani", instructor: "Maja Đorđević", date: "15.04.2026", time: "10:00 - 13:00", location: "Beograd, Salon Academy", capacity: 20, registered: 20, status: "full", price: 8000 },
  { id: 5, title: "Muško Šišanje - Moderne Tehnike", instructor: "Nikola Pavlović", date: "10.03.2026", time: "10:00 - 16:00", location: "Niš, Grand Hotel", capacity: 25, registered: 25, status: "completed", price: 10000 },
];

export default function SeminarsAdminPage() {
  const [seminars, setSeminars] = useState(mockSeminars);
  const [search, setSearch] = useState("");

  const filtered = seminars.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()));

  const statusBadge = (status: string) => {
    switch (status) {
      case "active": return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Aktivan</span>;
      case "full": return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Popunjeno</span>;
      case "completed": return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Završen</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#1a1a1a]">Seminari</h1>
          <p className="text-sm text-[#666] mt-1">{seminars.length} seminara ukupno</p>
        </div>
        <button className="btn-gold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 self-start">
          <Plus size={18} />
          Novi Seminar
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#e5e5e5] p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
          <input
            type="text"
            placeholder="Pretraži seminare..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#f5f5f5] border border-transparent rounded-lg text-sm focus:bg-white focus:border-[#c8a96e]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((seminar) => (
          <div key={seminar.id} className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-[#c8a96e]/10">
                  <GraduationCap size={20} className="text-[#c8a96e]" />
                </div>
                {statusBadge(seminar.status)}
              </div>
              <h3 className="text-base font-semibold text-[#1a1a1a] mb-1">{seminar.title}</h3>
              <p className="text-sm text-[#666] mb-4">{seminar.instructor}</p>

              <div className="space-y-2 text-sm text-[#666]">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-[#999]" />
                  {seminar.date}
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-[#999]" />
                  {seminar.time}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-[#999]" />
                  {seminar.location}
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-[#999]" />
                  {seminar.registered}/{seminar.capacity} prijavljenih
                </div>
              </div>

              {/* Capacity bar */}
              <div className="mt-3 w-full h-1.5 bg-[#f0f0f0] rounded-full">
                <div
                  className={`h-full rounded-full ${seminar.registered >= seminar.capacity ? "bg-red-400" : "bg-[#c8a96e]"}`}
                  style={{ width: `${(seminar.registered / seminar.capacity) * 100}%` }}
                />
              </div>

              <div className="mt-4 pt-4 border-t border-[#f0f0f0] flex items-center justify-between">
                <span className="text-sm font-semibold text-[#1a1a1a]">
                  {seminar.price === 0 ? "Besplatno" : `${seminar.price.toLocaleString()} RSD`}
                </span>
                <div className="flex items-center gap-1">
                  <button className="p-1.5 text-[#999] hover:text-[#c8a96e] hover:bg-[#c8a96e]/10 rounded-lg transition-colors"><Edit3 size={15} /></button>
                  <button className="p-1.5 text-[#999] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
