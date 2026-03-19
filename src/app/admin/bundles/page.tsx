"use client";

import { useState } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  Copy,
  X,
  Search,
  Package,
  Check,
  Calendar,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface BundleProduct {
  id: number;
  name: string;
  price: number;
  selected: boolean;
}

interface Bundle {
  id: number;
  name: string;
  description: string;
  products: { name: string; price: number }[];
  bundlePrice: number;
  status: "active" | "scheduled" | "expired";
  validFrom: string;
  validTo: string;
  target: "Svi" | "B2B" | "B2C";
  image: string;
  canBuyIndividually: boolean;
  mixSalonRetail: boolean;
}

const allProducts: BundleProduct[] = [
  { id: 1, name: "Serie Expert Gold Quinoa Šampon", price: 2500, selected: false },
  { id: 2, name: "Serie Expert Gold Quinoa Maska", price: 2800, selected: false },
  { id: 3, name: "BC Bonacure Peptide Repair Šampon", price: 1800, selected: false },
  { id: 4, name: "BC Bonacure Peptide Repair Maska", price: 2100, selected: false },
  { id: 5, name: "Elixir Ultime Serum", price: 4200, selected: false },
  { id: 6, name: "Oil Reflections Šampon", price: 1950, selected: false },
  { id: 7, name: "Moroccanoil Treatment 100ml", price: 3500, selected: false },
  { id: 8, name: "Igora Royal 60ml - 7.0", price: 850, selected: false },
  { id: 9, name: "OSIS+ Dust It", price: 1200, selected: false },
  { id: 10, name: "Mythic Oil Huile", price: 2800, selected: false },
];

const initialBundles: Bundle[] = [
  {
    id: 1,
    name: "Gold Quinoa Komplet",
    description: "Šampon + maska za oštećenu kosu sa zlatnim quinoa kompleksom",
    products: [{ name: "Serie Expert Gold Quinoa Šampon", price: 2500 }, { name: "Serie Expert Gold Quinoa Maska", price: 2800 }],
    bundlePrice: 4200,
    status: "active",
    validFrom: "2026-01-01",
    validTo: "2026-06-30",
    target: "Svi",
    image: "/bundles/gold-quinoa.jpg",
    canBuyIndividually: true,
    mixSalonRetail: false,
  },
  {
    id: 2,
    name: "Peptide Repair Set",
    description: "Kompletna nega za oštećenu kosu - šampon, maska i serum",
    products: [{ name: "BC Bonacure Peptide Repair Šampon", price: 1800 }, { name: "BC Bonacure Peptide Repair Maska", price: 2100 }, { name: "Elixir Ultime Serum", price: 4200 }],
    bundlePrice: 6400,
    status: "active",
    validFrom: "2026-02-01",
    validTo: "2026-07-31",
    target: "B2C",
    image: "/bundles/peptide-repair.jpg",
    canBuyIndividually: true,
    mixSalonRetail: false,
  },
  {
    id: 3,
    name: "Salon Starter Paket",
    description: "Sve što vam treba za start salona - boje, nega i styling",
    products: [{ name: "Igora Royal 60ml - 7.0", price: 850 }, { name: "Oil Reflections Šampon", price: 1950 }, { name: "OSIS+ Dust It", price: 1200 }, { name: "Moroccanoil Treatment 100ml", price: 3500 }],
    bundlePrice: 5900,
    status: "active",
    validFrom: "2026-01-15",
    validTo: "2026-12-31",
    target: "B2B",
    image: "/bundles/salon-starter.jpg",
    canBuyIndividually: false,
    mixSalonRetail: true,
  },
  {
    id: 4,
    name: "Letnji Sjaj Paket",
    description: "Savršena kombinacija za letnju negu i zaštitu kose",
    products: [{ name: "Moroccanoil Treatment 100ml", price: 3500 }, { name: "Mythic Oil Huile", price: 2800 }],
    bundlePrice: 4990,
    status: "scheduled",
    validFrom: "2026-06-01",
    validTo: "2026-09-01",
    target: "Svi",
    image: "/bundles/summer-shine.jpg",
    canBuyIndividually: true,
    mixSalonRetail: false,
  },
  {
    id: 5,
    name: "Black Friday Mega Set",
    description: "Ekskluzivni set sa najvećim uštedama",
    products: [{ name: "Serie Expert Gold Quinoa Šampon", price: 2500 }, { name: "Elixir Ultime Serum", price: 4200 }, { name: "Moroccanoil Treatment 100ml", price: 3500 }, { name: "Mythic Oil Huile", price: 2800 }],
    bundlePrice: 8900,
    status: "expired",
    validFrom: "2025-11-25",
    validTo: "2025-11-29",
    target: "Svi",
    image: "/bundles/black-friday.jpg",
    canBuyIndividually: true,
    mixSalonRetail: false,
  },
];

export default function BundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>(initialBundles);
  const [showModal, setShowModal] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<BundleProduct[]>([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    bundlePrice: "",
    savingsPercent: "",
    validFrom: "",
    validTo: "",
    target: "Svi" as "Svi" | "B2B" | "B2C",
    canBuyIndividually: true,
    mixSalonRetail: false,
  });

  const totalOriginal = selectedProducts.reduce((sum, p) => sum + p.price, 0);

  const handlePriceChange = (val: string) => {
    const price = Number(val);
    const savings = totalOriginal > 0 ? Math.round(((totalOriginal - price) / totalOriginal) * 100) : 0;
    setForm({ ...form, bundlePrice: val, savingsPercent: savings > 0 ? String(savings) : "" });
  };

  const handleSavingsChange = (val: string) => {
    const pct = Number(val);
    const price = totalOriginal > 0 ? Math.round(totalOriginal * (1 - pct / 100)) : 0;
    setForm({ ...form, savingsPercent: val, bundlePrice: price > 0 ? String(price) : "" });
  };

  const toggleProduct = (product: BundleProduct) => {
    if (selectedProducts.find((p) => p.id === product.id)) {
      setSelectedProducts(selectedProducts.filter((p) => p.id !== product.id));
    } else {
      setSelectedProducts([...selectedProducts, product]);
    }
  };

  const handleCreate = () => {
    const newBundle: Bundle = {
      id: Math.max(...bundles.map((b) => b.id)) + 1,
      name: form.name,
      description: form.description,
      products: selectedProducts.map((p) => ({ name: p.name, price: p.price })),
      bundlePrice: Number(form.bundlePrice),
      status: "scheduled",
      validFrom: form.validFrom,
      validTo: form.validTo,
      target: form.target,
      image: "/bundles/new-bundle.jpg",
      canBuyIndividually: form.canBuyIndividually,
      mixSalonRetail: form.mixSalonRetail,
    };
    setBundles([...bundles, newBundle]);
    setShowModal(false);
    setSelectedProducts([]);
    setForm({ name: "", description: "", bundlePrice: "", savingsPercent: "", validFrom: "", validTo: "", target: "Svi", canBuyIndividually: true, mixSalonRetail: false });
  };

  const duplicateBundle = (bundle: Bundle) => {
    const newBundle: Bundle = { ...bundle, id: Math.max(...bundles.map((b) => b.id)) + 1, name: bundle.name + " (kopija)", status: "scheduled" };
    setBundles([...bundles, newBundle]);
  };

  const deleteBundle = (id: number) => {
    setBundles(bundles.filter((b) => b.id !== id));
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-green-100 text-green-700",
      expired: "bg-red-100 text-red-700",
      scheduled: "bg-blue-100 text-blue-700",
    };
    const labels: Record<string, string> = { active: "Aktivan", expired: "Istekao", scheduled: "Zakazan" };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>{labels[status]}</span>;
  };

  const getSavings = (bundle: Bundle) => {
    const original = bundle.products.reduce((sum, p) => sum + p.price, 0);
    return original > 0 ? Math.round(((original - bundle.bundlePrice) / original) * 100) : 0;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#2d2d2d]">Paketi</h1>
          <p className="text-[#666] mt-1">Kreirajte i upravljajte paketima proizvoda</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-[#8c4a5a] text-white px-5 py-2.5 rounded-lg hover:bg-[#b8994e] transition-colors font-medium text-sm"
        >
          <Plus size={18} />
          Novi paket
        </button>
      </div>

      {/* Bundle Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {bundles.map((bundle) => (
          <div key={bundle.id} className="bg-white rounded-xl border border-[#e0d8cc] overflow-hidden hover:shadow-lg transition-shadow">
            {/* Image placeholder */}
            <div className="h-40 bg-gradient-to-br from-[#8c4a5a]/20 to-[#8c4a5a]/5 flex items-center justify-center relative">
              <Package size={48} className="text-[#8c4a5a]/40" />
              <div className="absolute top-3 right-3">{statusBadge(bundle.status)}</div>
              {getSavings(bundle) > 0 && (
                <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  -{getSavings(bundle)}%
                </div>
              )}
            </div>
            <div className="p-5">
              <h3 className="font-serif text-lg font-bold text-[#2d2d2d] mb-1">{bundle.name}</h3>
              <p className="text-sm text-[#666] mb-3 line-clamp-2">{bundle.description}</p>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs bg-[#f5f0e8] text-[#666] px-2 py-1 rounded">{bundle.products.length} proizvoda</span>
                <span className="text-xs bg-[#f5f0e8] text-[#666] px-2 py-1 rounded">{bundle.target}</span>
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-xl font-bold text-[#2d2d2d]">{bundle.bundlePrice.toLocaleString()} RSD</span>
                <span className="text-sm text-[#999] line-through">
                  {bundle.products.reduce((s, p) => s + p.price, 0).toLocaleString()} RSD
                </span>
              </div>
              <div className="text-xs text-[#999] mb-4">
                <Calendar size={12} className="inline mr-1" />
                {bundle.validFrom} - {bundle.validTo}
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-[#f5f0e8]">
                <button className="flex-1 py-2 text-sm font-medium text-[#8c4a5a] hover:bg-[#8c4a5a]/5 rounded-lg transition-colors">
                  <Edit3 size={14} className="inline mr-1" />
                  Izmeni
                </button>
                <button onClick={() => duplicateBundle(bundle)} className="flex-1 py-2 text-sm font-medium text-[#666] hover:bg-[#f5f0e8] rounded-lg transition-colors">
                  <Copy size={14} className="inline mr-1" />
                  Dupliraj
                </button>
                <button onClick={() => deleteBundle(bundle.id)} className="py-2 px-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-[#e0d8cc]">
              <h2 className="font-serif text-xl font-bold text-[#2d2d2d]">Novi paket</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-[#f5f0e8] rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#333] mb-1">Naziv paketa</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none" placeholder="npr. Letnji set za negu" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333] mb-1">Opis</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none resize-none" />
              </div>
              {/* Product selection */}
              <div>
                <label className="block text-sm font-medium text-[#333] mb-1">Proizvodi u paketu</label>
                <div className="relative mb-2">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
                  <input type="text" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none" placeholder="Pretraži proizvode..." />
                </div>
                <div className="border border-[#e0d8cc] rounded-lg max-h-48 overflow-y-auto">
                  {allProducts.filter((p) => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase())).map((product) => {
                    const isSelected = selectedProducts.some((sp) => sp.id === product.id);
                    return (
                      <div
                        key={product.id}
                        onClick={() => toggleProduct(product)}
                        className={`flex items-center justify-between px-4 py-2.5 cursor-pointer border-b border-[#f5f0e8] last:border-0 hover:bg-[#f5f0e8] transition-colors ${isSelected ? "bg-[#8c4a5a]/5" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? "bg-[#8c4a5a] border-[#8c4a5a]" : "border-[#ddd]"}`}>
                            {isSelected && <Check size={12} className="text-white" />}
                          </div>
                          <span className="text-sm text-[#333]">{product.name}</span>
                        </div>
                        <span className="text-sm font-medium text-[#666]">{product.price.toLocaleString()} RSD</span>
                      </div>
                    );
                  })}
                </div>
                {selectedProducts.length > 0 && (
                  <p className="text-xs text-[#999] mt-2">Izabrano: {selectedProducts.length} proizvoda | Ukupna vrednost: {totalOriginal.toLocaleString()} RSD</p>
                )}
              </div>
              {/* Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1">Cena paketa (RSD)</label>
                  <input type="number" value={form.bundlePrice} onChange={(e) => handlePriceChange(e.target.value)} className="w-full px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1">Ušteda (%)</label>
                  <input type="number" value={form.savingsPercent} onChange={(e) => handleSavingsChange(e.target.value)} className="w-full px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none" />
                </div>
              </div>
              {/* Toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-[#f5f0e8] rounded-lg p-3">
                  <span className="text-sm text-[#333]">Proizvodi se mogu kupiti pojedinačno?</span>
                  <button onClick={() => setForm({ ...form, canBuyIndividually: !form.canBuyIndividually })}>
                    {form.canBuyIndividually ? <ToggleRight size={28} className="text-[#8c4a5a]" /> : <ToggleLeft size={28} className="text-[#999]" />}
                  </button>
                </div>
                <div className="flex items-center justify-between bg-[#f5f0e8] rounded-lg p-3">
                  <span className="text-sm text-[#333]">Mešaj salon + maloprodajne proizvode?</span>
                  <button onClick={() => setForm({ ...form, mixSalonRetail: !form.mixSalonRetail })}>
                    {form.mixSalonRetail ? <ToggleRight size={28} className="text-[#8c4a5a]" /> : <ToggleLeft size={28} className="text-[#999]" />}
                  </button>
                </div>
              </div>
              {/* Dates and Target */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1">Važi od</label>
                  <input type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} className="w-full px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1">Važi do</label>
                  <input type="date" value={form.validTo} onChange={(e) => setForm({ ...form, validTo: e.target.value })} className="w-full px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1">Ciljna grupa</label>
                  <select value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value as "Svi" | "B2B" | "B2C" })} className="w-full px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none">
                    <option value="Svi">Svi</option>
                    <option value="B2B">B2B</option>
                    <option value="B2C">B2C</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-[#999]">Paket će biti automatski deaktiviran nakon isteka datuma.</p>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-[#e0d8cc]">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 border border-[#e0d8cc] rounded-lg text-sm font-medium hover:bg-[#f5f0e8] transition-colors">Otkaži</button>
              <button onClick={handleCreate} className="px-5 py-2.5 bg-[#8c4a5a] text-white rounded-lg text-sm font-medium hover:bg-[#b8994e] transition-colors">Kreiraj paket</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
