"use client";

import { useState } from "react";
import {
  Settings,
  Truck,
  CreditCard,
  Bell,
  Building,
  Save,
  Globe,
  Mail,
  Phone,
  MapPin,
  Check,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface ToggleProps {
  enabled: boolean;
  onChange: () => void;
}

function Toggle({ enabled, onChange }: ToggleProps) {
  return (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? "bg-black" : "bg-gray-300"}`}
    >
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-5.5" : "translate-x-0.5"}`} />
    </button>
  );
}

export default function SettingsPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("general");
  const [saved, setSaved] = useState(false);

  const tabs = [
    { id: "general", label: t("admin.general"), icon: Settings },
    { id: "shipping", label: t("admin.delivery"), icon: Truck },
    { id: "payment", label: t("admin.paymentTab"), icon: CreditCard },
    { id: "notifications", label: t("admin.notificationsTab"), icon: Bell },
    { id: "b2b", label: t("admin.b2bTab"), icon: Building },
  ];

  // General settings
  const [storeName, setStoreName] = useState("Alta Moda");
  const [storeEmail, setStoreEmail] = useState("info@altamoda.rs");
  const [storePhone, setStorePhone] = useState("+381 11 123 4567");
  const [storeAddress, setStoreAddress] = useState("Knez Mihailova 10, Beograd");
  const [currency, setCurrency] = useState("RSD");
  const [language, setLanguage] = useState("sr");

  // Shipping settings
  const [freeShippingThreshold, setFreeShippingThreshold] = useState("5000");
  const [shippingZones, setShippingZones] = useState([
    { name: "Beograd", rate: "350", enabled: true },
    { name: "Vojvodina", rate: "450", enabled: true },
    { name: "Centralna Srbija", rate: "500", enabled: true },
    { name: "Južna Srbija", rate: "550", enabled: true },
    { name: "Kosovo i Metohija", rate: "650", enabled: false },
  ]);

  // Payment settings
  const [paymentMethods, setPaymentMethods] = useState([
    { nameKey: "creditDebitCard", descKey: "visaMastercard", enabled: true },
    { nameKey: "cashOnDelivery", descKey: "paymentOnPickup", enabled: true },
    { nameKey: "bankTransfer", descKey: "bankTransferDesc", enabled: true },
    { nameKey: "paypal", descKey: "onlinePayment", enabled: false },
    { nameKey: "citizenChecks", descKey: "installments", enabled: false },
  ]);

  // Notification settings
  const [notifications, setNotifications] = useState([
    { nameKey: "newOrder", descKey: "newOrderDesc", email: true, push: true },
    { nameKey: "orderCancelled", descKey: "orderCancelledDesc", email: true, push: false },
    { nameKey: "lowStock", descKey: "lowStockDesc", email: true, push: true },
    { nameKey: "newUser", descKey: "newUserDesc", email: false, push: true },
    { nameKey: "b2bRequest", descKey: "b2bRequestDesc", email: true, push: true },
    { nameKey: "productReview", descKey: "productReviewDesc", email: false, push: false },
  ]);

  // B2B settings
  const [b2bDiscount, setB2bDiscount] = useState("15");
  const [b2bMinOrder, setB2bMinOrder] = useState("10000");
  const [b2bAutoApprove, setB2bAutoApprove] = useState(false);
  const [b2bPaymentDays, setB2bPaymentDays] = useState("30");
  const [b2bRequirePib, setB2bRequirePib] = useState(true);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleShippingZone = (index: number) => {
    setShippingZones(shippingZones.map((z, i) => i === index ? { ...z, enabled: !z.enabled } : z));
  };

  const updateShippingRate = (index: number, rate: string) => {
    setShippingZones(shippingZones.map((z, i) => i === index ? { ...z, rate } : z));
  };

  const togglePayment = (index: number) => {
    setPaymentMethods(paymentMethods.map((p, i) => i === index ? { ...p, enabled: !p.enabled } : p));
  };

  const toggleNotifEmail = (index: number) => {
    setNotifications(notifications.map((n, i) => i === index ? { ...n, email: !n.email } : n));
  };

  const toggleNotifPush = (index: number) => {
    setNotifications(notifications.map((n, i) => i === index ? { ...n, push: !n.push } : n));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-black">{t("admin.settings")}</h1>
          <p className="text-sm text-[#666] mt-1">{t("admin.settingsDesc")}</p>
        </div>
        <button
          onClick={handleSave}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 self-start transition-all ${
            saved ? "bg-emerald-500 text-white" : "bg-black text-white hover:bg-stone-800"
          }`}
        >
          {saved ? <><Check size={18} /> {t("admin.saved")}</> : <><Save size={18} /> {t("admin.saveChanges")}</>}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs */}
        <div className="lg:w-56 flex-shrink-0">
          <div className="bg-white rounded-sm border border-stone-200 overflow-hidden">
            <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? "bg-black/10 text-secondary border-b-2 lg:border-b-0 lg:border-l-2 border-black"
                        : "text-[#666] hover:text-black hover:bg-stone-100"
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-sm border border-stone-200 p-6">
          {/* General */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-black mb-1">{t("admin.generalSettings")}</h2>
                <p className="text-sm text-[#666]">{t("admin.generalSettingsDesc")}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">
                    <Globe size={14} className="inline mr-1.5 text-[#999]" />
                    {t("admin.storeName")}
                  </label>
                  <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">
                    <Mail size={14} className="inline mr-1.5 text-[#999]" />
                    {t("admin.emailAddress")}
                  </label>
                  <input type="email" value={storeEmail} onChange={(e) => setStoreEmail(e.target.value)} className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">
                    <Phone size={14} className="inline mr-1.5 text-[#999]" />
                    {t("admin.phone")}
                  </label>
                  <input type="text" value={storePhone} onChange={(e) => setStorePhone(e.target.value)} className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">
                    <MapPin size={14} className="inline mr-1.5 text-[#999]" />
                    {t("admin.address")}
                  </label>
                  <input type="text" value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm" />
                </div>
              </div>

              <div className="pt-4 border-t border-[#f0f0f0]">
                <h3 className="text-sm font-semibold text-[#333] mb-4">{t("admin.localization")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-[#333] mb-1.5">{t("admin.currency")}</label>
                    <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm cursor-pointer">
                      <option value="RSD">{t("admin.rsd")}</option>
                      <option value="EUR">{t("admin.eur")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#333] mb-1.5">{t("admin.language")}</label>
                    <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm cursor-pointer">
                      <option value="sr">{t("admin.serbian")}</option>
                      <option value="en">{t("admin.english")}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Shipping */}
          {activeTab === "shipping" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-black mb-1">{t("admin.deliverySettings")}</h2>
                <p className="text-sm text-[#666]">{t("admin.deliverySettingsDesc")}</p>
              </div>

              <div className="p-4 rounded-lg bg-black/5 border border-black/20">
                <label className="block text-sm font-medium text-[#333] mb-1.5">{t("admin.freeShippingOver")}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={freeShippingThreshold}
                    onChange={(e) => setFreeShippingThreshold(e.target.value)}
                    className="w-32 px-4 py-2.5 border border-stone-200 rounded-lg text-sm"
                  />
                  <span className="text-sm text-[#666]">RSD</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#333] mb-4">{t("admin.shippingZones")}</h3>
                <div className="space-y-3">
                  {shippingZones.map((zone, i) => (
                    <div key={zone.name} className={`flex items-center justify-between p-4 rounded-lg border ${zone.enabled ? "border-stone-200 bg-white" : "border-[#f0f0f0] bg-stone-100"}`}>
                      <div className="flex items-center gap-4">
                        <Toggle enabled={zone.enabled} onChange={() => toggleShippingZone(i)} />
                        <span className={`text-sm font-medium ${zone.enabled ? "text-black" : "text-[#999]"}`}>{zone.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={zone.rate}
                          onChange={(e) => updateShippingRate(i, e.target.value)}
                          disabled={!zone.enabled}
                          className="w-20 px-3 py-1.5 border border-stone-200 rounded-lg text-sm text-right disabled:opacity-50 disabled:bg-stone-100"
                        />
                        <span className="text-xs text-[#999]">RSD</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Payment */}
          {activeTab === "payment" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-black mb-1">{t("admin.paymentMethods")}</h2>
                <p className="text-sm text-[#666]">{t("admin.paymentMethodsDesc")}</p>
              </div>

              <div className="space-y-3">
                {paymentMethods.map((method, i) => (
                  <div key={method.nameKey} className={`flex items-center justify-between p-5 rounded-lg border ${method.enabled ? "border-black/30 bg-black/5" : "border-stone-200 bg-white"}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${method.enabled ? "bg-black text-white" : "bg-stone-100 text-[#999]"}`}>
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${method.enabled ? "text-black" : "text-[#999]"}`}>{t(`admin.${method.nameKey}`)}</p>
                        <p className="text-xs text-[#999]">{t(`admin.${method.descKey}`)}</p>
                      </div>
                    </div>
                    <Toggle enabled={method.enabled} onChange={() => togglePayment(i)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-black mb-1">{t("admin.notificationSettings")}</h2>
                <p className="text-sm text-[#666]">{t("admin.notificationSettingsDesc")}</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-stone-200">
                      <th className="pb-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">{t("admin.notification")}</th>
                      <th className="pb-3 text-center text-xs font-semibold text-[#666] uppercase tracking-wider w-24">{t("admin.email")}</th>
                      <th className="pb-3 text-center text-xs font-semibold text-[#666] uppercase tracking-wider w-24">{t("admin.push")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0f0]">
                    {notifications.map((notif, i) => (
                      <tr key={notif.nameKey}>
                        <td className="py-4">
                          <p className="text-sm font-medium text-black">{t(`admin.${notif.nameKey}`)}</p>
                          <p className="text-xs text-[#999]">{t(`admin.${notif.descKey}`)}</p>
                        </td>
                        <td className="py-4 text-center">
                          <div className="flex justify-center">
                            <Toggle enabled={notif.email} onChange={() => toggleNotifEmail(i)} />
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <div className="flex justify-center">
                            <Toggle enabled={notif.push} onChange={() => toggleNotifPush(i)} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* B2B */}
          {activeTab === "b2b" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-black mb-1">{t("admin.b2bSettings")}</h2>
                <p className="text-sm text-[#666]">{t("admin.b2bSettingsDesc")}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">{t("admin.defaultDiscount")}</label>
                  <input type="number" value={b2bDiscount} onChange={(e) => setB2bDiscount(e.target.value)} className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm" />
                  <p className="text-xs text-[#999] mt-1">{t("admin.defaultDiscountDesc")}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">{t("admin.minOrder")}</label>
                  <input type="number" value={b2bMinOrder} onChange={(e) => setB2bMinOrder(e.target.value)} className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm" />
                  <p className="text-xs text-[#999] mt-1">{t("admin.minOrderDesc")}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">{t("admin.paymentTerms")}</label>
                  <input type="number" value={b2bPaymentDays} onChange={(e) => setB2bPaymentDays(e.target.value)} className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm" />
                  <p className="text-xs text-[#999] mt-1">{t("admin.paymentTermsDesc")}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#f0f0f0] space-y-4">
                <h3 className="text-sm font-semibold text-[#333]">{t("admin.automation")}</h3>

                <div className="flex items-center justify-between p-4 rounded-lg border border-stone-200">
                  <div>
                    <p className="text-sm font-medium text-black">{t("admin.autoApproveB2b")}</p>
                    <p className="text-xs text-[#999]">{t("admin.autoApproveDesc")}</p>
                  </div>
                  <Toggle enabled={b2bAutoApprove} onChange={() => setB2bAutoApprove(!b2bAutoApprove)} />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-stone-200">
                  <div>
                    <p className="text-sm font-medium text-black">{t("admin.requiredPib")}</p>
                    <p className="text-xs text-[#999]">{t("admin.requiredPibDesc")}</p>
                  </div>
                  <Toggle enabled={b2bRequirePib} onChange={() => setB2bRequirePib(!b2bRequirePib)} />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#2d2d2d] text-white">
                <h4 className="text-sm font-semibold text-secondary mb-2">{t("admin.b2bStats")}</h4>
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div>
                    <p className="text-lg sm:text-xl font-bold text-white">48</p>
                    <p className="text-[10px] sm:text-xs text-white/50">{t("admin.activeSalons")}</p>
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl font-bold text-white">2</p>
                    <p className="text-[10px] sm:text-xs text-white/50">{t("admin.pending")}</p>
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl font-bold text-secondary">15%</p>
                    <p className="text-[10px] sm:text-xs text-white/50">{t("admin.avgDiscount")}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
