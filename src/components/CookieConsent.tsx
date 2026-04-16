"use client";

import { useState, useEffect } from "react";
import { Cookie, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface CookieSettings {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<CookieSettings>({
    necessary: true,
    analytics: false,
    marketing: false,
  });
  const { t } = useLanguage();

  useEffect(() => {
    const consent = localStorage.getItem("altamoda_cookie_consent");
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptAll = () => {
    const allAccepted: CookieSettings = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    localStorage.setItem("altamoda_cookie_consent", JSON.stringify(allAccepted));
    setVisible(false);
  };

  const saveSettings = () => {
    localStorage.setItem("altamoda_cookie_consent", JSON.stringify(settings));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[55] animate-slideUp"
      style={{ animationDuration: "0.4s" }}
    >
      <div className="bg-white border-t border-[#D8CFBC]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-5">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* Icon + Text */}
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 rounded-sm bg-[#FFFBF4] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Cookie className="w-5 h-5 text-[#a5a995]" />
              </div>
              <p className="text-xs text-[#a5a995] leading-relaxed tracking-wide">
                {t("cookie.text")}{" "}
                <a href="#" className="text-[#11120D] hover:underline font-medium">
                  {t("cookie.cookiePolicy")}
                </a>
                .
              </p>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 border border-[#D8CFBC] text-[#11120D] rounded-sm text-xs font-bold uppercase tracking-widest hover:border-black hover:text-[#11120D] transition-colors"
              >
                {t("cookie.settings")}
                {showSettings ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={acceptAll}
                className="px-6 py-2.5 bg-black hover:bg-[#11120D] text-white rounded-sm text-xs font-bold uppercase tracking-widest transition-colors"
              >
                {t("cookie.acceptAll")}
              </button>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="mt-5 pt-5 border-t border-[#D8CFBC] animate-slideDown">
              <div className="grid gap-4 max-w-xl">
                {/* Necessary */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-[#11120D]">{t("cookie.necessaryCookies")}</span>
                    <p className="text-xs text-[#a5a995] mt-0.5">
                      {t("cookie.necessaryDesc")}
                    </p>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className="sr-only peer"
                      id="cookie-necessary"
                    />
                    <label
                      htmlFor="cookie-necessary"
                      className="w-11 h-6 bg-black rounded-full block cursor-not-allowed opacity-60"
                    >
                      <span className="absolute left-[22px] top-[2px] w-5 h-5 bg-white rounded-full shadow transition-transform" />
                    </label>
                  </div>
                </div>

                {/* Analytics */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-[#11120D]">{t("cookie.analyticsCookies")}</span>
                    <p className="text-xs text-[#a5a995] mt-0.5">
                      {t("cookie.analyticsDesc")}
                    </p>
                  </div>
                  <button
                    onClick={() => setSettings((s) => ({ ...s, analytics: !s.analytics }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      settings.analytics ? "bg-black" : "bg-[#D8CFBC]"
                    }`}
                  >
                    <span
                      className={`absolute top-[2px] w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        settings.analytics ? "left-[22px]" : "left-[2px]"
                      }`}
                    />
                  </button>
                </div>

                {/* Marketing */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-[#11120D]">{t("cookie.marketingCookies")}</span>
                    <p className="text-xs text-[#a5a995] mt-0.5">
                      {t("cookie.marketingDesc")}
                    </p>
                  </div>
                  <button
                    onClick={() => setSettings((s) => ({ ...s, marketing: !s.marketing }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      settings.marketing ? "bg-black" : "bg-[#D8CFBC]"
                    }`}
                  >
                    <span
                      className={`absolute top-[2px] w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        settings.marketing ? "left-[22px]" : "left-[2px]"
                      }`}
                    />
                  </button>
                </div>

                <button
                  onClick={saveSettings}
                  className="mt-2 px-6 py-2.5 bg-black hover:bg-[#11120D] text-white rounded-sm text-xs font-bold uppercase tracking-widest transition-colors self-start"
                >
                  {t("cookie.saveSettings")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
