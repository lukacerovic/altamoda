"use client";

import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

/**
 * Floating "Vrati se na početak" (back-to-top) button. Appears once the page is
 * scrolled past a threshold and smooth-scrolls to the top. Rendered globally in
 * the root layout so it's available on every page (notably "Svi proizvodi").
 */
export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Vrati se na početak"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-[#1a1c1e] text-white shadow-lg transition-all duration-200 hover:bg-[#edb4bd] hover:text-[#1a1c1e]"
    >
      <ChevronUp className="h-5 w-5" />
    </button>
  );
}
