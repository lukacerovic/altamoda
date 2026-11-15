"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFFFFF]" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const { t } = useLanguage();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(token ? "" : t("auth.resetLinkInvalid"));
  const [linkInvalid, setLinkInvalid] = useState(!token);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError(t("auth.errPasswordMin"));
    if (password !== confirm) return setError(t("auth.passwordsDontMatch"));

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setDone(true);
      } else {
        if (json.code === "auth.resetLinkInvalid") setLinkInvalid(true);
        setError(json.code ? t(json.code) : json.error || t("auth.genericError"));
      }
    } catch {
      setError(t("auth.genericError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <div className="max-w-lg mx-auto px-4 pt-10 pb-12 md:pb-20">
        <div className="bg-white rounded-sm shadow-sm overflow-hidden p-6 md:p-8">
          <h1 className="text-2xl font-bold text-[#1a1c1e] mb-3" style={{ fontFamily: "'Noto Serif', serif" }}>{t("auth.resetTitle")}</h1>

          {done ? (
            <div className="space-y-4">
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded">{t("auth.resetSuccess")}</div>
              <Link href="/account/login" className="block w-full text-center bg-[#edb4bd] hover:bg-[#413d3a] text-white py-3 rounded font-medium transition-colors">
                {t("auth.loginButton")}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!linkInvalid && <p className="text-sm text-[#1a1c1e]">{t("auth.resetIntro")}</p>}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {linkInvalid ? (
                <Link href="/account/login" className="block w-full text-center bg-[#edb4bd] hover:bg-[#413d3a] text-white py-3 rounded font-medium transition-colors">
                  {t("auth.backToLogin")}
                </Link>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[#1a1c1e] mb-1.5">{t("auth.newPassword")}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a1c1e]" />
                      <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-[#dddbd9] rounded pl-10 pr-10 py-3 text-sm" autoComplete="new-password" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1a1c1e]">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1a1c1e] mb-1.5">{t("auth.confirmPassword")}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a1c1e]" />
                      <input type={showPassword ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full border border-[#dddbd9] rounded pl-10 pr-4 py-3 text-sm" autoComplete="new-password" required />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-[#edb4bd] hover:bg-[#413d3a] text-white py-3 rounded font-medium transition-colors disabled:opacity-50">
                    {loading ? t("auth.savingNewPassword") : t("auth.saveNewPassword")}
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
