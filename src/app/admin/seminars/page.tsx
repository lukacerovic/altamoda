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
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function SeminarsAdminPage() {
  const { t } = useLanguage();

  const mockSeminars = [
    { id: 1, title: "Napredne Tehnike Balayage", instructor: "Ana Marinković", date: "25.03.2026", time: "10:00 - 16:00", location: "Beograd, Hotel Metropol", capacity: 30, registered: 28, status: "active", price: 15000 },
    { id: 2, title: "Korekcija Boja - Masterclass", instructor: "Dr. Petar Simić", date: "02.04.2026", time: "09:00 - 15:00", location: "Novi Sad, Hotel Park", capacity: 25, registered: 12, status: "active", price: 12000 },
    { id: 3, title: "Schwarzkopf IGORA Prezentacija", instructor: "Stefan Nikolić", date: "10.04.2026", time: "11:00 - 14:00", location: "Online (Zoom)", capacity: 100, registered: 45, status: "active", price: 0 },
    { id: 4, title: "Kérastase Ritual Tretmani", instructor: "Maja Đorđević", date: "15.04.2026", time: "10:00 - 13:00", location: "Beograd, Salon Academy", capacity: 20, registered: 20, status: "full", price: 8000 },
    { id: 5, title: "Muško Šišanje - Moderne Tehnike", instructor: "Nikola Pavlović", date: "10.03.2026", time: "10:00 - 16:00", location: "Niš, Grand Hotel", capacity: 25, registered: 25, status: "completed", price: 10000 },
  ];

  const [seminars, setSeminars] = useState(mockSeminars);
  const [search, setSearch] = useState("");

  const filtered = seminars.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()));

  const statusBadge = (status: string) => {
    switch (status) {
      case "active": return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">{t("admin.active")}</span>;
      case "full": return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">{t("admin.full")}</span>;
      case "completed": return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">{t("admin.finished")}</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-black">{t("admin.seminars")}</h1>
          <p className="text-sm text-[#7A7F6A] mt-1">{seminars.length} {t("admin.totalSeminars")}</p>
        </div>
        <button className="btn-gold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 self-start">
          <Plus size={18} />
          {t("admin.newSeminar")}
        </button>
      </div>

      <div className="bg-white rounded-sm border border-stone-200 p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a5a995]" />
          <input
            type="text"
            placeholder={t("admin.searchSeminars")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-stone-100 border border-transparent rounded-lg text-sm focus:bg-white focus:border-black"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((seminar) => (
          <div key={seminar.id} className="bg-white rounded-sm border border-stone-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-black/10">
                  <GraduationCap size={20} className="text-secondary" />
                </div>
                {statusBadge(seminar.status)}
              </div>
              <h3 className="text-base font-semibold text-black mb-1">{seminar.title}</h3>
              <p className="text-sm text-[#7A7F6A] mb-4">{seminar.instructor}</p>

              <div className="space-y-2 text-sm text-[#7A7F6A]">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-[#a5a995]" />
                  {seminar.date}
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-[#a5a995]" />
                  {seminar.time}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-[#a5a995]" />
                  {seminar.location}
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-[#a5a995]" />
                  {seminar.registered}/{seminar.capacity} {t("admin.registered")}
                </div>
              </div>

              {/* Capacity bar */}
              <div className="mt-3 w-full h-1.5 bg-[#FFFBF4] rounded-full">
                <div
                  className={`h-full rounded-full ${seminar.registered >= seminar.capacity ? "bg-red-400" : "bg-black"}`}
                  style={{ width: `${(seminar.registered / seminar.capacity) * 100}%` }}
                />
              </div>

              <div className="mt-4 pt-4 border-t border-[#FFFBF4] flex items-center justify-between">
                <span className="text-sm font-semibold text-black">
                  {seminar.price === 0 ? t("admin.free") : `${seminar.price.toLocaleString()} RSD`}
                </span>
                <div className="flex items-center gap-1">
                  <button className="p-1.5 text-[#a5a995] hover:text-secondary hover:bg-black/10 rounded-lg transition-colors"><Edit3 size={15} /></button>
                  <button className="p-1.5 text-[#a5a995] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
