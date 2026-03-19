"use client";

import { useState } from "react";
import {
  Plus,
  Minus,
  Upload,
  FileText,
  Clock,
  RefreshCw,
  Check,
  Package,
  Hash,
  List,
  Trash2,
} from "lucide-react";

const quickProducts = [
  { code: "MAJ-7.1", name: "Majirel 7.1 Pepeljasto Plava 50ml", brand: "L'Oréal", price: 890, category: "Boja" },
  { code: "MAJ-6.0", name: "Majirel 6.0 Tamno Plava 50ml", brand: "L'Oréal", price: 890, category: "Boja" },
  { code: "IGO-6-0", name: "Igora Royal 6-0 60ml", brand: "Schwarzkopf", price: 790, category: "Boja" },
  { code: "IGO-7-1", name: "Igora Royal 7-1 60ml", brand: "Schwarzkopf", price: 790, category: "Boja" },
  { code: "OXI-6", name: "Oxydant Creme 6% 1000ml", brand: "L'Oréal", price: 690, category: "Oksidant" },
  { code: "OXI-9", name: "Oxydant Creme 9% 1000ml", brand: "L'Oréal", price: 690, category: "Oksidant" },
  { code: "ABS-SH", name: "Absolut Repair Šampon 1500ml", brand: "L'Oréal", price: 5490, category: "Šampon" },
  { code: "ABS-MS", name: "Absolut Repair Maska 500ml", brand: "L'Oréal", price: 4890, category: "Maska" },
  { code: "BC-REP", name: "BC Repair Rescue Šampon 1000ml", brand: "Schwarzkopf", price: 3290, category: "Šampon" },
  { code: "KER-BN", name: "Bain Satin 1 Šampon 1000ml", brand: "Kérastase", price: 5890, category: "Šampon" },
];

const recentOrders = [
  { id: "ORD-2847", date: "10. Mar 2025", items: 12, total: 28450 },
  { id: "ORD-2831", date: "25. Feb 2025", items: 8, total: 19200 },
  { id: "ORD-2815", date: "12. Feb 2025", items: 15, total: 34600 },
];

export default function QuickOrderPage() {
  const [activeTab, setActiveTab] = useState<"code" | "list" | "csv">("code");
  const [codeInput, setCodeInput] = useState("");
  const [qtyInput, setQtyInput] = useState(1);
  const [orderItems, setOrderItems] = useState<{ code: string; name: string; price: number; qty: number }[]>([
    { code: "MAJ-7.1", name: "Majirel 7.1 Pepeljasto Plava 50ml", price: 890, qty: 5 },
    { code: "OXI-6", name: "Oxydant Creme 6% 1000ml", price: 690, qty: 2 },
  ]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [csvUploaded, setCsvUploaded] = useState(false);
  const [suggestions, setSuggestions] = useState<typeof quickProducts>([]);
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = Math.round(subtotal * 0.15);
  const total = subtotal - discount;

  const handleCodeSearch = (value: string) => {
    setCodeInput(value);
    if (value.length > 1) {
      setSuggestions(quickProducts.filter((p) => p.code.toLowerCase().includes(value.toLowerCase()) || p.name.toLowerCase().includes(value.toLowerCase())));
    } else {
      setSuggestions([]);
    }
  };

  const addByCode = (product: typeof quickProducts[0]) => {
    const existing = orderItems.find((i) => i.code === product.code);
    if (existing) {
      setOrderItems(orderItems.map((i) => (i.code === product.code ? { ...i, qty: i.qty + qtyInput } : i)));
    } else {
      setOrderItems([...orderItems, { code: product.code, name: product.name, price: product.price, qty: qtyInput }]);
    }
    setCodeInput("");
    setSuggestions([]);
    setQtyInput(1);
  };

  const toggleProduct = (code: string) => {
    const next = new Set(selectedProducts);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    setSelectedProducts(next);
  };

  const addSelected = () => {
    selectedProducts.forEach((code) => {
      const product = quickProducts.find((p) => p.code === code);
      if (product) {
        const qty = quantities[code] || 1;
        const existing = orderItems.find((i) => i.code === code);
        if (existing) {
          setOrderItems((prev) => prev.map((i) => (i.code === code ? { ...i, qty: i.qty + qty } : i)));
        } else {
          setOrderItems((prev) => [...prev, { code, name: product.name, price: product.price, qty }]);
        }
      }
    });
    setSelectedProducts(new Set());
  };

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* B2B Badge & Title */}
        <div className="mb-8">
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#2d2d2d] text-[#8c4a5a] text-xs font-semibold rounded-full mb-4">
            <Package className="w-3 h-3" /> B2B
          </span>
          <h1 className="text-3xl font-bold text-[#2d2d2d]" style={{ fontFamily: "'Playfair Display', serif" }}>Brza Narudžbina</h1>
          <p className="text-[#666] mt-1">Naručite brzo koristeći šifre proizvoda, listu ili CSV upload</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Tabs */}
            <div className="flex border-b border-[#e0d8cc] mb-6">
              {[
                { key: "code" as const, label: "Po šifri", icon: Hash },
                { key: "list" as const, label: "Lista proizvoda", icon: List },
                { key: "csv" as const, label: "Upload CSV", icon: Upload },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all ${
                    activeTab === tab.key ? "border-[#8c4a5a] text-[#8c4a5a]" : "border-transparent text-[#666] hover:text-[#333]"
                  }`}
                >
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
            </div>

            {/* Tab: By Code */}
            {activeTab === "code" && (
              <div className="bg-white rounded-xl border border-[#e0d8cc] p-6">
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={codeInput}
                      onChange={(e) => handleCodeSearch(e.target.value)}
                      placeholder="Unesite šifru ili naziv proizvoda..."
                      className="w-full px-4 py-3 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a]"
                    />
                    {suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-[#e0d8cc] rounded-lg mt-1 shadow-lg z-10 max-h-60 overflow-y-auto">
                        {suggestions.map((s) => (
                          <button
                            key={s.code}
                            onClick={() => addByCode(s)}
                            className="w-full text-left px-4 py-3 hover:bg-[#f5f0e8] border-b border-[#f0f0f0] last:border-0"
                          >
                            <span className="text-xs font-mono text-[#8c4a5a]">{s.code}</span>
                            <span className="text-sm text-[#333] ml-2">{s.name}</span>
                            <span className="text-sm font-semibold text-[#2d2d2d] float-right">{s.price} RSD</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-[#666]">Količina:</label>
                    <div className="flex items-center border border-[#e0d8cc] rounded-lg">
                      <button onClick={() => setQtyInput(Math.max(1, qtyInput - 1))} className="px-3 py-2 hover:bg-[#f5f0e8]"><Minus className="w-4 h-4" /></button>
                      <span className="px-3 py-2 text-sm font-medium min-w-[40px] text-center">{qtyInput}</span>
                      <button onClick={() => setQtyInput(qtyInput + 1)} className="px-3 py-2 hover:bg-[#f5f0e8]"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-[#999]">Počnite da kucate šifru ili naziv proizvoda za brzu pretragu</p>
              </div>
            )}

            {/* Tab: Product List */}
            {activeTab === "list" && (
              <div className="bg-white rounded-xl border border-[#e0d8cc] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#f5f0e8]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider w-10"></th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">Šifra</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">Proizvod</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">Cena</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider w-32">Količina</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quickProducts.map((product) => (
                        <tr key={product.code} className="border-t border-[#f0f0f0] hover:bg-[#f5f0e8]">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedProducts.has(product.code)}
                              onChange={() => toggleProduct(product.code)}
                              className="w-4 h-4 accent-[#8c4a5a]"
                            />
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-[#8c4a5a]">{product.code}</td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-[#333]">{product.name}</p>
                            <p className="text-xs text-[#999]">{product.brand} · {product.category}</p>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-[#2d2d2d]">{product.price.toLocaleString()} RSD</td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="1"
                              value={quantities[product.code] || 1}
                              onChange={(e) => setQuantities({ ...quantities, [product.code]: parseInt(e.target.value) || 1 })}
                              className="w-20 px-3 py-1.5 border border-[#e0d8cc] rounded-lg text-sm text-center"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 border-t border-[#e0d8cc] flex justify-between items-center">
                  <span className="text-sm text-[#666]">{selectedProducts.size} proizvoda izabrano</span>
                  <button onClick={addSelected} className="px-6 py-2.5 bg-[#8c4a5a] hover:bg-[#6e3848] text-white text-sm font-medium rounded-lg transition-colors">
                    Dodaj izabrano u korpu
                  </button>
                </div>
              </div>
            )}

            {/* Tab: CSV Upload */}
            {activeTab === "csv" && (
              <div className="bg-white rounded-xl border border-[#e0d8cc] p-6">
                {!csvUploaded ? (
                  <>
                    <div
                      className="border-2 border-dashed border-[#e0d8cc] rounded-xl p-12 text-center hover:border-[#8c4a5a] transition-colors cursor-pointer"
                      onClick={() => setCsvUploaded(true)}
                    >
                      <Upload className="w-12 h-12 text-[#8c4a5a] mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-[#333] mb-2">Prevucite CSV fajl ovde</h3>
                      <p className="text-sm text-[#666] mb-4">ili kliknite da izaberete fajl</p>
                      <button className="px-6 py-2.5 border border-[#8c4a5a] text-[#8c4a5a] rounded-lg text-sm font-medium hover:bg-[#8c4a5a] hover:text-white transition-colors">
                        Izaberite fajl
                      </button>
                    </div>
                    <div className="mt-6 p-4 bg-[#f5f0e8] rounded-lg">
                      <p className="text-sm font-medium text-[#333] mb-2">Format CSV fajla:</p>
                      <code className="text-xs text-[#666] font-mono block bg-white p-3 rounded border">
                        sifra,kolicina<br />
                        MAJ-7.1,10<br />
                        OXI-6,3<br />
                        ABS-SH,2
                      </code>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#333] mb-2">Fajl uspešno učitan!</h3>
                    <p className="text-sm text-[#666] mb-6">Pronađeno 15 proizvoda u CSV fajlu</p>
                    <div className="bg-[#f5f0e8] rounded-lg p-4 text-left max-w-sm mx-auto mb-6">
                      <div className="flex justify-between text-sm mb-1"><span className="text-[#666]">Pronađeno:</span><span className="font-medium">15 stavki</span></div>
                      <div className="flex justify-between text-sm mb-1"><span className="text-[#666]">Ukupna vrednost:</span><span className="font-medium">24,350 RSD</span></div>
                      <div className="flex justify-between text-sm"><span className="text-[#666]">Nedostupno:</span><span className="font-medium text-orange-500">1 stavka</span></div>
                    </div>
                    <div className="flex gap-3 justify-center">
                      <button className="px-6 py-2.5 bg-[#8c4a5a] hover:bg-[#6e3848] text-white text-sm font-medium rounded-lg transition-colors">Dodaj sve u korpu</button>
                      <button onClick={() => setCsvUploaded(false)} className="px-6 py-2.5 border border-[#e0d8cc] text-[#666] text-sm font-medium rounded-lg hover:bg-[#f5f0e8] transition-colors">Otkaži</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recent Orders */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-[#2d2d2d] mb-4">Ponovi prethodnu porudžbinu</h3>
              <div className="grid gap-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-xl border border-[#e0d8cc] p-4 flex items-center justify-between hover:shadow-sm transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#f5f0e8] rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-[#8c4a5a]" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-[#333]">{order.id}</p>
                        <p className="text-xs text-[#999] flex items-center gap-1"><Clock className="w-3 h-3" /> {order.date} · {order.items} stavki</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-sm">{order.total.toLocaleString()} RSD</span>
                      <button className="flex items-center gap-1 px-4 py-2 border border-[#8c4a5a] text-[#8c4a5a] text-sm font-medium rounded-lg hover:bg-[#8c4a5a] hover:text-white transition-colors">
                        <RefreshCw className="w-3 h-3" /> Ponovi
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="w-full lg:w-80 lg:flex-shrink-0">
            <div className="bg-white rounded-xl border border-[#e0d8cc] p-6 sticky top-24">
              <h3 className="font-semibold text-[#2d2d2d] mb-4">Pregled narudžbine</h3>
              {orderItems.length > 0 ? (
                <>
                  <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                    {orderItems.map((item) => (
                      <div key={item.code} className="flex items-center justify-between text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono text-[#8c4a5a]">{item.code}</p>
                          <p className="text-[#333] truncate">{item.name}</p>
                          <p className="text-xs text-[#999]">×{item.qty}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <span className="font-medium whitespace-nowrap">{(item.price * item.qty).toLocaleString()} RSD</span>
                          <button onClick={() => setOrderItems(orderItems.filter((i) => i.code !== item.code))} className="text-[#999] hover:text-[#c0392b]">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-[#e0d8cc] pt-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-[#666]">Subtotal:</span><span>{subtotal.toLocaleString()} RSD</span></div>
                    <div className="flex justify-between text-green-600"><span>B2B Popust (15%):</span><span>-{discount.toLocaleString()} RSD</span></div>
                    <div className="flex justify-between font-bold text-lg border-t border-[#e0d8cc] pt-2 mt-2">
                      <span>Ukupno:</span><span>{total.toLocaleString()} RSD</span>
                    </div>
                  </div>
                  <button className="w-full mt-6 py-3 bg-[#8c4a5a] hover:bg-[#6e3848] text-white font-medium rounded-lg transition-colors text-sm tracking-wide">
                    Naruči
                  </button>
                  <button className="w-full mt-2 py-3 border border-[#e0d8cc] text-[#666] font-medium rounded-lg text-sm hover:bg-[#f5f0e8] transition-colors">
                    Sačuvaj kao šablon
                  </button>
                </>
              ) : (
                <p className="text-sm text-[#999] text-center py-8">Dodajte proizvode u narudžbinu</p>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
