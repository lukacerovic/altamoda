"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function BlogAdminPage() {
  const { t } = useLanguage();

  const mockPosts = [
    { id: 1, title: "Top 10 Trendova u Bojenju Kose za 2026.", author: "Ana M.", date: "15.03.2026", status: "published", views: 1245, category: "Trendovi" },
    { id: 2, title: "Kako Pravilno Negovati Farbanu Kosu", author: "Jelena S.", date: "12.03.2026", status: "published", views: 892, category: "Saveti" },
    { id: 3, title: "Schwarzkopf vs L'Oréal: Uporedni Test Boja", author: "Marko D.", date: "10.03.2026", status: "draft", views: 0, category: "Recenzije" },
    { id: 4, title: "5 Grešaka koje Frizeri Prave pri Posvetljivanju", author: "Ana M.", date: "08.03.2026", status: "published", views: 2340, category: "Profesionalni saveti" },
    { id: 5, title: "Vodič za Odabir Pravog Šampona", author: "Jelena S.", date: "05.03.2026", status: "published", views: 675, category: "Saveti" },
    { id: 6, title: "Intervju: Slavni Frizer o Tajnama Uspeha", author: "Marko D.", date: "01.03.2026", status: "draft", views: 0, category: "Intervjui" },
  ];

  const [posts, setPosts] = useState(mockPosts);
  const [search, setSearch] = useState("");

  const filtered = posts.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#2d2d2d]">{t("admin.blog")}</h1>
          <p className="text-sm text-[#666] mt-1">{posts.length} {t("admin.totalPosts")}</p>
        </div>
        <button className="btn-gold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 self-start">
          <Plus size={18} />
          {t("admin.newPost")}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#e0d8cc] p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
          <input
            type="text"
            placeholder={t("admin.searchPosts")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#f5f0e8] border border-transparent rounded-lg text-sm focus:bg-white focus:border-[#8c4a5a]"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e0d8cc] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f5f0e8] border-b border-[#e0d8cc]">
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">{t("admin.title")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden md:table-cell">{t("admin.author")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden md:table-cell">{t("admin.category")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden sm:table-cell">{t("admin.date")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">{t("admin.status")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden sm:table-cell">{t("admin.views")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">{t("admin.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {filtered.map((post) => (
                <tr key={post.id} className="hover:bg-[#f5f0e8] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#f5f0e8] flex items-center justify-center flex-shrink-0">
                        <FileText size={18} className="text-[#999]" />
                      </div>
                      <span className="text-sm font-medium text-[#2d2d2d] line-clamp-1">{post.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#666] hidden md:table-cell">{post.author}</td>
                  <td className="px-6 py-4 text-sm text-[#666] hidden md:table-cell">{post.category}</td>
                  <td className="px-6 py-4 text-sm text-[#666] hidden sm:table-cell">{post.date}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${post.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {post.status === "published" ? t("admin.published") : t("admin.draft")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#666] hidden sm:table-cell">{post.views.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 text-[#999] hover:text-[#8c4a5a] hover:bg-[#8c4a5a]/10 rounded-lg transition-colors"><Edit3 size={15} /></button>
                      <button className="p-1.5 text-[#999] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
