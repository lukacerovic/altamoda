"use client";

import { useState, useEffect } from "react";
import { Cookie, ChevronDown, ChevronUp } from "lucide-react";

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

  useEffect(() => {
    const consent = localStorage.getItem("altamoda_cookie_consent");
    if (!consent) {
      // Small delay so the banner slides in after page load
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
      <div className="bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* Icon + Text */}
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-[#faf7f2] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Cookie className="w-5 h-5 text-[#c8a96e]" />
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Koristimo kolačiće za poboljšanje vašeg iskustva. Nastavkom korišćenja sajta,
                prihvatate našu{" "}
                <a href="#" className="text-[#c8a96e] hover:underline">
                  politiku kolačića
                </a>
                .
              </p>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:border-[#c8a96e] hover:text-[#c8a96e] transition-colors"
              >
                Podešavanja
                {showSettings ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={acceptAll}
                className="px-6 py-2.5 bg-[#c8a96e] hover:bg-[#a8894e] text-white rounded-lg text-sm font-medium transition-colors"
              >
                Prihvatam
              </button>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="mt-5 pt-5 border-t border-gray-100 animate-slideDown">
              <div className="grid gap-4 max-w-xl">
                {/* Necessary */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-[#1a1a1a]">Neophodni kolačići</span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Potrebni za osnovne funkcije sajta. Ne mogu se isključiti.
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
                      className="w-11 h-6 bg-[#c8a96e] rounded-full block cursor-not-allowed opacity-60"
                    >
                      <span className="absolute left-[22px] top-[2px] w-5 h-5 bg-white rounded-full shadow transition-transform" />
                    </label>
                  </div>
                </div>

                {/* Analytics */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-[#1a1a1a]">Analitički kolačići</span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Pomažu nam da razumemo kako koristite sajt.
                    </p>
                  </div>
                  <button
                    onClick={() => setSettings((s) => ({ ...s, analytics: !s.analytics }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      settings.analytics ? "bg-[#c8a96e]" : "bg-gray-300"
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
                    <span className="text-sm font-medium text-[#1a1a1a]">Marketing kolačići</span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Koriste se za prikazivanje relevantnih reklama.
                    </p>
                  </div>
                  <button
                    onClick={() => setSettings((s) => ({ ...s, marketing: !s.marketing }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      settings.marketing ? "bg-[#c8a96e]" : "bg-gray-300"
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
                  className="mt-2 px-6 py-2.5 bg-[#1a1a1a] hover:bg-[#333] text-white rounded-lg text-sm font-medium transition-colors self-start"
                >
                  Sačuvaj podešavanja
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
