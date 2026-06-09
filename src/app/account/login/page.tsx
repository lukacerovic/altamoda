"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  User, Eye, EyeOff, Mail, Lock, Building2, Clock, X, AlertCircle,
} from "lucide-react";
import PhoneInput from "@/components/PhoneInput";
import Image from "next/image";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFFFFF]" />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/account";
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
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [forgotPasswordMsg, setForgotPasswordMsg] = useState(false);

  const logoSrc = "/altamoda-logoes/ALTAMODA LOGO BLACK.png";

  type FieldName =
    | "firstName" | "lastName" | "email" | "password" | "passwordConfirm"
    | "salonName" | "pib" | "maticniBroj" | "terms";
  type FieldErrors = Partial<Record<FieldName, string>>;
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function validateField(name: FieldName): string {
    switch (name) {
      case "firstName": {
        const v = regName.trim();
        if (!v) return t("auth.errRequired");
        if (v.length < 2) return t("auth.errFirstNameMin");
        return "";
      }
      case "lastName": {
        const v = regLastName.trim();
        if (!v) return t("auth.errRequired");
        if (v.length < 2) return t("auth.errLastNameMin");
        return "";
      }
      case "email": {
        const v = regEmail.trim();
        if (!v) return t("auth.errRequired");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return t("auth.errEmailInvalid");
        return "";
      }
      case "password": {
        if (!regPassword) return t("auth.errRequired");
        if (regPassword.length < 6) return t("auth.errPasswordMin");
        return "";
      }
      case "passwordConfirm": {
        if (!regPasswordConfirm) return t("auth.errRequired");
        if (regPasswordConfirm !== regPassword) return t("auth.passwordsDontMatch");
        return "";
      }
      case "salonName": {
        const v = regSalonName.trim();
        if (!v) return t("auth.errRequired");
        if (v.length < 2) return t("auth.errSalonNameMin");
        return "";
      }
      case "pib": {
        const v = regPib.trim();
        if (!v) return t("auth.errRequired");
        if (!/^\d+$/.test(v)) return t("auth.errPibDigitsOnly");
        if (v.length !== 9) return t("auth.errPibLength");
        return "";
      }
      case "maticniBroj": {
        const v = regMaticni.trim();
        if (!v) return t("auth.errRequired");
        if (!/^\d+$/.test(v)) return t("auth.errMaticniDigitsOnly");
        if (v.length !== 8) return t("auth.errMaticniLength");
        return "";
      }
      case "terms": {
        if (!regTerms) return t("auth.mustAcceptTerms");
        return "";
      }
    }
  }

  const handleBlur = (field: FieldName) => () => {
    const msg = validateField(field);
    setFieldErrors(prev => ({ ...prev, [field]: msg }));
  };
  const clearFieldError = (field: FieldName) => {
    if (fieldErrors[field]) setFieldErrors(prev => ({ ...prev, [field]: "" }));
  };
  const inputBorder = (field: FieldName) =>
    fieldErrors[field] ? "border-red-500 focus:border-red-500" : "border-[#dddbd9]";

  // Surface OAuth errors that arrive as ?error=… after a failed Google sign-in.
  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (!oauthError) return;
    if (oauthError === "OAuthB2bBlocked") {
      setError(t("auth.oauthB2bBlocked"));
    } else if (oauthError === "OAuthMissingEmail") {
      setError(t("auth.oauthMissingEmail"));
    } else if (oauthError === "AccountSuspended") {
      setError(t("auth.accountSuspended"));
    } else if (oauthError === "OAuthAccountNotLinked") {
      setError(t("auth.oauthAccountNotLinked"));
    } else {
      setError(t("auth.oauthGenericError"));
    }
    // Strip the error from the URL so a refresh doesn't redisplay it.
    router.replace("/account/login");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function handleGoogleSignIn() {
    setError("");
    setLoading(true);
    try {
      await signIn("google", { callbackUrl });
    } catch (err) {
      console.error("Google signIn threw:", err);
      setError(t("auth.oauthGenericError"));
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    let result: Awaited<ReturnType<typeof signIn>>;
    try {
      result = await signIn("credentials", {
        email: loginEmail,
        password: loginPassword,
        redirect: false,
      });
    } catch (err) {
      // NextAuth's signIn() can throw when the auth endpoint returns a
      // non-JSON / rate-limited response (e.g. 429). In that case we'd
      // otherwise leak `TypeError: Failed to construct 'URL'` to the user.
      console.error("signIn threw:", err);
      const msg = err instanceof Error ? err.message : String(err);
      if (/URL/i.test(msg) || /fetch/i.test(msg)) {
        setError(t("auth.rateLimited"));
      } else {
        setError(t("auth.wrongCredentials"));
      }
      setLoginEmail("");
      setLoginPassword("");
      setLoading(false);
      return;
    }

    if (result?.error) {
      // Check if the user account is pending approval
      try {
        const res = await fetch("/api/users/check-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: loginEmail }),
        });
        const data = await res.json();
        if (data.data?.status === "pending") {
          setShowPendingModal(true);
          setLoading(false);
          return;
        }
        if (data.data?.status === "suspended") {
          setError(t("auth.accountSuspended"));
          setLoginEmail("");
          setLoginPassword("");
          setLoading(false);
          return;
        }
      } catch {
        // Ignore check-status errors, fall through to generic message
      }
      setError(t("auth.wrongCredentials"));
      setLoginEmail("");
      setLoginPassword("");
      setLoading(false);
    } else {
      setLoading(false);
      router.push(callbackUrl);
      router.refresh();
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const fieldsToCheck: FieldName[] = [
      "firstName", "lastName", "email", "password", "passwordConfirm", "terms",
    ];
    if (registerType === "b2b") {
      fieldsToCheck.push("salonName", "pib", "maticniBroj");
    }

    const errors: FieldErrors = {};
    for (const f of fieldsToCheck) {
      const msg = validateField(f);
      if (msg) errors[f] = msg;
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
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
          router.push(callbackUrl);
          router.refresh();
        }
      }
    } catch {
      setError(t("auth.registrationErrorRetry"));
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <Link href="/" className="absolute left-1/2 -translate-x-1/2 block">
        <Image src={logoSrc} alt="Alta Moda" width={626} height={201} className="h-13 xl:h-15 w-auto" unoptimized />
      </Link>
      <div className="max-w-lg mx-auto px-4 py-12 md:py-20">
        {/* Card */}
        <div className="bg-white rounded-sm shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-[#dddbd9]">
            <button onClick={() => { setActiveTab("login"); setError(""); setSuccess(""); setFieldErrors({}); }} className={`flex-1 py-4 text-sm font-semibold text-center transition-colors ${activeTab === "login" ? "text-[#c19742] border-b-2 border-black" : "text-[#1a1c1e] hover:text-[#1a1c1e]"}`}>{t("auth.login")}</button>
            <button onClick={() => { setActiveTab("register"); setError(""); setSuccess(""); setFieldErrors({}); }} className={`flex-1 py-4 text-sm font-semibold text-center transition-colors ${activeTab === "register" ? "text-[#c19742] border-b-2 border-black" : "text-[#1a1c1e] hover:text-[#1a1c1e]"}`}>{t("auth.register")}</button>
          </div>

          <div className="p-6 md:p-8">
            {/* Success message (inline — only shows after B2B registration) */}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded">
                {success}
              </div>
            )}

            {activeTab === "login" ? (
              /* LOGIN FORM */
              <form onSubmit={handleLogin}>
                <Link href="/" className="inline-block mb-6 hover:opacity-70 transition-opacity">
                  <h2 className="text-2xl font-bold text-[#1a1c1e]" style={{ fontFamily: "'Noto Serif', serif" }}>{t("auth.welcomeBack")}</h2>
                </Link>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1a1c1e] mb-1.5">{t("auth.emailAddress")}</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a1c1e]" />
                      <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="vas@email.com" className="w-full border border-[#dddbd9] rounded pl-10 pr-4 py-3 text-sm" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1a1c1e] mb-1.5">{t("auth.password")}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a1c1e]" />
                      <input type={showPassword ? "text" : "password"} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder={t("auth.enterPassword")} className="w-full border border-[#dddbd9] rounded pl-10 pr-10 py-3 text-sm" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1a1c1e] hover:text-[#1a1c1e]">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-[#1a1c1e] cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-[#dddbd9] text-[#c19742] focus:ring-[#1a1c1e]" /> {t("auth.rememberMe")}
                    </label>
                    <button type="button" onClick={(e) => { e.preventDefault(); setForgotPasswordMsg(true); setTimeout(() => setForgotPasswordMsg(false), 3000); }} className="text-sm text-[#c19742] hover:text-[#1a1c1e]">{t("auth.forgotPassword")}</button>
                  </div>
                  {forgotPasswordMsg && (
                    <div className="p-3 bg-[#FFFFFF] border border-[#dddbd9] text-[#1a1c1e] text-sm rounded">
                      Funkcija resetovanja lozinke uskoro dolazi.
                    </div>
                  )}
                  <button type="submit" disabled={loading} className="w-full bg-[#c19742] hover:bg-[#413d3a] text-white py-3 rounded font-medium transition-colors disabled:opacity-50">
                    {loading ? t("auth.loggingIn") : t("auth.loginButton")}
                  </button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-[#FFFFFF]" />
                  <span className="text-xs text-[#1a1c1e]">{t("auth.orLoginWith")}</span>
                  <div className="flex-1 h-px bg-[#FFFFFF]" />
                </div>

                {/* Social login */}
                <div className="flex gap-3">
                  <button type="button" disabled={loading} className="flex-1 flex items-center justify-center gap-2 border border-[#dddbd9] rounded py-2.5 text-sm font-medium text-[#1a1c1e] hover:bg-[#FFFFFF] transition-colors disabled:opacity-50" onClick={handleGoogleSignIn}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    {t("auth.continueWithGoogle")}
                  </button>
                  <button type="button" className="flex-1 flex items-center justify-center gap-2 border border-[#dddbd9] rounded py-2.5 text-sm font-medium text-[#1a1c1e] hover:bg-[#FFFFFF] transition-colors" onClick={() => alert(t("auth.comingSoon"))}>
                    <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Facebook
                  </button>
                </div>
              </form>
            ) : (
              /* REGISTER FORM */
              <form onSubmit={handleRegister} noValidate>
                <h2 className="text-2xl font-bold text-[#1a1c1e] mb-4" style={{ fontFamily: "'Noto Serif', serif" }}>{t("auth.createAccount")}</h2>

                {Object.values(fieldErrors).some(Boolean) && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{t("auth.errFormFix")}</span>
                  </div>
                )}

                {/* B2C / B2B toggle */}
                <div className="flex gap-2 mb-6">
                  <button type="button" onClick={() => { setRegisterType("b2c"); setFieldErrors({}); }} className={`flex-1 py-2.5 rounded text-sm font-medium transition-colors ${registerType === "b2c" ? "bg-[#c19742] text-white" : "border border-[#dddbd9] text-[#1a1c1e] hover:border-black"}`}>
                    <User className="w-4 h-4 inline mr-1" /> {t("auth.buyer")}
                  </button>
                  <button type="button" onClick={() => { setRegisterType("b2b"); setFieldErrors({}); }} className={`flex-1 py-2.5 rounded text-sm font-medium transition-colors ${registerType === "b2b" ? "bg-[#c19742] text-white" : "border border-[#dddbd9] text-[#1a1c1e] hover:border-black"}`}>
                    <Building2 className="w-4 h-4 inline mr-1" /> {t("auth.salonB2b")}
                  </button>
                </div>

                {/* Google sign-up — B2C only. B2B registrations require admin approval and must use email + password. */}
                {registerType === "b2c" ? (
                  <>
                    <button type="button" disabled={loading} onClick={handleGoogleSignIn} className="w-full flex items-center justify-center gap-2 border border-[#dddbd9] rounded py-2.5 text-sm font-medium text-[#1a1c1e] hover:bg-[#FFFFFF] transition-colors disabled:opacity-50 mb-6">
                      <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                      {t("auth.continueWithGoogle")}
                    </button>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex-1 h-px bg-[#dddbd9]" />
                      <span className="text-xs text-[#1a1c1e]">{t("auth.orRegisterWithEmail")}</span>
                      <div className="flex-1 h-px bg-[#dddbd9]" />
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-[#1a1c1e] text-center mb-4">{t("auth.b2bMustUseEmail")}</p>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-[#1a1c1e] mb-1.5">{t("auth.firstName")}</label>
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => { setRegName(e.target.value); clearFieldError("firstName"); }}
                        onBlur={handleBlur("firstName")}
                        placeholder={t("auth.firstNamePlaceholder")}
                        className={`w-full border rounded px-4 py-3 text-sm ${inputBorder("firstName")}`}
                        aria-invalid={!!fieldErrors.firstName}
                      />
                      {fieldErrors.firstName && <p className="mt-1 text-xs text-red-600">{fieldErrors.firstName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1a1c1e] mb-1.5">{t("auth.lastName")}</label>
                      <input
                        type="text"
                        value={regLastName}
                        onChange={(e) => { setRegLastName(e.target.value); clearFieldError("lastName"); }}
                        onBlur={handleBlur("lastName")}
                        placeholder={t("auth.lastNamePlaceholder")}
                        className={`w-full border rounded px-4 py-3 text-sm ${inputBorder("lastName")}`}
                        aria-invalid={!!fieldErrors.lastName}
                      />
                      {fieldErrors.lastName && <p className="mt-1 text-xs text-red-600">{fieldErrors.lastName}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1a1c1e] mb-1.5">{t("auth.emailAddress")}</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => { setRegEmail(e.target.value); clearFieldError("email"); }}
                      onBlur={handleBlur("email")}
                      placeholder="vas@email.com"
                      className={`w-full border rounded px-4 py-3 text-sm ${inputBorder("email")}`}
                      aria-invalid={!!fieldErrors.email}
                    />
                    {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1a1c1e] mb-1.5">{t("auth.phonePlaceholder")}</label>
                    <PhoneInput value={regPhone} onChange={setRegPhone} placeholder="64 0123456" />
                  </div>

                  {registerType === "b2b" && (
                    <>
                      <div className="border-t border-[#dddbd9] pt-4">
                        <h3 className="text-sm font-semibold text-[#1a1c1e] mb-3 flex items-center gap-2"><Building2 className="w-4 h-4 text-[#c19742]" /> {t("auth.salonDetails")}</h3>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#1a1c1e] mb-1.5">{t("auth.salonName")}</label>
                        <input
                          type="text"
                          value={regSalonName}
                          onChange={(e) => { setRegSalonName(e.target.value); clearFieldError("salonName"); }}
                          onBlur={handleBlur("salonName")}
                          placeholder={t("auth.salonNamePlaceholder")}
                          className={`w-full border rounded px-4 py-3 text-sm ${inputBorder("salonName")}`}
                          aria-invalid={!!fieldErrors.salonName}
                        />
                        {fieldErrors.salonName && <p className="mt-1 text-xs text-red-600">{fieldErrors.salonName}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#1a1c1e] mb-1.5">{t("auth.pib")}</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={9}
                          value={regPib}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");
                            setRegPib(value);
                            clearFieldError("pib");
                          }}
                          onBlur={handleBlur("pib")}
                          placeholder={t("auth.pibPlaceholder")}
                          className={`w-full border rounded px-4 py-3 text-sm ${inputBorder("pib")}`}
                          aria-invalid={!!fieldErrors.pib}
                        />
                        {fieldErrors.pib && <p className="mt-1 text-xs text-red-600">{fieldErrors.pib}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#1a1c1e] mb-1.5">{t("auth.maticniBroj")}</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={8}
                            value={regMaticni}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "");
                              setRegMaticni(value);
                              clearFieldError("maticniBroj");
                            }}
                            onBlur={handleBlur("maticniBroj")}
                            placeholder={t("auth.maticniBrojPlaceholder")}
                            className={`w-full border rounded px-4 py-3 text-sm ${inputBorder("maticniBroj")}`}
                            aria-invalid={!!fieldErrors.maticniBroj}
                          />
                        {fieldErrors.maticniBroj && <p className="mt-1 text-xs text-red-600">{fieldErrors.maticniBroj}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#1a1c1e] mb-1.5">{t("auth.salonAddress")}</label>
                        <input type="text" value={regAddress} onChange={(e) => setRegAddress(e.target.value)} placeholder={t("auth.salonAddressPlaceholder")} className="w-full border border-[#dddbd9] rounded px-4 py-3 text-sm" />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-[#1a1c1e] mb-1.5">{t("auth.password")}</label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => { setRegPassword(e.target.value); clearFieldError("password"); clearFieldError("passwordConfirm"); }}
                      onBlur={handleBlur("password")}
                      placeholder={t("auth.passwordPlaceholder")}
                      className={`w-full border rounded px-4 py-3 text-sm ${inputBorder("password")}`}
                      aria-invalid={!!fieldErrors.password}
                    />
                    {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1a1c1e] mb-1.5">{t("auth.confirmPassword")}</label>
                    <input
                      type="password"
                      value={regPasswordConfirm}
                      onChange={(e) => { setRegPasswordConfirm(e.target.value); clearFieldError("passwordConfirm"); }}
                      onBlur={handleBlur("passwordConfirm")}
                      placeholder={t("auth.confirmPasswordPlaceholder")}
                      className={`w-full border rounded px-4 py-3 text-sm ${inputBorder("passwordConfirm")}`}
                      aria-invalid={!!fieldErrors.passwordConfirm}
                    />
                    {fieldErrors.passwordConfirm && <p className="mt-1 text-xs text-red-600">{fieldErrors.passwordConfirm}</p>}
                  </div>

                  <div>
                    <label className="flex items-start gap-2 text-sm text-[#1a1c1e] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={regTerms}
                        onChange={(e) => { setRegTerms(e.target.checked); clearFieldError("terms"); }}
                        className={`w-4 h-4 rounded text-[#c19742] focus:ring-[#1a1c1e] mt-0.5 ${fieldErrors.terms ? "border-red-500" : "border-[#dddbd9]"}`}
                        aria-invalid={!!fieldErrors.terms}
                      />
                      <span>{t("auth.agreeTerms")} <a href="#" className="text-[#c19742] hover:underline">{t("auth.termsOfUse")}</a> {t("auth.and")} <a href="#" className="text-[#c19742] hover:underline">{t("auth.privacyPolicy")}</a></span>
                    </label>
                    {fieldErrors.terms && <p className="mt-1 text-xs text-red-600">{fieldErrors.terms}</p>}
                  </div>

                  <button type="submit" disabled={loading} className="w-full bg-[#c19742] hover:bg-[#413d3a] text-white py-3 rounded font-medium transition-colors disabled:opacity-50">
                    {loading ? t("auth.processing") : registerType === "b2b" ? t("auth.submitB2b") : t("auth.registerButton")}
                  </button>

                  {registerType === "b2b" && (
                    <p className="text-xs text-[#1a1c1e] text-center">{t("auth.b2bNotice")}</p>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Error Modal */}
      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6">
              <div className="flex justify-end">
                <button onClick={() => setError("")} className="p-1 text-[#1a1c1e] hover:text-[#1a1c1e]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="text-center mt-2">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-[#1a1c1e] mb-2" style={{ fontFamily: "'Noto Serif', serif" }}>
                  {t("auth.errorTitle")}
                </h3>
                <p className="text-sm text-[#1a1c1e] leading-relaxed">
                  {error}
                </p>
              </div>
              <button
                onClick={() => setError("")}
                className="w-full mt-6 bg-[#c19742] hover:bg-[#413d3a] text-white py-3 rounded font-medium transition-colors"
              >
                {t("auth.understood")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending B2B Approval Modal */}
      {showPendingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6">
              <div className="flex justify-end">
                <button onClick={() => setShowPendingModal(false)} className="p-1 text-[#1a1c1e] hover:text-[#1a1c1e]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="text-center mt-2">
                <div className="w-16 h-16 rounded-full bg-[#FFFFFF] flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-[#1a1c1e]" />
                </div>
                <h3 className="text-xl font-bold text-[#1a1c1e] mb-2" style={{ fontFamily: "'Noto Serif', serif" }}>
                  {t("auth.pendingTitle")}
                </h3>
                <p className="text-sm text-[#1a1c1e] leading-relaxed">
                  {t("auth.pendingMessage")}
                </p>
              </div>
              <button
                onClick={() => setShowPendingModal(false)}
                className="w-full mt-6 bg-[#c19742] hover:bg-[#413d3a] text-white py-3 rounded font-medium transition-colors"
              >
                {t("auth.understood")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
