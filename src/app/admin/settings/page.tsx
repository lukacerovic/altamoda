"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings,
  Save,
  Globe,
  Mail,
  Phone,
  MapPin,
  Check,
  Lock,
  Share2,
  Eye,
  EyeOff,
  Loader2,
  Warehouse,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const SETTINGS_KEYS = [
  "storeName",
  "storeEmail",
  "storePhone",
  "storeAddress",
  "warehouseAddress",
  "instagram",
  "facebook",
  "tiktok",
];

export default function SettingsPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // General / contact settings
  const [storeName, setStoreName] = useState("");
  const [storeEmail, setStoreEmail] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [warehouseAddress, setWarehouseAddress] = useState("");

  // Social links
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");

  // Credentials
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const tabs = [
    { id: "general", label: t("admin.general"), icon: Settings },
    { id: "social", label: t("admin.socialLinksTab"), icon: Share2 },
    { id: "credentials", label: t("admin.credentialsTab"), icon: Lock },
  ];

  // Load settings from backend
  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/admin/site-settings?keys=${SETTINGS_KEYS.join(",")}`
      );
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        setStoreName(d.storeName || "");
        setStoreEmail(d.storeEmail || "");
        setStorePhone(d.storePhone || "");
        setStoreAddress(d.storeAddress || "");
        setWarehouseAddress(d.warehouseAddress || "");
        setInstagram(d.instagram || "");
        setFacebook(d.facebook || "");
        setTiktok(d.tiktok || "");
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Save general + social + hours settings
  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, string> = {
        storeName,
        storeEmail,
        storePhone,
        storeAddress,
        warehouseAddress,
        instagram,
        facebook,
        tiktok,
      };

      const res = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError(t("admin.passwordTooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t("admin.passwordMismatch"));
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      const json = await res.json();
      if (res.ok) {
        setPasswordSuccess(true);
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccess(false), 3000);
      } else {
        setPasswordError(json.error || "Greška");
      }
    } catch {
      setPasswordError("Greška pri promeni lozinke");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-black">
            {t("admin.settings")}
          </h1>
          <p className="text-sm text-[#666] mt-1">{t("admin.settingsDesc")}</p>
        </div>
        {activeTab !== "credentials" && (
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 self-start transition-all ${
              saved
                ? "bg-emerald-500 text-white"
                : saving
                  ? "bg-stone-400 text-white cursor-not-allowed"
                  : "bg-black text-white hover:bg-stone-800"
            }`}
          >
            {saved ? (
              <>
                <Check size={18} /> {t("admin.saved")}
              </>
            ) : saving ? (
              <>
                <Loader2 size={18} className="animate-spin" />{" "}
                {t("admin.saving")}
              </>
            ) : (
              <>
                <Save size={18} /> {t("admin.saveChanges")}
              </>
            )}
          </button>
        )}
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
          {/* General / Contact Info */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-black mb-1">
                  {t("admin.contactInfo")}
                </h2>
                <p className="text-sm text-[#666]">
                  {t("admin.contactInfoDesc")}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">
                    <Globe
                      size={14}
                      className="inline mr-1.5 text-[#999]"
                    />
                    {t("admin.storeName")}
                  </label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">
                    <Mail
                      size={14}
                      className="inline mr-1.5 text-[#999]"
                    />
                    {t("admin.emailAddress")}
                  </label>
                  <input
                    type="email"
                    value={storeEmail}
                    onChange={(e) => setStoreEmail(e.target.value)}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">
                    <Phone
                      size={14}
                      className="inline mr-1.5 text-[#999]"
                    />
                    {t("admin.phone")}
                  </label>
                  <input
                    type="text"
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">
                    <MapPin
                      size={14}
                      className="inline mr-1.5 text-[#999]"
                    />
                    {t("admin.address")}
                  </label>
                  <input
                    type="text"
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#f0f0f0]">
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">
                    <Warehouse
                      size={14}
                      className="inline mr-1.5 text-[#999]"
                    />
                    {t("admin.warehouseAddress")}
                  </label>
                  <input
                    type="text"
                    value={warehouseAddress}
                    onChange={(e) => setWarehouseAddress(e.target.value)}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Social Links */}
          {activeTab === "social" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-black mb-1">
                  {t("admin.socialLinks")}
                </h2>
                <p className="text-sm text-[#666]">
                  {t("admin.socialLinksDesc")}
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">
                    {t("admin.instagram")}
                  </label>
                  <input
                    type="url"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder={t("admin.instagramPlaceholder")}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">
                    {t("admin.facebook")}
                  </label>
                  <input
                    type="url"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    placeholder={t("admin.facebookPlaceholder")}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">
                    {t("admin.tiktok")}
                  </label>
                  <input
                    type="url"
                    value={tiktok}
                    onChange={(e) => setTiktok(e.target.value)}
                    placeholder={t("admin.tiktokPlaceholder")}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Credentials */}
          {activeTab === "credentials" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-black mb-1">
                  {t("admin.credentials")}
                </h2>
                <p className="text-sm text-[#666]">
                  {t("admin.credentialsDesc")}
                </p>
              </div>

              <div className="max-w-md space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">
                    {t("admin.newPassword")}
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#333]"
                    >
                      {showNewPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">
                    {t("admin.confirmPassword")}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm"
                  />
                </div>

                {passwordError && (
                  <p className="text-sm text-red-600">{passwordError}</p>
                )}

                {passwordSuccess && (
                  <p className="text-sm text-emerald-600 flex items-center gap-1.5">
                    <Check size={16} />
                    {t("admin.passwordChanged")}
                  </p>
                )}

                <button
                  onClick={handleChangePassword}
                  disabled={
                    changingPassword ||
                    !newPassword ||
                    !confirmPassword
                  }
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                    changingPassword ||
                    !newPassword ||
                    !confirmPassword
                      ? "bg-stone-300 text-stone-500 cursor-not-allowed"
                      : "bg-black text-white hover:bg-stone-800"
                  }`}
                >
                  {changingPassword ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {t("admin.saving")}
                    </>
                  ) : (
                    <>
                      <Lock size={18} />
                      {t("admin.changePassword")}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
