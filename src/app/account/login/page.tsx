"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  User, Eye, EyeOff, Mail, Lock, Building2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [registerType, setRegisterType] = useState<"b2c" | "b2b">("b2c");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [regName, setRegName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPasswordConfirm, setRegPasswordConfirm] = useState("");
  const [regSalonName, setRegSalonName] = useState("");
  const [regPib, setRegPib] = useState("");
  const [regMaticni, setRegMaticni] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regTerms, setRegTerms] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email: loginEmail,
      password: loginPassword,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(t("auth.wrongCredentials"));
    } else {
      router.push("/account");
      router.refresh();
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!regTerms) {
      setError(t("auth.mustAcceptTerms"));
      return;
    }

    if (regPassword !== regPasswordConfirm) {
      setError(t("auth.passwordsDontMatch"));
      return;
    }

    setLoading(true);

    const body: Record<string, string> = {
      name: `${regName} ${regLastName}`.trim(),
      email: regEmail,
      password: regPassword,
      phone: regPhone,
    };

    if (registerType === "b2b") {
      body.salonName = regSalonName;
      body.pib = regPib;
      body.maticniBroj = regMaticni;
      body.address = regAddress;
    }

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("auth.registrationError"));
        setLoading(false);
        return;
      }

      if (registerType === "b2b") {
        setSuccess(t("auth.b2bRequestReceived"));
        setLoading(false);
      } else {
        // Auto-login for B2C
        const result = await signIn("credentials", {
          email: regEmail,
          password: regPassword,
          redirect: false,
        });
        setLoading(false);
        if (!result?.error) {
          router.push("/account");
          router.refresh();
        }
      }
    } catch {
      setError(t("auth.registrationErrorRetry"));
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-100">
      <div className="max-w-lg mx-auto px-4 py-12 md:py-20">
        {/* Card */}
        <div className="bg-white rounded-sm shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button onClick={() => { setActiveTab("login"); setError(""); setSuccess(""); }} className={`flex-1 py-4 text-sm font-semibold text-center transition-colors ${activeTab === "login" ? "text-secondary border-b-2 border-black" : "text-gray-400 hover:text-gray-600"}`}>{t("auth.login")}</button>
            <button onClick={() => { setActiveTab("register"); setError(""); setSuccess(""); }} className={`flex-1 py-4 text-sm font-semibold text-center transition-colors ${activeTab === "register" ? "text-secondary border-b-2 border-black" : "text-gray-400 hover:text-gray-600"}`}>{t("auth.register")}</button>
          </div>

          <div className="p-6 md:p-8">
            {/* Error/Success messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded">
                {success}
              </div>
            )}

            {activeTab === "login" ? (
              /* LOGIN FORM */
              <form onSubmit={handleLogin}>
                <h2 className="text-2xl font-bold text-black mb-6" style={{ fontFamily: "'Noto Serif', serif" }}>{t("auth.welcomeBack")}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("auth.emailAddress")}</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="vas@email.com" className="w-full border border-gray-200 rounded pl-10 pr-4 py-3 text-sm" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("auth.password")}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type={showPassword ? "text" : "password"} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder={t("auth.enterPassword")} className="w-full border border-gray-200 rounded pl-10 pr-10 py-3 text-sm" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-secondary focus:ring-black" /> {t("auth.rememberMe")}
                    </label>
                    <a href="#" className="text-sm text-secondary hover:text-black">{t("auth.forgotPassword")}</a>
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-black hover:bg-stone-800 text-white py-3 rounded font-medium transition-colors disabled:opacity-50">
                    {loading ? t("auth.loggingIn") : t("auth.loginButton")}
                  </button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-400">{t("auth.orLoginWith")}</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                {/* Social login */}
                <div className="flex gap-3">
                  <button type="button" className="flex-1 flex items-center justify-center gap-2 border border-gray-200 rounded py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors" onClick={() => alert(t("auth.comingSoon"))}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Google
                  </button>
                  <button type="button" className="flex-1 flex items-center justify-center gap-2 border border-gray-200 rounded py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors" onClick={() => alert(t("auth.comingSoon"))}>
                    <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Facebook
                  </button>
                </div>
              </form>
            ) : (
              /* REGISTER FORM */
              <form onSubmit={handleRegister}>
                <h2 className="text-2xl font-bold text-black mb-4" style={{ fontFamily: "'Noto Serif', serif" }}>{t("auth.createAccount")}</h2>

                {/* B2C / B2B toggle */}
                <div className="flex gap-2 mb-6">
                  <button type="button" onClick={() => setRegisterType("b2c")} className={`flex-1 py-2.5 rounded text-sm font-medium transition-colors ${registerType === "b2c" ? "bg-black text-white" : "border border-gray-200 text-gray-600 hover:border-black"}`}>
                    <User className="w-4 h-4 inline mr-1" /> {t("auth.buyer")}
                  </button>
                  <button type="button" onClick={() => setRegisterType("b2b")} className={`flex-1 py-2.5 rounded text-sm font-medium transition-colors ${registerType === "b2b" ? "bg-black text-white" : "border border-gray-200 text-gray-600 hover:border-black"}`}>
                    <Building2 className="w-4 h-4 inline mr-1" /> {t("auth.salonB2b")}
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("auth.firstName")}</label>
                      <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} placeholder={t("auth.firstNamePlaceholder")} className="w-full border border-gray-200 rounded px-4 py-3 text-sm" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("auth.lastName")}</label>
                      <input type="text" value={regLastName} onChange={(e) => setRegLastName(e.target.value)} placeholder={t("auth.lastNamePlaceholder")} className="w-full border border-gray-200 rounded px-4 py-3 text-sm" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("auth.emailAddress")}</label>
                    <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="vas@email.com" className="w-full border border-gray-200 rounded px-4 py-3 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("auth.phonePlaceholder")}</label>
                    <input type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} placeholder="+381 6x xxx xxxx" className="w-full border border-gray-200 rounded px-4 py-3 text-sm" />
                  </div>

                  {registerType === "b2b" && (
                    <>
                      <div className="border-t border-gray-100 pt-4">
                        <h3 className="text-sm font-semibold text-black mb-3 flex items-center gap-2"><Building2 className="w-4 h-4 text-secondary" /> {t("auth.salonDetails")}</h3>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("auth.salonName")}</label>
                        <input type="text" value={regSalonName} onChange={(e) => setRegSalonName(e.target.value)} placeholder={t("auth.salonNamePlaceholder")} className="w-full border border-gray-200 rounded px-4 py-3 text-sm" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("auth.pib")}</label>
                        <input type="text" value={regPib} onChange={(e) => setRegPib(e.target.value)} placeholder={t("auth.pibPlaceholder")} className="w-full border border-gray-200 rounded px-4 py-3 text-sm" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("auth.maticniBroj")}</label>
                        <input type="text" value={regMaticni} onChange={(e) => setRegMaticni(e.target.value)} placeholder={t("auth.maticniBrojPlaceholder")} className="w-full border border-gray-200 rounded px-4 py-3 text-sm" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("auth.salonAddress")}</label>
                        <input type="text" value={regAddress} onChange={(e) => setRegAddress(e.target.value)} placeholder={t("auth.salonAddressPlaceholder")} className="w-full border border-gray-200 rounded px-4 py-3 text-sm" />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("auth.password")}</label>
                    <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder={t("auth.passwordPlaceholder")} className="w-full border border-gray-200 rounded px-4 py-3 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("auth.confirmPassword")}</label>
                    <input type="password" value={regPasswordConfirm} onChange={(e) => setRegPasswordConfirm(e.target.value)} placeholder={t("auth.confirmPasswordPlaceholder")} className="w-full border border-gray-200 rounded px-4 py-3 text-sm" required />
                  </div>

                  <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={regTerms} onChange={(e) => setRegTerms(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-secondary focus:ring-black mt-0.5" />
                    <span>{t("auth.agreeTerms")} <a href="#" className="text-secondary hover:underline">{t("auth.termsOfUse")}</a> {t("auth.and")} <a href="#" className="text-secondary hover:underline">{t("auth.privacyPolicy")}</a></span>
                  </label>

                  <button type="submit" disabled={loading} className="w-full bg-black hover:bg-stone-800 text-white py-3 rounded font-medium transition-colors disabled:opacity-50">
                    {loading ? t("auth.processing") : registerType === "b2b" ? t("auth.submitB2b") : t("auth.registerButton")}
                  </button>

                  {registerType === "b2b" && (
                    <p className="text-xs text-gray-400 text-center">{t("auth.b2bNotice")}</p>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
