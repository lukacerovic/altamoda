"use client";

import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";
import { useLanguage, languageLabels, languageFlags, type Language } from "@/lib/i18n/LanguageContext";

const languages: Language[] = ["sr", "en", "ru"];

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 hover:text-[#8c4a5a] transition-colors text-sm"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{languageFlags[language]} {language.toUpperCase()}</span>
        <span className="sm:hidden">{languageFlags[language]}</span>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-lg border border-[#e0d8cc] shadow-lg overflow-hidden z-[60] min-w-[140px] animate-fadeIn">
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => {
                setLanguage(lang);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                language === lang
                  ? "bg-[#f5f0e8] text-[#8c4a5a] font-medium"
                  : "text-[#2d2d2d] hover:bg-[#f5f0e8]"
              }`}
            >
              <span>{languageFlags[lang]}</span>
              <span>{languageLabels[lang]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
