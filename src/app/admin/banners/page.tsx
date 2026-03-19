"use client";

import { useState } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  X,
  Image,
  ChevronUp,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  Eye,
  Monitor,
  Smartphone,
  Calendar,
  ExternalLink,
} from "lucide-react";

interface Banner {
  id: number;
  title: string;
  type: "Banner" | "Pop-up" | "Landing page hero";
  position: "Home page hero" | "Home page mid" | "Category page" | "B2B section";
  desktopImage: string;
  mobileImage: string;
  linkType: "Kategorija" | "Brend" | "Proizvod" | "Spoljašnji link";
  linkUrl: string;
  ctaText: string;
  target: "Svi" | "B2B" | "B2C";
  activeFrom: string;
  activeTo: string;
  displayOrder: number;
  status: "active" | "inactive";
}

const initialBanners: Banner[] = [
  {
    id: 1, title: "Prolećna akcija - do 30% popusta", type: "Banner", position: "Home page hero",
    desktopImage: "/banners/spring-desktop.jpg", mobileImage: "/banners/spring-mobile.jpg",
    linkType: "Kategorija", linkUrl: "/products?category=nega-kose", ctaText: "Pogledaj ponudu",
    target: "Svi", activeFrom: "2026-03-01", activeTo: "2026-04-30", displayOrder: 1, status: "active",
  },
  {
    id: 2, title: "Novi Kérastase proizvodi", type: "Banner", position: "Home page mid",
    desktopImage: "/banners/kerastase-desktop.jpg", mobileImage: "/banners/kerastase-mobile.jpg",
    linkType: "Brend", linkUrl: "/products?brand=kerastase", ctaText: "Otkrijte novitete",
    target: "Svi", activeFrom: "2026-02-15", activeTo: "2026-05-15", displayOrder: 2, status: "active",
  },
  {
    id: 3, title: "B2B - Posebne cene za salone", type: "Banner", position: "B2B section",
    desktopImage: "/banners/b2b-desktop.jpg", mobileImage: "/banners/b2b-mobile.jpg",
    linkType: "Kategorija", linkUrl: "/products?segment=b2b", ctaText: "Registrujte salon",
    target: "B2B", activeFrom: "2026-01-01", activeTo: "2026-12-31", displayOrder: 1, status: "active",
  },
  {
    id: 4, title: "Besplatna dostava preko 5000 RSD", type: "Pop-up", position: "Home page hero",
    desktopImage: "/banners/shipping-desktop.jpg", mobileImage: "/banners/shipping-mobile.jpg",
    linkType: "Spoljašnji link", linkUrl: "/faq#dostava", ctaText: "Saznaj više",
    target: "B2C", activeFrom: "2026-03-01", activeTo: "2026-06-30", displayOrder: 3, status: "active",
  },
  {
    id: 5, title: "Seminar - Balayage tehnike", type: "Landing page hero", position: "Category page",
    desktopImage: "/banners/seminar-desktop.jpg", mobileImage: "/banners/seminar-mobile.jpg",
    linkType: "Spoljašnji link", linkUrl: "/seminars/1", ctaText: "Prijavite se",
    target: "B2B", activeFrom: "2026-04-01", activeTo: "2026-04-15", displayOrder: 4, status: "inactive",
  },
  {
    id: 6, title: "Moroccanoil - Letnja kolekcija", type: "Banner", position: "Category page",
    desktopImage: "/banners/moroccanoil-desktop.jpg", mobileImage: "/banners/moroccanoil-mobile.jpg",
    linkType: "Proizvod", linkUrl: "/products/moroccanoil-treatment", ctaText: "Kupite sada",
    target: "Svi", activeFrom: "2026-06-01", activeTo: "2026-09-01", displayOrder: 5, status: "inactive",
  },
];

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>(initialBanners);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  const [form, setForm] = useState({
    title: "",
    type: "Banner" as Banner["type"],
    position: "Home page hero" as Banner["position"],
    desktopImage: "",
    mobileImage: "",
    linkType: "Kategorija" as Banner["linkType"],
    linkUrl: "",
    ctaText: "",
    target: "Svi" as Banner["target"],
    activeFrom: "",
    activeTo: "",
    displayOrder: "",
  });

  const openCreate = () => {
    setEditingBanner(null);
    setForm({ title: "", type: "Banner", position: "Home page hero", desktopImage: "", mobileImage: "", linkType: "Kategorija", linkUrl: "", ctaText: "", target: "Svi", activeFrom: "", activeTo: "", displayOrder: "" });
    setShowModal(true);
  };

  const openEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setForm({
      title: banner.title, type: banner.type, position: banner.position,
      desktopImage: banner.desktopImage, mobileImage: banner.mobileImage,
      linkType: banner.linkType, linkUrl: banner.linkUrl, ctaText: banner.ctaText,
      target: banner.target, activeFrom: banner.activeFrom, activeTo: banner.activeTo,
      displayOrder: String(banner.displayOrder),
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingBanner) {
      setBanners(banners.map((b) => b.id === editingBanner.id ? { ...b, ...form, displayOrder: Number(form.displayOrder) } : b));
    } else {
      const newBanner: Banner = {
        id: Math.max(...banners.map((b) => b.id)) + 1,
        ...form,
        displayOrder: Number(form.displayOrder) || banners.length + 1,
        status: "inactive",
      };
      setBanners([...banners, newBanner]);
    }
    setShowModal(false);
  };

  const toggleStatus = (id: number) => {
    setBanners(banners.map((b) => b.id === id ? { ...b, status: b.status === "active" ? "inactive" : "active" } : b));
  };

  const moveOrder = (id: number, direction: "up" | "down") => {
    const sorted = [...banners].sort((a, b) => a.displayOrder - b.displayOrder);
    const idx = sorted.findIndex((b) => b.id === id);
    if (direction === "up" && idx > 0) {
      const temp = sorted[idx].displayOrder;
      sorted[idx].displayOrder = sorted[idx - 1].displayOrder;
      sorted[idx - 1].displayOrder = temp;
    } else if (direction === "down" && idx < sorted.length - 1) {
      const temp = sorted[idx].displayOrder;
      sorted[idx].displayOrder = sorted[idx + 1].displayOrder;
      sorted[idx + 1].displayOrder = temp;
    }
    setBanners([...sorted]);
  };

  const deleteBanner = (id: number) => {
    setBanners(banners.filter((b) => b.id !== id));
  };

  const typeBadge = (type: string) => {
    const styles: Record<string, string> = {
      "Banner": "bg-purple-100 text-purple-700",
      "Pop-up": "bg-orange-100 text-orange-700",
      "Landing page hero": "bg-cyan-100 text-cyan-700",
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[type] || "bg-gray-100 text-gray-700"}`}>{type}</span>;
  };

  const sorted = [...banners].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#2d2d2d]">Baneri</h1>
          <p className="text-[#666] mt-1">Upravljajte banerima, pop-up-ovima i hero sekcijama</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 bg-[#8c4a5a] text-white px-5 py-2.5 rounded-lg hover:bg-[#b8994e] transition-colors font-medium text-sm">
          <Plus size={18} />
          Novi baner
        </button>
      </div>

      {/* Banner Cards */}
      <div className="space-y-4">
        {sorted.map((banner) => (
          <div key={banner.id} className="bg-white rounded-xl border border-[#e0d8cc] overflow-hidden hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row">
              {/* Preview */}
              <div className="w-full md:w-56 h-32 md:h-auto bg-gradient-to-br from-[#8c4a5a]/20 to-[#8c4a5a]/5 flex items-center justify-center flex-shrink-0 relative">
                <Image size={32} className="text-[#8c4a5a]/40" />
                <div className="absolute bottom-2 left-2 flex gap-1">
                  <span className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Monitor size={10} /> Desktop
                  </span>
                  <span className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Smartphone size={10} /> Mobile
                  </span>
                </div>
              </div>
              {/* Details */}
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-[#2d2d2d] mb-2">{banner.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {typeBadge(banner.type)}
                      <span className="text-xs bg-[#f5f0e8] text-[#666] px-2 py-0.5 rounded">{banner.position}</span>
                      <span className="text-xs bg-[#f5f0e8] text-[#666] px-2 py-0.5 rounded">{banner.target}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${banner.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {banner.status === "active" ? "Aktivan" : "Neaktivan"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#999]">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {banner.activeFrom} - {banner.activeTo}</span>
                      <span className="flex items-center gap-1"><ExternalLink size={12} /> {banner.ctaText}</span>
                      <span>Redosled: {banner.displayOrder}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <div className="flex flex-col">
                      <button onClick={() => moveOrder(banner.id, "up")} className="p-1 hover:bg-[#f5f0e8] rounded transition-colors">
                        <ChevronUp size={14} className="text-[#666]" />
                      </button>
                      <button onClick={() => moveOrder(banner.id, "down")} className="p-1 hover:bg-[#f5f0e8] rounded transition-colors">
                        <ChevronDown size={14} className="text-[#666]" />
                      </button>
                    </div>
                    <button onClick={() => toggleStatus(banner.id)} className="p-1.5 hover:bg-[#f5f0e8] rounded-lg transition-colors">
                      {banner.status === "active" ? <ToggleRight size={22} className="text-green-600" /> : <ToggleLeft size={22} className="text-[#999]" />}
                    </button>
                    <button onClick={() => openEdit(banner)} className="p-1.5 hover:bg-[#f5f0e8] rounded-lg transition-colors">
                      <Edit3 size={16} className="text-[#666]" />
                    </button>
                    <button onClick={() => deleteBanner(banner.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-[#e0d8cc]">
              <h2 className="font-serif text-xl font-bold text-[#2d2d2d]">{editingBanner ? "Izmeni baner" : "Novi baner"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-[#f5f0e8] rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#333] mb-1">Naslov</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1">Tip</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Banner["type"] })} className="w-full px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none">
                    <option value="Banner">Banner</option>
                    <option value="Pop-up">Pop-up</option>
                    <option value="Landing page hero">Landing page hero</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1">Pozicija</label>
                  <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value as Banner["position"] })} className="w-full px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none">
                    <option value="Home page hero">Home page hero</option>
                    <option value="Home page mid">Home page mid</option>
                    <option value="Category page">Category page</option>
                    <option value="B2B section">B2B section</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1">Desktop slika URL</label>
                  <input type="text" value={form.desktopImage} onChange={(e) => setForm({ ...form, desktopImage: e.target.value })} className="w-full px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none" placeholder="/banners/desktop.jpg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1">Mobile slika URL</label>
                  <input type="text" value={form.mobileImage} onChange={(e) => setForm({ ...form, mobileImage: e.target.value })} className="w-full px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none" placeholder="/banners/mobile.jpg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1">Link ka</label>
                  <select value={form.linkType} onChange={(e) => setForm({ ...form, linkType: e.target.value as Banner["linkType"] })} className="w-full px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none">
                    <option value="Kategorija">Kategorija</option>
                    <option value="Brend">Brend</option>
                    <option value="Proizvod">Proizvod</option>
                    <option value="Spoljašnji link">Spoljašnji link</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1">URL</label>
                  <input type="text" value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} className="w-full px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1">CTA tekst</label>
                  <input type="text" value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} className="w-full px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none" placeholder="Pogledaj ponudu" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1">Ciljna grupa</label>
                  <select value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value as Banner["target"] })} className="w-full px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none">
                    <option value="Svi">Svi</option>
                    <option value="B2B">B2B</option>
                    <option value="B2C">B2C</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1">Aktivno od</label>
                  <input type="date" value={form.activeFrom} onChange={(e) => setForm({ ...form, activeFrom: e.target.value })} className="w-full px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1">Aktivno do</label>
                  <input type="date" value={form.activeTo} onChange={(e) => setForm({ ...form, activeTo: e.target.value })} className="w-full px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1">Redosled prikaza</label>
                  <input type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: e.target.value })} className="w-full px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-[#e0d8cc]">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 border border-[#e0d8cc] rounded-lg text-sm font-medium hover:bg-[#f5f0e8] transition-colors">Otkaži</button>
              <button onClick={handleSave} className="px-5 py-2.5 bg-[#8c4a5a] text-white rounded-lg text-sm font-medium hover:bg-[#b8994e] transition-colors">
                {editingBanner ? "Sačuvaj izmene" : "Kreiraj baner"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
