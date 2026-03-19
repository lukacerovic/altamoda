"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/stores/cart-store";
import { B2B_BULK_DISCOUNT } from "@/lib/constants";
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
  AlertCircle,
} from "lucide-react";

interface RecentOrder {
  id: string;
  orderNumber: string;
  date: string;
  items: number;
  total: number;
}

interface OrderItem {
  productId: string;
  code: string;
  name: string;
  brand: string;
  price: number;
  qty: number;
  image: string;
}

interface Props {
  recentOrders: RecentOrder[];
}

export default function QuickOrderPageClient({ recentOrders }: Props) {
  const router = useRouter();
  const { addItem } = useCartStore();
  const [activeTab, setActiveTab] = useState<"code" | "list" | "csv">("code");
  const [codeInput, setCodeInput] = useState("");
  const [qtyInput, setQtyInput] = useState(1);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [suggestions, setSuggestions] = useState<OrderItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvResult, setCsvResult] = useState<{ items: any[]; summary: any } | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [repeatLoading, setRepeatLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = Math.round(subtotal * (B2B_BULK_DISCOUNT / 100));
  const total = subtotal - discount;

  // SKU search
  const handleCodeSearch = useCallback(async (value: string) => {
    setCodeInput(value);
    if (value.length < 2) {
      setSuggestions([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch("/api/orders/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "sku", sku: value }),
      });
      const data = await res.json();
      if (data.success) {
        setSuggestions([{
          productId: data.data.id,
          code: data.data.sku,
          name: data.data.name,
          brand: data.data.brand,
          price: data.data.price,
          qty: 1,
          image: data.data.image,
        }]);
      } else {
        setSuggestions([]);
      }
    } catch {
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const addByCode = (product: OrderItem) => {
    const existing = orderItems.find((i) => i.productId === product.productId);
    if (existing) {
      setOrderItems(orderItems.map((i) =>
        i.productId === product.productId ? { ...i, qty: i.qty + qtyInput } : i
      ));
    } else {
      setOrderItems([...orderItems, { ...product, qty: qtyInput }]);
    }
    setCodeInput("");
    setSuggestions([]);
    setQtyInput(1);
  };

  // CSV upload
  const handleCsvUpload = async () => {
    if (!csvFile) return;
    setCsvLoading(true);
    setError("");
    try {
      const text = await csvFile.text();
      const lines = text.trim().split("\n").slice(1); // skip header
      const rows = lines.map((line) => {
        const [sku, qty] = line.split(",").map((s) => s.trim());
        return { sku, quantity: parseInt(qty) || 1 };
      }).filter((r) => r.sku);

      const res = await fetch("/api/orders/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "csv", rows }),
      });
      const data = await res.json();
      if (data.success) {
        setCsvResult(data.data);
      } else {
        setError(data.error || "Greška pri obradi CSV fajla");
      }
    } catch {
      setError("Greška pri čitanju fajla");
    } finally {
      setCsvLoading(false);
    }
  };

  const addCsvToOrder = () => {
    if (!csvResult) return;
    const validItems = csvResult.items.filter((i: any) => i.found && i.inStock);
    for (const item of validItems) {
      const existing = orderItems.find((i) => i.productId === item.productId);
      if (existing) {
        setOrderItems((prev) =>
          prev.map((i) => i.productId === item.productId ? { ...i, qty: i.qty + item.quantity } : i)
        );
      } else {
        setOrderItems((prev) => [...prev, {
          productId: item.productId,
          code: item.sku,
          name: item.name,
          brand: item.brand || "",
          price: item.price,
          qty: item.quantity,
          image: item.image || "",
        }]);
      }
    }
    setCsvResult(null);
    setCsvFile(null);
  };

  // Repeat order
  const handleRepeatOrder = async (orderId: string) => {
    setRepeatLoading(orderId);
    try {
      const res = await fetch("/api/orders/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "repeat", orderId }),
      });
      const data = await res.json();
      if (data.success) {
        const newItems: OrderItem[] = data.data.items.map((item: any) => ({
          productId: item.productId,
          code: item.sku,
          name: item.name,
          brand: item.brand,
          price: item.price,
          qty: item.quantity,
          image: item.image || "",
        }));
        setOrderItems(newItems);
      }
    } catch {
      setError("Greška pri učitavanju porudžbine");
    } finally {
      setRepeatLoading(null);
    }
  };

  // Place order — add all to cart and go to checkout
  const handleOrder = () => {
    for (const item of orderItems) {
      addItem({
        productId: item.productId,
        name: item.name,
        brand: item.brand,
        price: item.price,
        quantity: item.qty,
        image: item.image,
        sku: item.code,
        stockQuantity: 999,
      });
    }
    router.push("/checkout");
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

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

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

            {/* Tab: CSV Upload */}
            {activeTab === "csv" && (
              <div className="bg-white rounded-xl border border-[#e0d8cc] p-6">
                {!csvResult ? (
                  <>
                    <div
                      className="border-2 border-dashed border-[#e0d8cc] rounded-xl p-12 text-center hover:border-[#8c4a5a] transition-colors cursor-pointer"
                      onClick={() => document.getElementById("csv-input")?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file) setCsvFile(file);
                      }}
                    >
                      <Upload className="w-12 h-12 text-[#8c4a5a] mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-[#333] mb-2">
                        {csvFile ? csvFile.name : "Prevucite CSV fajl ovde"}
                      </h3>
                      <p className="text-sm text-[#666] mb-4">ili kliknite da izaberete fajl</p>
                      <input
                        id="csv-input"
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setCsvFile(file);
                        }}
                      />
                      {csvFile && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCsvUpload(); }}
                          disabled={csvLoading}
                          className="px-6 py-2.5 bg-[#8c4a5a] text-white rounded-lg text-sm font-medium hover:bg-[#6e3848] transition-colors disabled:opacity-50"
                        >
                          {csvLoading ? "Obrada..." : "Učitaj"}
                        </button>
                      )}
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
                    <p className="text-sm text-[#666] mb-6">Pronađeno {csvResult.summary.found} od {csvResult.summary.total} proizvoda</p>
                    <div className="bg-[#f5f0e8] rounded-lg p-4 text-left max-w-sm mx-auto mb-6">
                      <div className="flex justify-between text-sm mb-1"><span className="text-[#666]">Pronađeno:</span><span className="font-medium">{csvResult.summary.found} stavki</span></div>
                      <div className="flex justify-between text-sm mb-1"><span className="text-[#666]">Ukupna vrednost:</span><span className="font-medium">{csvResult.summary.totalValue?.toLocaleString()} RSD</span></div>
                      <div className="flex justify-between text-sm"><span className="text-[#666]">Nedostupno:</span><span className="font-medium text-orange-500">{csvResult.summary.notFound + csvResult.summary.outOfStock} stavki</span></div>
                    </div>
                    <div className="flex gap-3 justify-center">
                      <button onClick={addCsvToOrder} className="px-6 py-2.5 bg-[#8c4a5a] hover:bg-[#6e3848] text-white text-sm font-medium rounded-lg transition-colors">Dodaj sve u korpu</button>
                      <button onClick={() => { setCsvResult(null); setCsvFile(null); }} className="px-6 py-2.5 border border-[#e0d8cc] text-[#666] text-sm font-medium rounded-lg hover:bg-[#f5f0e8] transition-colors">Otkaži</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recent Orders */}
            {recentOrders.length > 0 && (
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
                          <p className="font-medium text-sm text-[#333]">{order.orderNumber}</p>
                          <p className="text-xs text-[#999] flex items-center gap-1"><Clock className="w-3 h-3" /> {order.date} · {order.items} stavki</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-sm">{order.total.toLocaleString()} RSD</span>
                        <button
                          onClick={() => handleRepeatOrder(order.id)}
                          disabled={repeatLoading === order.id}
                          className="flex items-center gap-1 px-4 py-2 border border-[#8c4a5a] text-[#8c4a5a] text-sm font-medium rounded-lg hover:bg-[#8c4a5a] hover:text-white transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${repeatLoading === order.id ? "animate-spin" : ""}`} /> Ponovi
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="w-full lg:w-80 lg:flex-shrink-0">
            <div className="bg-white rounded-xl border border-[#e0d8cc] p-6 sticky top-24">
              <h3 className="font-semibold text-[#2d2d2d] mb-4">Pregled narudžbine</h3>
              {orderItems.length > 0 ? (
                <>
                  <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                    {orderItems.map((item) => (
                      <div key={item.productId} className="flex items-center justify-between text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono text-[#8c4a5a]">{item.code}</p>
                          <p className="text-[#333] truncate">{item.name}</p>
                          <p className="text-xs text-[#999]">×{item.qty}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <span className="font-medium whitespace-nowrap">{(item.price * item.qty).toLocaleString()} RSD</span>
                          <button onClick={() => setOrderItems(orderItems.filter((i) => i.productId !== item.productId))} className="text-[#999] hover:text-[#c0392b]">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-[#e0d8cc] pt-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-[#666]">Subtotal:</span><span>{subtotal.toLocaleString()} RSD</span></div>
                    <div className="flex justify-between text-green-600"><span>B2B Popust ({B2B_BULK_DISCOUNT}%):</span><span>-{discount.toLocaleString()} RSD</span></div>
                    <div className="flex justify-between font-bold text-lg border-t border-[#e0d8cc] pt-2 mt-2">
                      <span>Ukupno:</span><span>{total.toLocaleString()} RSD</span>
                    </div>
                  </div>
                  <button onClick={handleOrder} className="w-full mt-6 py-3 bg-[#8c4a5a] hover:bg-[#6e3848] text-white font-medium rounded-lg transition-colors text-sm tracking-wide">
                    Naruči
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
