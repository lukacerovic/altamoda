"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Upload, FileSpreadsheet, CheckCircle2, XCircle, ArrowLeft, Loader2,
  Info, X, AlertTriangle, Trash2, Archive, RefreshCw, Download, ShieldCheck,
} from "lucide-react";

// Expected AMS Excel columns (client's "AMS final baza" structure + GENDER).
const AMS_COLUMNS = [
  "IDENT", "EAN CODE", "NAZIV", "PRIMENA", "BREND", "KATEGORIJA", "POTKATEGORIJA",
  "LINIJA", "TIP PROIZVODA", "TIP KOSE", "FUNKCIJA/TAGOVI", "OPIS", "UPOTREBA",
  "SASTAV", "BENEFITI", "DEKLARACIJA", "VP CENA bez PDV", "VP CENA sa PDV",
  "MP CENA bez PDV", "MP CENA sa PDV", "GENDER",
];

interface AmsResult {
  ams: true;
  created: number;
  updated: number;
  deleted: number;
  archived: number;
  skipped: number;
  total: number;
  newBrands: string[];
  newCategories: string[];
  errors: { row: number; name: string; error: string }[];
}

export default function ImportPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<AmsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles);
    // Catalog import is a single-file replace — keep only the most recent file.
    setFiles(arr.slice(-1));
    setResult(null);
    setError(null);
  };

  const handleImport = async () => {
    if (files.length === 0) return;
    setShowConfirm(false);
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));

      const res = await fetch("/api/products/import", { method: "POST", body: formData });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Greška pri importu");
      } else {
        setResult(json.data as AmsResult);
      }
    } catch {
      setError("Greška u konekciji sa serverom");
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      {/* Header */}
      <div className="border-b border-stone-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/admin/products" className="p-2 hover:bg-stone-100 rounded-sm transition-colors">
            <ArrowLeft size={18} className="text-[#1a1c1e]" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-black">Uvoz kataloga iz Excel-a</h1>
            <p className="text-sm text-[#1a1c1e]">Excel fajl postaje kompletan spisak proizvoda na sajtu</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* REPLACEMENT WARNING */}
        <div className="bg-red-50 border border-red-200 rounded-sm p-4 flex gap-3">
          <AlertTriangle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-red-800">
            <p className="font-semibold mb-1">Pažnja: uvoz ZAMENJUJE ceo katalog</p>
            <ul className="list-disc list-inside space-y-0.5 text-red-700">
              <li>Svi postojeći proizvodi kojih <strong>nema</strong> u Excel fajlu biće <strong>obrisani</strong> (ili arhivirani ako imaju porudžbine).</li>
              <li>Proizvodi iz fajla se dodaju ili ažuriraju podacima iz Excel-a.</li>
              <li>Slike se <strong>čuvaju</strong> za proizvode koji ostaju (povezivanje po šifri IDENT).</li>
            </ul>
          </div>
        </div>

        {/* Backup before importing */}
        <div className="bg-green-50 border border-green-200 rounded-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <ShieldCheck size={18} className="text-green-600 flex-shrink-0" />
          <div className="flex-1 text-sm text-green-800">
            <p className="font-medium">Napravite rezervnu kopiju pre uvoza</p>
            <p className="text-green-700">Preuzmite trenutni katalog u istoj Excel strukturi. Ako nešto pođe naopako, možete ga ponovo uvesti i vratiti prethodno stanje.</p>
          </div>
          <a
            href="/api/products/export"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-green-300 text-green-800 rounded-sm text-sm font-medium hover:bg-green-100 transition-colors whitespace-nowrap"
          >
            <Download size={16} /> Preuzmi backup (Excel)
          </a>
        </div>

        {/* Expected columns */}
        <div className="bg-blue-50 border border-blue-200 rounded-sm p-4 flex gap-3">
          <Info size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1.5">Excel mora imati tačno ove kolone (sheet <strong>„AMS final baza”</strong>)</p>
            <div className="flex flex-wrap gap-1.5">
              {AMS_COLUMNS.map((c) => (
                <span key={c} className="inline-block bg-white border border-blue-200 rounded-sm px-2 py-0.5 text-xs text-blue-700 font-mono">
                  {c}
                </span>
              ))}
            </div>
            <p className="mt-2 text-blue-600">Ako se bilo koji naziv kolone ne poklapa, uvoz se neće pokrenuti i biće prikazano šta nije u redu.</p>
          </div>
        </div>

        {/* Upload area */}
        {!result && (
          <>
            <div
              className="border-2 border-dashed border-stone-300 rounded-sm p-8 text-center bg-stone-50 hover:border-stone-400 cursor-pointer transition-colors"
              onClick={() => inputRef.current?.click()}
              onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
              onDragOver={(e) => e.preventDefault()}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
                className="hidden"
              />
              <Upload size={40} className="mx-auto text-[#dddbd9] mb-3" />
              <p className="text-sm text-[#1a1c1e]">Prevucite Excel fajl ovde ili <span className="text-black font-medium underline">izaberite fajl</span></p>
              <p className="text-xs text-[#1a1c1e] mt-1">XLSX ili XLS • Jedan fajl • Maksimalno 10MB</p>
            </div>

            {/* Selected file */}
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((f, i) => (
                  <div key={f.name} className="flex items-center gap-3 bg-white border border-stone-200 rounded-sm px-4 py-2.5">
                    <FileSpreadsheet size={20} className="text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-black truncate">{f.name}</p>
                      <p className="text-xs text-[#1a1c1e]">{formatSize(f.size)}</p>
                    </div>
                    <button onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))} className="p-1 hover:bg-stone-100 rounded-sm">
                      <X size={16} className="text-[#1a1c1e]" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Import button */}
            {files.length > 0 && (
              <button
                onClick={() => setShowConfirm(true)}
                disabled={uploading}
                className="w-full py-3 bg-[#edb4bd] text-white rounded-sm font-medium hover:bg-[#413d3a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <><Loader2 size={18} className="animate-spin" /> Uvoz u toku — zamenjujem katalog...</>
                ) : (
                  <><RefreshCw size={18} /> Zameni katalog iz Excel-a</>
                )}
              </button>
            )}
          </>
        )}

        {/* Results (AMS replace) */}
        {result && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-sm p-4 flex gap-3">
              <CheckCircle2 size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800">Katalog zamenjen — {result.total} proizvoda iz Excel-a</p>
                <p className="text-xs text-green-600 mt-0.5">Katalog sada odgovara uvezenom Excel fajlu.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <Stat value={result.created} label="Kreirano" cls="text-green-600" />
              <Stat value={result.updated} label="Ažurirano" cls="text-blue-600" />
              <Stat value={result.deleted} label="Obrisano" cls="text-red-500" icon={<Trash2 size={14} />} />
              <Stat value={result.archived} label="Arhivirano" cls="text-amber-600" icon={<Archive size={14} />} />
              <Stat value={result.errors.length} label="Grešaka" cls={result.errors.length ? "text-red-500" : "text-[#1a1c1e]"} />
            </div>

            {(result.newBrands.length > 0 || result.newCategories.length > 0) && (
              <div className="bg-amber-50 border border-amber-100 rounded-sm p-3 text-xs">
                {result.newBrands.length > 0 && <p className="text-amber-800">Novi brendovi: <strong>{result.newBrands.join(", ")}</strong></p>}
                {result.newCategories.length > 0 && <p className="text-amber-800 mt-1">Nove kategorije: <strong>{result.newCategories.join(", ")}</strong></p>}
              </div>
            )}

            {result.errors.length > 0 && (
              <div className="bg-white border border-stone-200 rounded-sm p-3">
                <p className="text-xs font-medium text-red-600 mb-2">{result.errors.length} redova sa greškom</p>
                <div className="max-h-48 overflow-y-auto">
                  {result.errors.map((err, i) => (
                    <div key={i} className="py-1.5 border-b border-stone-100 last:border-0 text-xs">
                      <span className="text-[#1a1c1e] mr-1">Red {err.row}</span>
                      <span className="text-black font-medium mr-1">{err.name}</span>
                      <span className="text-red-600">{err.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setFiles([]); setResult(null); setError(null); }}
                className="flex-1 py-2.5 bg-[#edb4bd] text-white rounded-sm font-medium hover:bg-[#413d3a] transition-colors text-sm"
              >
                Novi uvoz
              </button>
              <Link
                href="/admin/products"
                className="flex-1 py-2.5 border border-stone-200 text-black rounded-sm font-medium hover:bg-stone-50 transition-colors text-sm text-center"
              >
                Nazad na proizvode
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowConfirm(false)}>
          <div className="bg-white rounded-sm max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-black">Zameniti ceo katalog?</h2>
                <p className="text-sm text-[#1a1c1e] mt-1.5">
                  Ova radnja <strong>briše sve proizvode kojih nema</strong> u izabranom Excel fajlu i ažurira ostale.
                  Radnja se ne može opozvati. Nastaviti?
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 border border-stone-200 text-black rounded-sm font-medium hover:bg-stone-50 transition-colors text-sm"
              >
                Otkaži
              </button>
              <button
                onClick={handleImport}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-sm font-medium hover:bg-red-700 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} /> Da, zameni katalog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error / validation modal */}
      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setError(null)}>
          <div className="bg-white rounded-sm max-w-lg w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <XCircle size={20} className="text-red-500" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-black">Uvoz zaustavljen</h2>
                <pre className="text-sm text-red-700 whitespace-pre-wrap font-sans mt-1.5 max-h-80 overflow-y-auto">{error}</pre>
              </div>
            </div>
            <div className="flex justify-end mt-5">
              <button
                onClick={() => setError(null)}
                className="py-2.5 px-6 bg-[#edb4bd] text-white rounded-sm font-medium hover:bg-[#413d3a] transition-colors text-sm"
              >
                Zatvori
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ value, label, cls, icon }: { value: number; label: string; cls: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-white border border-stone-200 rounded-sm p-4 text-center">
      <p className={`text-2xl font-bold ${cls}`}>{value}</p>
      <p className="text-xs text-[#1a1c1e] mt-1 flex items-center justify-center gap-1">{icon}{label}</p>
    </div>
  );
}
