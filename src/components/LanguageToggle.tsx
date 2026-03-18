"use client";

import { useState, useEffect } from "react";
import { Globe } from "lucide-react";

export function LanguageToggle() {
  const [script, setScript] = useState<"LAT" | "ĆIR">("LAT");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const toggle = () => {
    const newScript = script === "LAT" ? "ĆIR" : "LAT";
    setScript(newScript);
    setToastMessage(newScript === "ĆIR" ? "Ćirilica aktivirana" : "Latinica aktivirana");
    setShowToast(true);
  };

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className="flex items-center gap-1 hover:text-[#8c4a5a] transition-colors text-xs"
      >
        <Globe className="w-3 h-3" />
        <span>{script === "LAT" ? "Latinica" : "Ćirilica"}</span>
        <span className="ml-0.5 px-1 py-0.5 bg-[#2d2d2d]/10 rounded text-[10px] font-semibold">
          {script}
        </span>
      </button>

      {/* Toast */}
      {showToast && (
        <div className="absolute top-full left-0 mt-2 px-3 py-1.5 bg-[#8c4a5a] text-white text-xs rounded whitespace-nowrap animate-fadeIn z-[60]">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
