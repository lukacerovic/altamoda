"use client";

import { useState, useRef, useEffect } from "react";
import { ImageIcon, Trash2, Plus, Upload, Instagram } from "lucide-react";

/**
 * Admin manager for the home-page Instagram bento grid (8 image slots).
 * Admins paste an Instagram post link or a direct image URL (imported and
 * re-hosted into Cloudinary via /api/admin/import-image) or upload a file.
 * Persisted to the `instagramImages` site setting as a JSON array of URLs.
 *
 * Self-contained — safe to render on any admin page (homepage, settings, …).
 */
export default function InstagramGridManager() {
  const [instaImages, setInstaImages] = useState<string[]>(Array(8).fill(""));
  const [instaInputs, setInstaInputs] = useState<string[]>(Array(8).fill(""));
  const [instaImporting, setInstaImporting] = useState<number | null>(null);
  const [instaError, setInstaError] = useState("");
  const instaFileRef = useRef<HTMLInputElement>(null);
  const [instaUploadSlot, setInstaUploadSlot] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/site-settings?keys=instagramImages")
      .then((r) => r.json())
      .then((json) => {
        const raw = json.data?.instagramImages;
        if (!raw) return;
        try {
          const imgs = JSON.parse(raw) as string[];
          setInstaImages(Array.from({ length: 8 }, (_, i) => imgs[i] || ""));
        } catch { /* ignore */ }
      })
      .catch(() => {});
  }, []);

  const persist = async (imgs: string[]) => {
    await fetch("/api/admin/site-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instagramImages: JSON.stringify(imgs) }),
    });
  };

  const handleImport = async (slotIndex: number) => {
    const url = instaInputs[slotIndex]?.trim();
    if (!url) return;
    setInstaImporting(slotIndex);
    setInstaError("");
    try {
      const res = await fetch("/api/admin/import-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Greška pri uvozu slike");
      const updated = instaImages.map((im, i) => (i === slotIndex ? json.data.url : im));
      setInstaImages(updated);
      setInstaInputs((prev) => prev.map((v, i) => (i === slotIndex ? "" : v)));
      await persist(updated);
    } catch (err) {
      setInstaError(err instanceof Error ? err.message : "Greška pri uvozu slike");
    } finally {
      setInstaImporting(null);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const slot = instaUploadSlot;
    if (!file || slot === null) return;
    setInstaImporting(slot);
    setInstaError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Greška pri uploadu");
      const old = instaImages[slot];
      const updated = instaImages.map((im, i) => (i === slot ? json.data.url : im));
      setInstaImages(updated);
      await persist(updated);
      if (old?.includes("/altamoda/uploads/")) {
        fetch("/api/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: old }),
        }).catch(() => {});
      }
    } catch (err) {
      setInstaError(err instanceof Error ? err.message : "Greška pri uploadu");
    } finally {
      setInstaImporting(null);
      setInstaUploadSlot(null);
      if (instaFileRef.current) instaFileRef.current.value = "";
    }
  };

  const handleRemove = async (index: number) => {
    const removedUrl = instaImages[index];
    const updated = instaImages.map((im, i) => (i === index ? "" : im));
    setInstaImages(updated);
    await persist(updated);
    if (removedUrl?.includes("/altamoda/uploads/")) {
      fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: removedUrl }),
      }).catch(() => {});
    }
  };

  return (
    <div className="bg-white rounded-sm border border-stone-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-[#FFFFFF]">
        <div className="flex items-center gap-3">
          <div className="text-[#c19742]"><Instagram size={20} /></div>
          <h2 className="text-lg font-serif font-bold text-black">Instagram galerija</h2>
          <span className="px-2.5 py-0.5 rounded-full bg-black/10 text-[#c19742] text-xs font-semibold">
            {instaImages.filter(Boolean).length} / 8
          </span>
        </div>
      </div>
      <div className="p-6">
        <p className="text-sm text-[#1a1c1e] mb-1">
          Nalepite link Instagram objave (npr. <span className="font-mono">instagram.com/p/…</span>) ili direktan URL slike i kliknite Uvezi — slika se preuzima i čuva. Ako uvoz ne uspe, otpremite sliku dugmetom <span className="font-medium">Otpremi</span>.
        </p>
        <p className="text-xs text-[#1a1c1e]/60 mb-2">Prazna polja koriste podrazumevanu sliku.</p>
        {instaError && <p className="text-sm text-red-600 mb-4">{instaError}</p>}

        <input ref={instaFileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 mt-4">
          {instaImages.map((img, slotIndex) => (
            <div key={slotIndex} className="flex flex-col gap-2">
              <div className="relative group overflow-hidden border-2 border-dashed border-stone-300 rounded-sm aspect-square bg-stone-50">
                {img ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`Instagram ${slotIndex + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleRemove(slotIndex)} className="p-1.5 bg-red-500 rounded shadow text-white hover:bg-red-600 transition-colors" title="Ukloni sliku">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-stone-400">
                    <ImageIcon size={26} />
                    <span className="text-xs">Slot {slotIndex + 1}</span>
                  </div>
                )}
                {instaImporting === slotIndex && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <div className="w-7 h-7 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={instaInputs[slotIndex]}
                  onChange={(e) => setInstaInputs((prev) => prev.map((v, i) => (i === slotIndex ? e.target.value : v)))}
                  onKeyDown={(e) => { if (e.key === "Enter") handleImport(slotIndex); }}
                  placeholder="Link objave ili URL slike…"
                  className="flex-1 min-w-0 px-2.5 py-2 text-xs border border-stone-200 rounded-sm focus:border-black focus:outline-none"
                />
                <button
                  onClick={() => handleImport(slotIndex)}
                  disabled={instaImporting === slotIndex || !instaInputs[slotIndex]?.trim()}
                  className="bg-[#c19742] text-white hover:bg-[#413d3a] transition-colors px-3 py-2 rounded-sm text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                  title="Uvezi sliku sa URL-a"
                >
                  <Plus size={14} />
                  Uvezi
                </button>
              </div>
              <button
                onClick={() => { setInstaUploadSlot(slotIndex); instaFileRef.current?.click(); }}
                disabled={instaImporting === slotIndex}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-sm text-xs font-medium border border-stone-200 text-[#1a1c1e] hover:border-black transition-colors disabled:opacity-50"
                title="Otpremi sliku sa računara"
              >
                <Upload size={13} /> Otpremi
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
