"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Search } from "lucide-react";

type Country = { code: string; name: string; dial: string; flag: string };

// Balkans first (primary market), then Europe alphabetical, then a handful
// of major non-EU markets. Order in the array drives display order.
const COUNTRIES: Country[] = [
  { code: "RS", name: "Srbija", dial: "+381", flag: "🇷🇸" },
  { code: "BA", name: "Bosna i Hercegovina", dial: "+387", flag: "🇧🇦" },
  { code: "HR", name: "Hrvatska", dial: "+385", flag: "🇭🇷" },
  { code: "ME", name: "Crna Gora", dial: "+382", flag: "🇲🇪" },
  { code: "MK", name: "Severna Makedonija", dial: "+389", flag: "🇲🇰" },
  { code: "SI", name: "Slovenija", dial: "+386", flag: "🇸🇮" },
  { code: "AL", name: "Albanija", dial: "+355", flag: "🇦🇱" },
  { code: "BG", name: "Bugarska", dial: "+359", flag: "🇧🇬" },
  { code: "RO", name: "Rumunija", dial: "+40", flag: "🇷🇴" },
  { code: "GR", name: "Grčka", dial: "+30", flag: "🇬🇷" },
  { code: "HU", name: "Mađarska", dial: "+36", flag: "🇭🇺" },
  { code: "AT", name: "Austrija", dial: "+43", flag: "🇦🇹" },
  { code: "BE", name: "Belgija", dial: "+32", flag: "🇧🇪" },
  { code: "CZ", name: "Češka", dial: "+420", flag: "🇨🇿" },
  { code: "DK", name: "Danska", dial: "+45", flag: "🇩🇰" },
  { code: "EE", name: "Estonija", dial: "+372", flag: "🇪🇪" },
  { code: "FI", name: "Finska", dial: "+358", flag: "🇫🇮" },
  { code: "FR", name: "Francuska", dial: "+33", flag: "🇫🇷" },
  { code: "DE", name: "Nemačka", dial: "+49", flag: "🇩🇪" },
  { code: "IE", name: "Irska", dial: "+353", flag: "🇮🇪" },
  { code: "IT", name: "Italija", dial: "+39", flag: "🇮🇹" },
  { code: "LV", name: "Letonija", dial: "+371", flag: "🇱🇻" },
  { code: "LT", name: "Litvanija", dial: "+370", flag: "🇱🇹" },
  { code: "LU", name: "Luksemburg", dial: "+352", flag: "🇱🇺" },
  { code: "MT", name: "Malta", dial: "+356", flag: "🇲🇹" },
  { code: "NL", name: "Holandija", dial: "+31", flag: "🇳🇱" },
  { code: "NO", name: "Norveška", dial: "+47", flag: "🇳🇴" },
  { code: "PL", name: "Poljska", dial: "+48", flag: "🇵🇱" },
  { code: "PT", name: "Portugalija", dial: "+351", flag: "🇵🇹" },
  { code: "ES", name: "Španija", dial: "+34", flag: "🇪🇸" },
  { code: "SE", name: "Švedska", dial: "+46", flag: "🇸🇪" },
  { code: "CH", name: "Švajcarska", dial: "+41", flag: "🇨🇭" },
  { code: "GB", name: "Velika Britanija", dial: "+44", flag: "🇬🇧" },
  { code: "TR", name: "Turska", dial: "+90", flag: "🇹🇷" },
  { code: "RU", name: "Rusija", dial: "+7", flag: "🇷🇺" },
  { code: "UA", name: "Ukrajina", dial: "+380", flag: "🇺🇦" },
  { code: "US", name: "Sjedinjene Države", dial: "+1", flag: "🇺🇸" },
  { code: "CA", name: "Kanada", dial: "+1", flag: "🇨🇦" },
  { code: "AU", name: "Australija", dial: "+61", flag: "🇦🇺" },
  { code: "CN", name: "Kina", dial: "+86", flag: "🇨🇳" },
  { code: "IN", name: "Indija", dial: "+91", flag: "🇮🇳" },
  { code: "JP", name: "Japan", dial: "+81", flag: "🇯🇵" },
  { code: "KR", name: "Južna Koreja", dial: "+82", flag: "🇰🇷" },
  { code: "AE", name: "UAE", dial: "+971", flag: "🇦🇪" },
  { code: "IL", name: "Izrael", dial: "+972", flag: "🇮🇱" },
];

const DEFAULT_COUNTRY = COUNTRIES[0];

// Match the longest dial-code prefix in the value. Several countries share
// "+1"; the first match wins, and the user can override via the dropdown.
function inferCountry(full: string): Country {
  if (!full) return DEFAULT_COUNTRY;
  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  return sorted.find((c) => full.startsWith(c.dial)) ?? DEFAULT_COUNTRY;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
}

export default function PhoneInput({ value, onChange, placeholder, required, id }: Props) {
  const [country, setCountry] = useState<Country>(() => inferCountry(value));
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const local = value.startsWith(country.dial)
    ? value.slice(country.dial.length)
    : value.replace(/^\+\d+/, "");

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleLocalChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    onChange(digits ? `${country.dial}${digits}` : "");
  };

  const handleSelectCountry = (c: Country) => {
    setCountry(c);
    setOpen(false);
    setSearch("");
    const digits = local.replace(/\D/g, "");
    onChange(digits ? `${c.dial}${digits}` : "");
  };

  const q = search.trim().toLowerCase();
  const filtered = q
    ? COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.dial.includes(q) ||
          c.code.toLowerCase().includes(q)
      )
    : COUNTRIES;

  return (
    <div ref={wrapperRef} className="relative flex gap-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 border border-[#D8CFBC] rounded px-3 py-3 text-sm hover:bg-[#FFFFFF] transition-colors shrink-0"
      >
        <span className="text-base leading-none">{country.flag}</span>
        <span className="text-[#2e2e2e] tabular-nums">{country.dial}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-[#837A64] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        value={local}
        onChange={(e) => handleLocalChange(e.target.value)}
        placeholder={placeholder || "64 0123456"}
        required={required}
        className="flex-1 min-w-0 border border-[#D8CFBC] rounded px-4 py-3 text-sm"
      />

      {open && (
        <div
          role="listbox"
          className="absolute top-full left-0 z-20 mt-1 w-72 max-w-[calc(100vw-2rem)] bg-white border border-[#D8CFBC] rounded shadow-lg max-h-72 flex flex-col"
        >
          <div className="p-2 border-b border-[#D8CFBC] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#837A64] pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pretraži državu…"
              className="w-full pl-8 pr-2 py-1.5 text-sm border border-[#D8CFBC] rounded focus:border-black focus:outline-none"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-[#837A64] text-center py-4">Nema rezultata</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleSelectCountry(c)}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-[#FFFFFF] transition-colors ${
                    c.code === country.code ? "bg-[#FFFFFF]" : ""
                  }`}
                >
                  <span className="text-base leading-none">{c.flag}</span>
                  <span className="flex-1 truncate text-[#2e2e2e]">{c.name}</span>
                  <span className="text-xs text-[#837A64] tabular-nums">{c.dial}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
