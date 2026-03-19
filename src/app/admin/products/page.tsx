"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  MoreVertical,
  CheckSquare,
  Square,
  Package,
  Eye,
  EyeOff,
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  price: number;
  oldPrice?: number;
  stock: number;
  status: "active" | "inactive";
  image: string;
  description: string;
}

const initialProducts: Product[] = [
  { id: 1, name: "Serie Expert Gold Quinoa", brand: "L'Oréal", category: "Nega kose", price: 2500, oldPrice: 3200, stock: 45, status: "active", image: "/products/loreal1.jpg", description: "Profesionalni šampon za oštećenu kosu" },
  { id: 2, name: "BC Bonacure Peptide Repair", brand: "Schwarzkopf", category: "Nega kose", price: 1800, stock: 32, status: "active", image: "/products/schwarzkopf1.jpg", description: "Rescue šampon za finu kosu" },
  { id: 3, name: "Elixir Ultime Serum", brand: "Kérastase", category: "Ulja i serumi", price: 4200, oldPrice: 4800, stock: 3, status: "active", image: "/products/kerastase1.jpg", description: "Luksuzno ulje za sjaj kose" },
  { id: 4, name: "Oil Reflections Šampon", brand: "Wella", category: "Nega kose", price: 1950, stock: 28, status: "active", image: "/products/wella1.jpg", description: "Šampon za blistavu kosu" },
  { id: 5, name: "Moroccanoil Treatment 100ml", brand: "Moroccanoil", category: "Ulja i serumi", price: 3500, stock: 15, status: "active", image: "/products/moroccanoil1.jpg", description: "Originalni tretman za kosu" },
  { id: 6, name: "Igora Royal 60ml - 7.0", brand: "Schwarzkopf", category: "Boje za kosu", price: 850, stock: 120, status: "active", image: "/products/igora1.jpg", description: "Permanentna boja za kosu" },
  { id: 7, name: "Majirel 50ml - 6.0", brand: "L'Oréal", category: "Boje za kosu", price: 900, stock: 5, status: "active", image: "/products/majirel1.jpg", description: "Profesionalna boja za kosu" },
  { id: 8, name: "OSIS+ Dust It", brand: "Schwarzkopf", category: "Styling", price: 1200, stock: 42, status: "inactive", image: "/products/osis1.jpg", description: "Matirajući puder za volumen" },
  { id: 9, name: "Tecni Art Pli Shaper", brand: "L'Oréal", category: "Styling", price: 1450, stock: 18, status: "active", image: "/products/tecniart1.jpg", description: "Termo-aktivni gel za oblikovanje" },
  { id: 10, name: "Koleston Perfect 60ml - 8/0", brand: "Wella", category: "Boje za kosu", price: 950, stock: 4, status: "active", image: "/products/koleston1.jpg", description: "Profesionalna boja za kosu" },
  { id: 11, name: "Blondme Premium Lift", brand: "Schwarzkopf", category: "Boje za kosu", price: 1100, stock: 55, status: "active", image: "/products/blondme1.jpg", description: "Premium puder za posvetljivanje" },
  { id: 12, name: "Mythic Oil Huile", brand: "L'Oréal", category: "Ulja i serumi", price: 2800, stock: 22, status: "active", image: "/products/mythic1.jpg", description: "Hranljivo ulje za kosu" },
];

const brands = ["Svi brendovi", "L'Oréal", "Schwarzkopf", "Kérastase", "Wella", "Moroccanoil"];
const categories = ["Sve kategorije", "Nega kose", "Boje za kosu", "Styling", "Ulja i serumi"];
const statuses = ["Svi statusi", "Aktivan", "Neaktivan"];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("Svi brendovi");
  const [categoryFilter, setCategoryFilter] = useState("Sve kategorije");
  const [statusFilter, setStatusFilter] = useState("Svi statusi");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const perPage = 8;

  const [formData, setFormData] = useState({
    name: "",
    brand: "L'Oréal",
    category: "Nega kose",
    price: "",
    oldPrice: "",
    description: "",
    stock: "",
    status: "active" as "active" | "inactive",
    image: "",
  });

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase());
    const matchBrand = brandFilter === "Svi brendovi" || p.brand === brandFilter;
    const matchCategory = categoryFilter === "Sve kategorije" || p.category === categoryFilter;
    const matchStatus =
      statusFilter === "Svi statusi" ||
      (statusFilter === "Aktivan" && p.status === "active") ||
      (statusFilter === "Neaktivan" && p.status === "inactive");
    return matchSearch && matchBrand && matchCategory && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({ name: "", brand: "L'Oréal", category: "Nega kose", price: "", oldPrice: "", description: "", stock: "", status: "active", image: "" });
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: product.price.toString(),
      oldPrice: product.oldPrice?.toString() || "",
      description: product.description,
      stock: product.stock.toString(),
      status: product.status,
      image: product.image,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingProduct) {
      setProducts(products.map((p) =>
        p.id === editingProduct.id
          ? { ...p, ...formData, price: Number(formData.price), oldPrice: formData.oldPrice ? Number(formData.oldPrice) : undefined, stock: Number(formData.stock) }
          : p
      ));
    } else {
      const newProduct: Product = {
        id: Math.max(...products.map((p) => p.id)) + 1,
        name: formData.name,
        brand: formData.brand,
        category: formData.category,
        price: Number(formData.price),
        oldPrice: formData.oldPrice ? Number(formData.oldPrice) : undefined,
        stock: Number(formData.stock),
        status: formData.status,
        image: formData.image || "/products/placeholder.jpg",
        description: formData.description,
      };
      setProducts([newProduct, ...products]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    setProducts(products.filter((p) => p.id !== id));
    setSelectedIds(selectedIds.filter((sid) => sid !== id));
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedIds.length === paginated.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginated.map((p) => p.id));
    }
  };

  const bulkAction = (action: string) => {
    if (action === "delete") {
      setProducts(products.filter((p) => !selectedIds.includes(p.id)));
    } else if (action === "activate") {
      setProducts(products.map((p) => selectedIds.includes(p.id) ? { ...p, status: "active" as const } : p));
    } else if (action === "deactivate") {
      setProducts(products.map((p) => selectedIds.includes(p.id) ? { ...p, status: "inactive" as const } : p));
    }
    setSelectedIds([]);
    setShowBulkMenu(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#2d2d2d]">Proizvodi</h1>
          <p className="text-sm text-[#666] mt-1">{products.length} ukupno proizvoda</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-gold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 self-start"
        >
          <Plus size={18} />
          Dodaj Proizvod
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-[#e0d8cc] p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
            <input
              type="text"
              placeholder="Pretraži proizvode..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-[#f5f0e8] border border-transparent rounded-lg text-sm focus:bg-white focus:border-[#8c4a5a]"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden flex items-center gap-2 px-4 py-2.5 bg-[#f5f0e8] rounded-lg text-sm text-[#666]"
          >
            <Filter size={16} />
            Filteri
          </button>
          <div className={`${showFilters ? "flex" : "hidden"} sm:flex flex-col sm:flex-row gap-3`}>
            <select value={brandFilter} onChange={(e) => { setBrandFilter(e.target.value); setCurrentPage(1); }} className="px-3 py-2.5 bg-[#f5f0e8] border border-transparent rounded-lg text-sm cursor-pointer focus:border-[#8c4a5a]">
              {brands.map((b) => <option key={b}>{b}</option>)}
            </select>
            <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }} className="px-3 py-2.5 bg-[#f5f0e8] border border-transparent rounded-lg text-sm cursor-pointer focus:border-[#8c4a5a]">
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="px-3 py-2.5 bg-[#f5f0e8] border border-transparent rounded-lg text-sm cursor-pointer focus:border-[#8c4a5a]">
              {statuses.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[#f0f0f0] flex items-center gap-3">
            <span className="text-sm text-[#666]">{selectedIds.length} selektovano</span>
            <div className="relative">
              <button
                onClick={() => setShowBulkMenu(!showBulkMenu)}
                className="px-3 py-1.5 bg-[#2d2d2d] text-white rounded-lg text-sm flex items-center gap-1"
              >
                Akcije <MoreVertical size={14} />
              </button>
              {showBulkMenu && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-lg shadow-xl border border-[#e0d8cc] overflow-hidden z-10 animate-slideDown">
                  <button onClick={() => bulkAction("activate")} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[#333] hover:bg-[#f5f0e8]">
                    <Eye size={14} /> Aktiviraj
                  </button>
                  <button onClick={() => bulkAction("deactivate")} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[#333] hover:bg-[#f5f0e8]">
                    <EyeOff size={14} /> Deaktiviraj
                  </button>
                  <button onClick={() => bulkAction("delete")} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50">
                    <Trash2 size={14} /> Obriši
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-[#e0d8cc] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f5f0e8] border-b border-[#e0d8cc]">
                <th className="px-4 py-3 text-left">
                  <button onClick={selectAll} className="text-[#999] hover:text-[#2d2d2d]">
                    {selectedIds.length === paginated.length && paginated.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">Proizvod</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden md:table-cell">Brend</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden lg:table-cell">Kategorija</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">Cena</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden sm:table-cell">Zalihe</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden sm:table-cell">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">Akcije</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {paginated.map((product) => (
                <tr key={product.id} className="hover:bg-[#f5f0e8] transition-colors">
                  <td className="px-4 py-3">
                    <button onClick={() => toggleSelect(product.id)} className="text-[#999] hover:text-[#2d2d2d]">
                      {selectedIds.includes(product.id) ? <CheckSquare size={18} className="text-[#8c4a5a]" /> : <Square size={18} />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#f5f0e8] flex items-center justify-center flex-shrink-0">
                        <Package size={18} className="text-[#999]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#2d2d2d] truncate max-w-[200px]">{product.name}</p>
                        <p className="text-xs text-[#999] md:hidden">{product.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#333] hidden md:table-cell">{product.brand}</td>
                  <td className="px-4 py-3 text-sm text-[#333] hidden lg:table-cell">{product.category}</td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="text-sm font-medium text-[#2d2d2d]">{product.price.toLocaleString()} RSD</span>
                      {product.oldPrice && (
                        <span className="block text-xs text-[#999] line-through">{product.oldPrice.toLocaleString()} RSD</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`text-sm font-medium ${product.stock <= 5 ? "text-red-500" : product.stock <= 15 ? "text-orange-500" : "text-[#333]"}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${product.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {product.status === "active" ? "Aktivan" : "Neaktivan"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEditModal(product)} className="p-1.5 text-[#999] hover:text-[#8c4a5a] hover:bg-[#8c4a5a]/10 rounded-lg transition-colors">
                        <Edit3 size={15} />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-1.5 text-[#999] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-[#e0d8cc] flex items-center justify-between">
            <span className="text-sm text-[#666]">
              Prikazano {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filtered.length)} od {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg text-[#666] hover:bg-[#f5f0e8] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${page === currentPage ? "bg-[#8c4a5a] text-white" : "text-[#666] hover:bg-[#f5f0e8]"}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg text-[#666] hover:bg-[#f5f0e8] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white p-6 border-b border-[#e0d8cc] flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-serif font-bold text-[#2d2d2d]">
                {editingProduct ? "Izmeni Proizvod" : "Dodaj Proizvod"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-[#999] hover:text-[#2d2d2d]">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#333] mb-1.5">Naziv proizvoda</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 border border-[#e0d8cc] rounded-lg text-sm" placeholder="Unesite naziv..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">Brend</label>
                  <select value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} className="w-full px-4 py-2.5 border border-[#e0d8cc] rounded-lg text-sm cursor-pointer">
                    {brands.filter((b) => b !== "Svi brendovi").map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">Kategorija</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2.5 border border-[#e0d8cc] rounded-lg text-sm cursor-pointer">
                    {categories.filter((c) => c !== "Sve kategorije").map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">Cena (RSD)</label>
                  <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full px-4 py-2.5 border border-[#e0d8cc] rounded-lg text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">Stara cena (RSD)</label>
                  <input type="number" value={formData.oldPrice} onChange={(e) => setFormData({ ...formData, oldPrice: e.target.value })} className="w-full px-4 py-2.5 border border-[#e0d8cc] rounded-lg text-sm" placeholder="Opciono" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333] mb-1.5">Opis</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 border border-[#e0d8cc] rounded-lg text-sm resize-none" placeholder="Opis proizvoda..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">Zalihe</label>
                  <input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className="w-full px-4 py-2.5 border border-[#e0d8cc] rounded-lg text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">Status</label>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => setFormData({ ...formData, status: formData.status === "active" ? "inactive" : "active" })}
                      className={`relative w-12 h-6 rounded-full transition-colors ${formData.status === "active" ? "bg-[#8c4a5a]" : "bg-gray-300"}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.status === "active" ? "translate-x-6.5" : "translate-x-0.5"}`} />
                    </button>
                    <span className="text-sm text-[#666]">{formData.status === "active" ? "Aktivan" : "Neaktivan"}</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333] mb-1.5">URL slike</label>
                <input type="text" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className="w-full px-4 py-2.5 border border-[#e0d8cc] rounded-lg text-sm" placeholder="/products/slika.jpg" />
              </div>
            </div>
            <div className="p-6 border-t border-[#e0d8cc] flex items-center justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-lg text-sm font-medium text-[#666] hover:bg-[#f5f0e8] transition-colors">
                Otkaži
              </button>
              <button onClick={handleSave} className="btn-gold px-5 py-2.5 rounded-lg text-sm">
                {editingProduct ? "Sačuvaj Izmene" : "Dodaj Proizvod"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
