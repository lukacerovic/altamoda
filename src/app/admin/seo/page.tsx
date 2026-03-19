"use client";

import { useState } from "react";
import {
  Search,
  Globe,
  Edit3,
  Save,
  X,
  Eye,
  FileText,
  Tag,
  Image,
  RefreshCw,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

type Tab = "products" | "categories" | "blog" | "global";

interface SeoItem {
  id: number;
  name: string;
  seoTitle: string;
  metaDescription: string;
  slug: string;
  imageAlts: string;
}

const productsSeo: SeoItem[] = [
  { id: 1, name: "Serie Expert Gold Quinoa", seoTitle: "Serie Expert Gold Quinoa Šampon | Alta Moda", metaDescription: "Profesionalni šampon za oštećenu kosu sa zlatnim quinoa kompleksom. Kupite online sa brzom dostavom.", slug: "serie-expert-gold-quinoa", imageAlts: "Serie Expert Gold Quinoa šampon za oštećenu kosu" },
  { id: 2, name: "BC Bonacure Peptide Repair", seoTitle: "BC Bonacure Peptide Repair Šampon | Alta Moda", metaDescription: "Schwarzkopf BC Bonacure Peptide Repair za dubinsku regeneraciju kose. Pogledajte cenu i dostupnost.", slug: "bc-bonacure-peptide-repair", imageAlts: "BC Bonacure Peptide Repair regenerativni šampon" },
  { id: 3, name: "Elixir Ultime Serum", seoTitle: "Kérastase Elixir Ultime Serum | Alta Moda", metaDescription: "Luksuzno ulje za sjaj kose Kérastase Elixir Ultime. Profesionalna nega dostupna za online porudžbinu.", slug: "kerastase-elixir-ultime-serum", imageAlts: "Kerastase Elixir Ultime serum za sjaj kose" },
  { id: 4, name: "Oil Reflections Šampon", seoTitle: "Wella Oil Reflections Šampon | Alta Moda", metaDescription: "Wella Professionals Oil Reflections šampon za blistavu kosu. Dostupan u Alta Moda online prodavnici.", slug: "wella-oil-reflections-sampon", imageAlts: "Wella Oil Reflections šampon za sjaj" },
  { id: 5, name: "Moroccanoil Treatment 100ml", seoTitle: "Moroccanoil Treatment Original 100ml | Alta Moda", metaDescription: "Originalni Moroccanoil tretman za sve tipove kose. Naručite uz besplatnu dostavu preko 5000 RSD.", slug: "moroccanoil-treatment-100ml", imageAlts: "Moroccanoil Treatment originalno ulje za kosu 100ml" },
];

const categoriesSeo: SeoItem[] = [
  { id: 1, name: "Nega kose", seoTitle: "Nega Kose - Šamponi, Maske i Balzami | Alta Moda", metaDescription: "Profesionalni proizvodi za negu kose - šamponi, maske, balzami. L'Oreal, Schwarzkopf, Kerastase.", slug: "nega-kose", imageAlts: "Proizvodi za negu kose" },
  { id: 2, name: "Boje za kosu", seoTitle: "Profesionalne Boje za Kosu | Alta Moda", metaDescription: "Širok izbor profesionalnih boja za kosu. Igora Royal, Majirel, Koleston. Za salone i kućnu upotrebu.", slug: "boje-za-kosu", imageAlts: "Profesionalne boje za kosu" },
  { id: 3, name: "Styling", seoTitle: "Styling Proizvodi za Kosu | Alta Moda", metaDescription: "Profesionalni styling proizvodi - gelovi, pene, lakovi, puderi. Oblikujte kosu kao u salonu.", slug: "styling", imageAlts: "Styling proizvodi za oblikovanje kose" },
];

const blogSeo: SeoItem[] = [
  { id: 1, name: "5 saveta za negu farbane kose", seoTitle: "5 Saveta za Negu Farbane Kose | Alta Moda Blog", metaDescription: "Kako održavati farbu i zdravlje kose? Profesionalni saveti za dugotrajnu boju i sjaj.", slug: "5-saveta-nega-farbane-kose", imageAlts: "Nega farbane kose saveti" },
  { id: 2, name: "Trend frizure za 2026. godinu", seoTitle: "Trend Frizure 2026 - Top Stilovi i Boje | Alta Moda Blog", metaDescription: "Otkrijte najaktuelnije frizure i boje za 2026. godinu. Inspiracija za vaš sledeći posetu salonu.", slug: "trend-frizure-2026", imageAlts: "Trend frizure 2026 godine" },
];

export default function SeoPage() {
  const [activeTab, setActiveTab] = useState<Tab>("products");
  const [editingItem, setEditingItem] = useState<SeoItem | null>(null);
  const [search, setSearch] = useState("");

  const [editForm, setEditForm] = useState({
    seoTitle: "",
    metaDescription: "",
    slug: "",
    imageAlts: "",
  });

  const [globalSettings, setGlobalSettings] = useState({
    titleTemplate: "{Product Name} | Alta Moda",
    metaTemplate: "Kupite {Product Name} online u Alta Moda prodavnici. Brza dostava, profesionalni proizvodi za kosu.",
    robotsTxt: "User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /cart/\nDisallow: /account/\nSitemap: https://altamoda.rs/sitemap.xml",
    gaId: "G-XXXXXXXXXX",
    fbPixelId: "1234567890",
    gtmId: "GTM-XXXXXXX",
  });

  const tabs: { id: Tab; label: string }[] = [
    { id: "products", label: "Proizvodi" },
    { id: "categories", label: "Kategorije" },
    { id: "blog", label: "Blog" },
    { id: "global", label: "Globalno" },
  ];

  const getItems = (): SeoItem[] => {
    if (activeTab === "products") return productsSeo;
    if (activeTab === "categories") return categoriesSeo;
    if (activeTab === "blog") return blogSeo;
    return [];
  };

  const items = getItems().filter((item) =>
    !search || item.name.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (item: SeoItem) => {
    setEditingItem(item);
    setEditForm({
      seoTitle: item.seoTitle,
      metaDescription: item.metaDescription,
      slug: item.slug,
      imageAlts: item.imageAlts,
    });
  };

  const closeEdit = () => {
    setEditingItem(null);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#2d2d2d]">SEO</h1>
          <p className="text-[#666] mt-1">Upravljajte SEO podešavanjima za bolju vidljivost</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#f5f0e8] rounded-lg p-1 mb-6 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setEditingItem(null); setSearch(""); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id ? "bg-white text-[#2d2d2d] shadow-sm" : "text-[#666] hover:text-[#333]"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Items list */}
      {activeTab !== "global" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-[#e0d8cc] overflow-hidden">
              <div className="p-3 border-b border-[#e0d8cc]">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
                  <input type="text" placeholder="Pretraži..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none" />
                </div>
              </div>
              <div className="divide-y divide-[#f5f0e8]">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => openEdit(item)}
                    className={`w-full text-left px-4 py-3 hover:bg-[#f5f0e8] transition-colors flex items-center justify-between ${editingItem?.id === item.id ? "bg-[#8c4a5a]/5 border-l-2 border-[#8c4a5a]" : ""}`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#2d2d2d] truncate">{item.name}</p>
                      <p className="text-xs text-[#999] truncate">/{item.slug}</p>
                    </div>
                    <ChevronRight size={16} className="text-[#ccc] flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Editor */}
          <div className="lg:col-span-2">
            {editingItem ? (
              <div className="bg-white rounded-xl border border-[#e0d8cc] overflow-hidden">
                <div className="p-4 border-b border-[#e0d8cc] flex items-center justify-between">
                  <h3 className="font-semibold text-[#2d2d2d]">{editingItem.name}</h3>
                  <button onClick={closeEdit} className="p-1 hover:bg-[#f5f0e8] rounded-lg">
                    <X size={18} className="text-[#666]" />
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  {/* SEO Title */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium text-[#333]">SEO Naslov</label>
                      <span className={`text-xs ${editForm.seoTitle.length > 60 ? "text-red-500" : "text-[#999]"}`}>
                        {editForm.seoTitle.length}/60
                      </span>
                    </div>
                    <input
                      type="text"
                      value={editForm.seoTitle}
                      onChange={(e) => setEditForm({ ...editForm, seoTitle: e.target.value })}
                      className="w-full px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none"
                    />
                  </div>

                  {/* Meta Description */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium text-[#333]">Meta Opis</label>
                      <span className={`text-xs ${editForm.metaDescription.length > 160 ? "text-red-500" : "text-[#999]"}`}>
                        {editForm.metaDescription.length}/160
                      </span>
                    </div>
                    <textarea
                      value={editForm.metaDescription}
                      onChange={(e) => setEditForm({ ...editForm, metaDescription: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none resize-none"
                    />
                  </div>

                  {/* URL Slug */}
                  <div>
                    <label className="block text-sm font-medium text-[#333] mb-1">URL Slug</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[#999]">altamoda.rs/</span>
                      <input
                        type="text"
                        value={editForm.slug}
                        onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                        className="flex-1 px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Image Alt Tags */}
                  <div>
                    <label className="block text-sm font-medium text-[#333] mb-1">Alt tagovi za slike</label>
                    <input
                      type="text"
                      value={editForm.imageAlts}
                      onChange={(e) => setEditForm({ ...editForm, imageAlts: e.target.value })}
                      className="w-full px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none"
                    />
                  </div>

                  {/* Google Preview */}
                  <div>
                    <label className="block text-sm font-medium text-[#333] mb-2">Google pregled</label>
                    <div className="border border-[#e0d8cc] rounded-lg p-4 bg-[#f5f0e8]">
                      <p className="text-lg text-[#1a0dab] hover:underline cursor-pointer truncate">{editForm.seoTitle || "Naslov stranice"}</p>
                      <p className="text-sm text-[#006621] mt-0.5">altamoda.rs/{editForm.slug}</p>
                      <p className="text-sm text-[#545454] mt-1 line-clamp-2">{editForm.metaDescription || "Meta opis stranice..."}</p>
                    </div>
                  </div>

                  {/* Save */}
                  <div className="flex justify-end pt-2">
                    <button className="inline-flex items-center gap-2 bg-[#8c4a5a] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#b8994e] transition-colors">
                      <Save size={16} />
                      Sačuvaj SEO
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[#e0d8cc] p-10 text-center">
                <Globe size={48} className="mx-auto text-[#8c4a5a]/30 mb-3" />
                <p className="text-[#666]">Izaberite stavku sa leve strane za uređivanje SEO podešavanja</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Global Tab */}
      {activeTab === "global" && (
        <div className="space-y-6">
          {/* Templates */}
          <div className="bg-white rounded-xl border border-[#e0d8cc] p-5">
            <h3 className="font-semibold text-[#2d2d2d] mb-4">Šabloni</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#333] mb-1">Podrazumevani šablon naslova</label>
                <input type="text" value={globalSettings.titleTemplate} onChange={(e) => setGlobalSettings({ ...globalSettings, titleTemplate: e.target.value })} className="w-full px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none font-mono" />
                <p className="text-xs text-[#999] mt-1">Koristite {"{Product Name}"} kao placeholder</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333] mb-1">Podrazumevani šablon meta opisa</label>
                <textarea value={globalSettings.metaTemplate} onChange={(e) => setGlobalSettings({ ...globalSettings, metaTemplate: e.target.value })} rows={2} className="w-full px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none resize-none font-mono" />
              </div>
            </div>
          </div>

          {/* Robots.txt */}
          <div className="bg-white rounded-xl border border-[#e0d8cc] p-5">
            <h3 className="font-semibold text-[#2d2d2d] mb-4">Robots.txt</h3>
            <textarea
              value={globalSettings.robotsTxt}
              onChange={(e) => setGlobalSettings({ ...globalSettings, robotsTxt: e.target.value })}
              rows={6}
              className="w-full px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none resize-none font-mono"
            />
          </div>

          {/* Sitemap */}
          <div className="bg-white rounded-xl border border-[#e0d8cc] p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#2d2d2d]">Sitemap</h3>
                <p className="text-sm text-[#666] mt-1">Poslednje generisano: 2026-03-15 08:00</p>
              </div>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#f5f0e8] border border-[#e0d8cc] rounded-lg text-sm font-medium hover:bg-[#eee] transition-colors">
                <RefreshCw size={16} />
                Generiši sitemap
              </button>
            </div>
          </div>

          {/* Tracking IDs */}
          <div className="bg-white rounded-xl border border-[#e0d8cc] p-5">
            <h3 className="font-semibold text-[#2d2d2d] mb-4">Praćenje i analitika</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#333] mb-1">Google Analytics ID</label>
                <input type="text" value={globalSettings.gaId} onChange={(e) => setGlobalSettings({ ...globalSettings, gaId: e.target.value })} className="w-full px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none font-mono" placeholder="G-XXXXXXXXXX" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333] mb-1">Facebook Pixel ID</label>
                <input type="text" value={globalSettings.fbPixelId} onChange={(e) => setGlobalSettings({ ...globalSettings, fbPixelId: e.target.value })} className="w-full px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none font-mono" placeholder="1234567890" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333] mb-1">Google Tag Manager ID</label>
                <input type="text" value={globalSettings.gtmId} onChange={(e) => setGlobalSettings({ ...globalSettings, gtmId: e.target.value })} className="w-full px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none font-mono" placeholder="GTM-XXXXXXX" />
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button className="inline-flex items-center gap-2 bg-[#8c4a5a] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#b8994e] transition-colors">
              <Save size={16} />
              Sačuvaj globalna podešavanja
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
