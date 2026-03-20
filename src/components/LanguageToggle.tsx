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
        className="flex items-center gap-1.5 hover:opacity-70 transition-opacity text-xs uppercase tracking-widest text-stone-600"
      >
        <Globe className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{language.toUpperCase()}</span>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-sm border border-stone-200 shadow-lg overflow-hidden z-[60] min-w-[140px] animate-fadeIn">
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => {
                setLanguage(lang);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs uppercase tracking-wider transition-colors ${
                language === lang
                  ? "bg-stone-100 text-black font-bold"
                  : "text-stone-500 hover:bg-stone-50 hover:text-black"
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
