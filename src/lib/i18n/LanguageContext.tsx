"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import sr from "./translations/sr.json";
import en from "./translations/en.json";
import ru from "./translations/ru.json";

export type Language = "sr" | "en" | "ru";

const translations: Record<Language, Record<string, unknown>> = { sr, en, ru };

export const languageLabels: Record<Language, string> = {
  sr: "Srpski",
  en: "English",
  ru: "Русский",
};

export const languageFlags: Record<Language, string> = {
  sr: "🇷🇸",
  en: "🇬🇧",
  ru: "🇷🇺",
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === "object" && key in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path; // fallback: return the key itself
    }
  }
  return typeof current === "string" ? current : path;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("sr");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("altamoda_language") as Language | null;
    if (stored && translations[stored]) {
      setLanguageState(stored);
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("altamoda_language", lang);
  };

  const t = (key: string): string => {
    const value = getNestedValue(translations[language], key);
    if (value === key && language !== "sr") {
      // Fallback to Serbian if key not found in current language
      return getNestedValue(translations.sr, key);
    }
    return value;
  };

  // Prevent hydration mismatch: render with SR until mounted
  const contextValue: LanguageContextType = {
    language: mounted ? language : "sr",
    setLanguage,
    t: mounted ? t : (key: string) => getNestedValue(translations.sr, key),
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
