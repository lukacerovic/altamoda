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
import { useLanguage } from "@/lib/i18n/LanguageContext";

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
  stockQuantity: number;
}

interface Props {
  recentOrders: RecentOrder[];
}

export default function QuickOrderPageClient({ recentOrders }: Props) {
  const { t } = useLanguage();
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
          stockQuantity: data.data.stockQuantity ?? 0,
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
      const parseErrors: string[] = [];
      const rows = lines.map((line, idx) => {
        const [sku, qty] = line.split(",").map((s) => s.trim());
        if (!sku) {
          parseErrors.push(t("quickOrder.csvRowMissingSku").replace("{row}", String(idx + 2)));
          return { sku: "", quantity: 1 };
        }
        const parsedQty = parseInt(qty);
        if (qty && isNaN(parsedQty)) {
          parseErrors.push(t("quickOrder.csvRowInvalidQty").replace("{row}", String(idx + 2)).replace("{qty}", qty).replace("{sku}", sku));
        }
        return { sku, quantity: parsedQty || 1 };
      }).filter((r) => r.sku);

      if (rows.length === 0) {
        setError(t("quickOrder.csvNoValidRows"));
        return;
      }

      const res = await fetch("/api/orders/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "csv", rows }),
      });
      const data = await res.json();
      if (data.success) {
        setCsvResult(data.data);
        if (parseErrors.length > 0) {
          setError(t("quickOrder.csvWarnings") + "\n" + parseErrors.join("\n"));
        }
      } else {
        setError(data.error || t("quickOrder.csvProcessError"));
      }
    } catch {
      setError(t("quickOrder.csvReadError"));
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
          stockQuantity: item.stockQuantity ?? item.quantity,
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
          stockQuantity: item.stockQuantity ?? item.quantity,
        }));
        setOrderItems(newItems);
      }
    } catch {
      setError(t("quickOrder.orderLoadError"));
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
        stockQuantity: item.stockQuantity,
      });
    }
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen bg-stone-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* B2B Badge & Title */}
        <div className="mb-8">
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-stone-900 text-secondary text-xs font-semibold rounded-full mb-4">
            <Package className="w-3 h-3" /> B2B
          </span>
          <h1 className="text-3xl font-bold text-black" style={{ fontFamily: "'Noto Serif', serif" }}>{t("quickOrder.title")}</h1>
          <p className="text-[#666] mt-1">{t("quickOrder.subtitle")}</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-sm p-3 flex items-start gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> <span style={{ whiteSpace: "pre-line" }}>{error}</span>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Tabs */}
            <div className="flex border-b border-stone-200 mb-6">
              {[
                { key: "code" as const, label: t("quickOrder.byCode"), icon: Hash },
                { key: "list" as const, label: t("quickOrder.productList"), icon: List },
                { key: "csv" as const, label: t("quickOrder.uploadCsv"), icon: Upload },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all ${
                    activeTab === tab.key ? "border-black text-secondary" : "border-transparent text-[#666] hover:text-[#333]"
                  }`}
                >
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
            </div>

            {/* Tab: By Code */}
            {activeTab === "code" && (
              <div className="bg-white rounded-sm border border-stone-200 p-6">
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={codeInput}
                      onChange={(e) => handleCodeSearch(e.target.value)}
                      placeholder={t("quickOrder.searchPlaceholder")}
                      className="w-full px-4 py-3 border border-stone-200 rounded-sm text-sm focus:border-black"
                    />
                    {suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-stone-200 rounded-sm mt-1 shadow-lg z-10 max-h-60 overflow-y-auto">
                        {suggestions.map((s) => (
                          <button
                            key={s.code}
                            onClick={() => addByCode(s)}
                            className="w-full text-left px-4 py-3 hover:bg-stone-100 border-b border-[#f0f0f0] last:border-0"
                          >
                            <span className="text-xs font-mono text-secondary">{s.code}</span>
                            <span className="text-sm text-[#333] ml-2">{s.name}</span>
                            <span className="text-sm font-semibold text-black float-right">{s.price} RSD</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-[#666]">{t("quickOrder.quantity")}</label>
                    <div className="flex items-center border border-stone-200 rounded-sm">
                      <button onClick={() => setQtyInput(Math.max(1, qtyInput - 1))} className="px-3 py-2 hover:bg-stone-100"><Minus className="w-4 h-4" /></button>
                      <span className="px-3 py-2 text-sm font-medium min-w-[40px] text-center">{qtyInput}</span>
                      <button onClick={() => setQtyInput(qtyInput + 1)} className="px-3 py-2 hover:bg-stone-100"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-[#999]">{t("quickOrder.searchHint")}</p>
              </div>
            )}

            {/* Tab: CSV Upload */}
            {activeTab === "csv" && (
              <div className="bg-white rounded-sm border border-stone-200 p-6">
                {!csvResult ? (
                  <>
                    <div
                      className="border-2 border-dashed border-stone-200 rounded-sm p-12 text-center hover:border-black transition-colors cursor-pointer"
                      onClick={() => document.getElementById("csv-input")?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file) setCsvFile(file);
                      }}
                    >
                      <Upload className="w-12 h-12 text-secondary mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-[#333] mb-2">
                        {csvFile ? csvFile.name : t("quickOrder.dragCsvHere")}
                      </h3>
                      <p className="text-sm text-[#666] mb-4">{t("quickOrder.orClickToSelect")}</p>
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
                          className="px-6 py-2.5 bg-black text-white rounded-sm text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
                        >
                          {csvLoading ? t("quickOrder.processing") : t("quickOrder.upload")}
                        </button>
                      )}
                    </div>
                    <div className="mt-6 p-4 bg-stone-100 rounded-sm">
                      <p className="text-sm font-medium text-[#333] mb-2">{t("quickOrder.csvFormat")}</p>
                      <code className="text-xs text-[#666] font-mono block bg-white p-3 rounded border">
                        {t("quickOrder.csvHeaderExample")}<br />
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
                    <h3 className="text-lg font-semibold text-[#333] mb-2">{t("quickOrder.fileUploaded")}</h3>
                    <p className="text-sm text-[#666] mb-6">{t("quickOrder.foundOf")} {csvResult.summary.found} / {csvResult.summary.total}</p>
                    <div className="bg-stone-100 rounded-sm p-4 text-left max-w-sm mx-auto mb-6">
                      <div className="flex justify-between text-sm mb-1"><span className="text-[#666]">{t("quickOrder.found")}</span><span className="font-medium">{csvResult.summary.found} {t("quickOrder.items")}</span></div>
                      <div className="flex justify-between text-sm mb-1"><span className="text-[#666]">{t("quickOrder.totalValue")}</span><span className="font-medium">{csvResult.summary.totalValue?.toLocaleString()} RSD</span></div>
                      <div className="flex justify-between text-sm"><span className="text-[#666]">{t("quickOrder.unavailable")}</span><span className="font-medium text-orange-500">{csvResult.summary.notFound + csvResult.summary.outOfStock} {t("quickOrder.items")}</span></div>
                    </div>
                    <div className="flex gap-3 justify-center">
                      <button onClick={addCsvToOrder} className="px-6 py-2.5 bg-black hover:bg-stone-800 text-white text-sm font-medium rounded-sm transition-colors">{t("quickOrder.addAllToCart")}</button>
                      <button onClick={() => { setCsvResult(null); setCsvFile(null); }} className="px-6 py-2.5 border border-stone-200 text-[#666] text-sm font-medium rounded-sm hover:bg-stone-100 transition-colors">{t("common.cancel")}</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recent Orders */}
            {recentOrders.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-black mb-4">{t("quickOrder.repeatPrevious")}</h3>
                <div className="grid gap-3">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="bg-white rounded-sm border border-stone-200 p-4 flex items-center justify-between hover:shadow-sm transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-stone-100 rounded-sm flex items-center justify-center">
                          <FileText className="w-5 h-5 text-secondary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-[#333]">{order.orderNumber}</p>
                          <p className="text-xs text-[#999] flex items-center gap-1"><Clock className="w-3 h-3" /> {order.date} · {order.items} {t("quickOrder.items")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-sm">{order.total.toLocaleString()} RSD</span>
                        <button
                          onClick={() => handleRepeatOrder(order.id)}
                          disabled={repeatLoading === order.id}
                          className="flex items-center gap-1 px-4 py-2 border border-black text-secondary text-sm font-medium rounded-sm hover:bg-black hover:text-white transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${repeatLoading === order.id ? "animate-spin" : ""}`} /> {t("quickOrder.repeat")}
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
            <div className="bg-white rounded-sm border border-stone-200 p-6 sticky top-24">
              <h3 className="font-semibold text-black mb-4">{t("quickOrder.orderPreview")}</h3>
              {orderItems.length > 0 ? (
                <>
                  <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                    {orderItems.map((item) => (
                      <div key={item.productId} className="flex items-center justify-between text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono text-secondary">{item.code}</p>
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
                  <div className="border-t border-stone-200 pt-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-[#666]">{t("quickOrder.subtotal")}</span><span>{subtotal.toLocaleString()} RSD</span></div>
                    <div className="flex justify-between text-green-600"><span>{t("quickOrder.b2bDiscount")} ({B2B_BULK_DISCOUNT}%):</span><span>-{discount.toLocaleString()} RSD</span></div>
                    <div className="flex justify-between font-bold text-lg border-t border-stone-200 pt-2 mt-2">
                      <span>{t("quickOrder.total")}</span><span>{total.toLocaleString()} RSD</span>
                    </div>
                  </div>
                  <button onClick={handleOrder} className="w-full mt-6 py-3 bg-black hover:bg-stone-800 text-white font-medium rounded-sm transition-colors text-sm tracking-wide">
                    {t("quickOrder.placeOrder")}
                  </button>
                </>
              ) : (
                <p className="text-sm text-[#999] text-center py-8">{t("quickOrder.addProductsToOrder")}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
