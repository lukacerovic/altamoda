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

const tabs = [
  { id: "general", label: "Opšte", icon: Settings },
  { id: "shipping", label: "Dostava", icon: Truck },
  { id: "payment", label: "Plaćanje", icon: CreditCard },
  { id: "notifications", label: "Notifikacije", icon: Bell },
  { id: "b2b", label: "B2B", icon: Building },
];

interface ToggleProps {
  enabled: boolean;
  onChange: () => void;
}

function Toggle({ enabled, onChange }: ToggleProps) {
  return (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? "bg-[#8c4a5a]" : "bg-gray-300"}`}
    >
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-5.5" : "translate-x-0.5"}`} />
    </button>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [saved, setSaved] = useState(false);

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
    { name: "Kreditna/Debitna kartica", description: "Visa, Mastercard, Dina", enabled: true },
    { name: "Pouzeće", description: "Plaćanje pri preuzimanju", enabled: true },
    { name: "Virman", description: "Bankarski transfer za B2B", enabled: true },
    { name: "PayPal", description: "Online plaćanje", enabled: false },
    { name: "Čekovi građana", description: "Na rate", enabled: false },
  ]);

  // Notification settings
  const [notifications, setNotifications] = useState([
    { name: "Nova porudžbina", description: "Obaveštenje o novoj porudžbini", email: true, push: true },
    { name: "Porudžbina otkazana", description: "Obaveštenje o otkazanoj porudžbini", email: true, push: false },
    { name: "Nizak nivo zaliha", description: "Kada proizvod padne ispod minimuma", email: true, push: true },
    { name: "Novi korisnik", description: "Registracija novog korisnika", email: false, push: true },
    { name: "B2B zahtev", description: "Novi B2B zahtev za odobrenje", email: true, push: true },
    { name: "Recenzija proizvoda", description: "Nova recenzija na proizvodu", email: false, push: false },
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
          <h1 className="text-2xl font-serif font-bold text-[#2d2d2d]">Podešavanja</h1>
          <p className="text-sm text-[#666] mt-1">Upravljajte podešavanjima prodavnice</p>
        </div>
        <button
          onClick={handleSave}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 self-start transition-all ${
            saved ? "bg-emerald-500 text-white" : "btn-gold"
          }`}
        >
          {saved ? <><Check size={18} /> Sačuvano!</> : <><Save size={18} /> Sačuvaj Izmene</>}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs */}
        <div className="lg:w-56 flex-shrink-0">
          <div className="bg-white rounded-xl border border-[#e0d8cc] overflow-hidden">
            <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? "bg-[#8c4a5a]/10 text-[#8c4a5a] border-b-2 lg:border-b-0 lg:border-l-2 border-[#8c4a5a]"
                        : "text-[#666] hover:text-[#2d2d2d] hover:bg-[#f5f0e8]"
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
        <div className="flex-1 bg-white rounded-xl border border-[#e0d8cc] p-6">
          {/* General */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-[#2d2d2d] mb-1">Opšta Podešavanja</h2>
                <p className="text-sm text-[#666]">Osnovne informacije o prodavnici</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">
                    <Globe size={14} className="inline mr-1.5 text-[#999]" />
                    Naziv prodavnice
                  </label>
                  <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full px-4 py-2.5 border border-[#e0d8cc] rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">
                    <Mail size={14} className="inline mr-1.5 text-[#999]" />
                    Email adresa
                  </label>
                  <input type="email" value={storeEmail} onChange={(e) => setStoreEmail(e.target.value)} className="w-full px-4 py-2.5 border border-[#e0d8cc] rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">
                    <Phone size={14} className="inline mr-1.5 text-[#999]" />
                    Telefon
                  </label>
                  <input type="text" value={storePhone} onChange={(e) => setStorePhone(e.target.value)} className="w-full px-4 py-2.5 border border-[#e0d8cc] rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">
                    <MapPin size={14} className="inline mr-1.5 text-[#999]" />
                    Adresa
                  </label>
                  <input type="text" value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} className="w-full px-4 py-2.5 border border-[#e0d8cc] rounded-lg text-sm" />
                </div>
              </div>

              <div className="pt-4 border-t border-[#f0f0f0]">
                <h3 className="text-sm font-semibold text-[#333] mb-4">Lokalizacija</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-[#333] mb-1.5">Valuta</label>
                    <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-4 py-2.5 border border-[#e0d8cc] rounded-lg text-sm cursor-pointer">
                      <option value="RSD">RSD - Srpski dinar</option>
                      <option value="EUR">EUR - Evro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#333] mb-1.5">Jezik</label>
                    <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full px-4 py-2.5 border border-[#e0d8cc] rounded-lg text-sm cursor-pointer">
                      <option value="sr">Srpski</option>
                      <option value="en">English</option>
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
                <h2 className="text-lg font-semibold text-[#2d2d2d] mb-1">Podešavanja Dostave</h2>
                <p className="text-sm text-[#666]">Konfigurisanje zona i cena dostave</p>
              </div>

              <div className="p-4 rounded-lg bg-[#8c4a5a]/5 border border-[#8c4a5a]/20">
                <label className="block text-sm font-medium text-[#333] mb-1.5">Besplatna dostava za porudžbine preko:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={freeShippingThreshold}
                    onChange={(e) => setFreeShippingThreshold(e.target.value)}
                    className="w-32 px-4 py-2.5 border border-[#e0d8cc] rounded-lg text-sm"
                  />
                  <span className="text-sm text-[#666]">RSD</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#333] mb-4">Zone dostave</h3>
                <div className="space-y-3">
                  {shippingZones.map((zone, i) => (
                    <div key={zone.name} className={`flex items-center justify-between p-4 rounded-lg border ${zone.enabled ? "border-[#e0d8cc] bg-white" : "border-[#f0f0f0] bg-[#f5f0e8]"}`}>
                      <div className="flex items-center gap-4">
                        <Toggle enabled={zone.enabled} onChange={() => toggleShippingZone(i)} />
                        <span className={`text-sm font-medium ${zone.enabled ? "text-[#2d2d2d]" : "text-[#999]"}`}>{zone.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={zone.rate}
                          onChange={(e) => updateShippingRate(i, e.target.value)}
                          disabled={!zone.enabled}
                          className="w-20 px-3 py-1.5 border border-[#e0d8cc] rounded-lg text-sm text-right disabled:opacity-50 disabled:bg-[#f5f0e8]"
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
                <h2 className="text-lg font-semibold text-[#2d2d2d] mb-1">Načini Plaćanja</h2>
                <p className="text-sm text-[#666]">Omogućite ili onemogućite načine plaćanja</p>
              </div>

              <div className="space-y-3">
                {paymentMethods.map((method, i) => (
                  <div key={method.name} className={`flex items-center justify-between p-5 rounded-lg border ${method.enabled ? "border-[#8c4a5a]/30 bg-[#8c4a5a]/5" : "border-[#e0d8cc] bg-white"}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${method.enabled ? "bg-[#8c4a5a] text-white" : "bg-[#f5f0e8] text-[#999]"}`}>
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${method.enabled ? "text-[#2d2d2d]" : "text-[#999]"}`}>{method.name}</p>
                        <p className="text-xs text-[#999]">{method.description}</p>
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
                <h2 className="text-lg font-semibold text-[#2d2d2d] mb-1">Podešavanja Notifikacija</h2>
                <p className="text-sm text-[#666]">Konfigurisanje email i push obaveštenja</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#e0d8cc]">
                      <th className="pb-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">Obaveštenje</th>
                      <th className="pb-3 text-center text-xs font-semibold text-[#666] uppercase tracking-wider w-24">Email</th>
                      <th className="pb-3 text-center text-xs font-semibold text-[#666] uppercase tracking-wider w-24">Push</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0f0]">
                    {notifications.map((notif, i) => (
                      <tr key={notif.name}>
                        <td className="py-4">
                          <p className="text-sm font-medium text-[#2d2d2d]">{notif.name}</p>
                          <p className="text-xs text-[#999]">{notif.description}</p>
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
                <h2 className="text-lg font-semibold text-[#2d2d2d] mb-1">B2B Podešavanja</h2>
                <p className="text-sm text-[#666]">Konfigurisanje B2B uslova poslovanja</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">Podrazumevani popust (%)</label>
                  <input type="number" value={b2bDiscount} onChange={(e) => setB2bDiscount(e.target.value)} className="w-full px-4 py-2.5 border border-[#e0d8cc] rounded-lg text-sm" />
                  <p className="text-xs text-[#999] mt-1">Popust koji se primenjuje na sve B2B korisnike</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">Minimalna porudžbina (RSD)</label>
                  <input type="number" value={b2bMinOrder} onChange={(e) => setB2bMinOrder(e.target.value)} className="w-full px-4 py-2.5 border border-[#e0d8cc] rounded-lg text-sm" />
                  <p className="text-xs text-[#999] mt-1">Minimalan iznos za B2B porudžbine</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">Rok plaćanja (dana)</label>
                  <input type="number" value={b2bPaymentDays} onChange={(e) => setB2bPaymentDays(e.target.value)} className="w-full px-4 py-2.5 border border-[#e0d8cc] rounded-lg text-sm" />
                  <p className="text-xs text-[#999] mt-1">Broj dana za odloženo plaćanje</p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#f0f0f0] space-y-4">
                <h3 className="text-sm font-semibold text-[#333]">Automatizacija</h3>

                <div className="flex items-center justify-between p-4 rounded-lg border border-[#e0d8cc]">
                  <div>
                    <p className="text-sm font-medium text-[#2d2d2d]">Automatsko odobrenje B2B naloga</p>
                    <p className="text-xs text-[#999]">Novi B2B korisnici se automatski odobravaju bez ručne verifikacije</p>
                  </div>
                  <Toggle enabled={b2bAutoApprove} onChange={() => setB2bAutoApprove(!b2bAutoApprove)} />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-[#e0d8cc]">
                  <div>
                    <p className="text-sm font-medium text-[#2d2d2d]">Obavezno polje PIB</p>
                    <p className="text-xs text-[#999]">B2B korisnici moraju uneti PIB pri registraciji</p>
                  </div>
                  <Toggle enabled={b2bRequirePib} onChange={() => setB2bRequirePib(!b2bRequirePib)} />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#2d2d2d] text-white">
                <h4 className="text-sm font-semibold text-[#8c4a5a] mb-2">B2B Statistika</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xl font-bold text-white">48</p>
                    <p className="text-xs text-white/50">Aktivnih salona</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">2</p>
                    <p className="text-xs text-white/50">Na čekanju</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-[#8c4a5a]">15%</p>
                    <p className="text-xs text-white/50">Prosečan popust</p>
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
