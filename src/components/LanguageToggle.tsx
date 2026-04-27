"use client";

import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";
import { useLanguage, languageLabels, languageFlags, type Language } from "@/lib/i18n/LanguageContext";

const languages: Language[] = ["sr", "en", "ru"];

export function LanguageToggle({ alignLeft = false }: { alignLeft?: boolean }) {
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
        className="flex items-center gap-1.5 hover:opacity-70 transition-opacity text-xs uppercase tracking-widest text-[#293133]/65"
      >
        <Globe className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{language.toUpperCase()}</span>
      </button>

      {open && (
        <div
          className={`absolute top-full mt-2 z-[60] bg-white rounded-sm border border-[#D8CFBC] shadow-lg overflow-hidden min-w-[140px] animate-fadeIn ${
            alignLeft ? "left-0" : "right-0"
          }`}
        >
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => {
                setLanguage(lang);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs uppercase tracking-wider transition-colors ${
                language === lang
                  ? "bg-[#FFFFFF] text-[#2e2e2e] font-bold"
                  : "text-[#293133]/65 hover:bg-[#FFFFFF] hover:text-[#2e2e2e]"
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
