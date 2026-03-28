"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertTriangle,
  XCircle, ArrowLeft, Loader2, Info, ChevronDown, ChevronUp,
} from "lucide-react";

interface ImportResult {
  profile: string;
  mappedColumns: Record<string, string>;
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; name: string; error: string }[];
  total: number;
  newBrands: string[];
  newCategories: string[];
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
  };

  const handleImport = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/products/import", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Greška pri importu");
      } else {
        setResult(json.data);
      }
    } catch {
      setError("Greška u konekciji sa serverom");
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const profileLabel = (p: string) => {
    if (p === "altamoda") return "Alta Moda CSV";
    if (p === "pantheon") return "Pantheon ERP";
    return p;
  };

  return (
    <div className="min-h-screen bg-[#faf8f4]">
      {/* Header */}
      <div className="border-b border-stone-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/admin/products" className="p-2 hover:bg-stone-100 rounded-sm transition-colors">
            <ArrowLeft size={18} className="text-[#666]" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-black">Uvoz proizvoda</h1>
            <p className="text-sm text-[#999]">Uvezite proizvode iz CSV ili Excel fajla</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Info box */}
        <div className="bg-blue-50 border border-blue-200 rounded-sm p-4 flex gap-3">
          <Info size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Podržani formati</p>
            <ul className="space-y-0.5 text-blue-700">
              <li><strong>.csv</strong> — Alta Moda format (name, brand, category, current_price_rsd, image_url, url_slug)</li>
              <li><strong>.xlsx / .xls</strong> — Excel fajlovi</li>
              <li><strong>Pantheon export</strong> — Automatski prepoznaje kolone (acName, acIdent, anSalePrice...)</li>
            </ul>
            <p className="mt-2 text-blue-600">Sistem automatski prepoznaje format kolona. Novi brendovi i kategorije se kreiraju automatski.</p>
          </div>
        </div>

        {/* Upload area */}
        <div
          className={`border-2 border-dashed rounded-sm p-8 text-center transition-colors ${
            file ? "border-stone-300 bg-white" : "border-stone-300 bg-stone-50 hover:border-stone-400 cursor-pointer"
          }`}
          onClick={() => !file && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />

          {file ? (
            <div className="flex items-center justify-center gap-4">
              <FileSpreadsheet size={40} className="text-green-600" />
              <div className="text-left">
                <p className="text-sm font-medium text-black">{file.name}</p>
                <p className="text-xs text-[#999]">{formatFileSize(file.size)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); setError(null); }}
                className="ml-4 p-1.5 hover:bg-stone-100 rounded-sm"
              >
                <XCircle size={18} className="text-[#999]" />
              </button>
            </div>
          ) : (
            <>
              <Upload size={40} className="mx-auto text-[#ccc] mb-3" />
              <p className="text-sm text-[#666]">Prevucite fajl ovde ili <span className="text-black font-medium underline">izaberite fajl</span></p>
              <p className="text-xs text-[#999] mt-1">CSV, XLSX ili XLS • Maksimalno 10MB</p>
            </>
          )}
        </div>

        {/* Import button */}
        {file && !result && (
          <button
            onClick={handleImport}
            disabled={uploading}
            className="w-full py-3 bg-black text-white rounded-sm font-medium hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Uvoz u toku...
              </>
            ) : (
              <>
                <Upload size={18} />
                Započni uvoz
              </>
            )}
          </button>
        )}

        {/* Error display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-sm p-4">
            <div className="flex gap-3">
              <XCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800 mb-1">Greška pri importu</p>
                <pre className="text-sm text-red-700 whitespace-pre-wrap font-sans">{error}</pre>
              </div>
            </div>
          </div>
        )}

        {/* Success result */}
        {result && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-green-50 border border-green-200 rounded-sm p-4">
              <div className="flex gap-3">
                <CheckCircle2 size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">Uvoz završen</p>
                  <p className="text-xs text-green-600 mt-0.5">
                    Format: {profileLabel(result.profile)} • Ukupno redova: {result.total}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border border-stone-200 rounded-sm p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{result.created}</p>
                <p className="text-xs text-[#999] mt-1">Kreirano</p>
              </div>
              <div className="bg-white border border-stone-200 rounded-sm p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{result.updated}</p>
                <p className="text-xs text-[#999] mt-1">Ažurirano</p>
              </div>
              <div className="bg-white border border-stone-200 rounded-sm p-4 text-center">
                <p className="text-2xl font-bold text-[#999]">{result.skipped}</p>
                <p className="text-xs text-[#999] mt-1">Preskočeno</p>
              </div>
              <div className="bg-white border border-stone-200 rounded-sm p-4 text-center">
                <p className={`text-2xl font-bold ${result.errors.length > 0 ? "text-red-500" : "text-[#999]"}`}>{result.errors.length}</p>
                <p className="text-xs text-[#999] mt-1">Grešaka</p>
              </div>
            </div>

            {/* New brands/categories */}
            {(result.newBrands.length > 0 || result.newCategories.length > 0) && (
              <div className="bg-amber-50 border border-amber-200 rounded-sm p-4">
                <div className="flex gap-3">
                  <Info size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    {result.newBrands.length > 0 && (
                      <p className="text-amber-800">
                        Novi brendovi kreirani: <strong>{result.newBrands.join(", ")}</strong>
                      </p>
                    )}
                    {result.newCategories.length > 0 && (
                      <p className="text-amber-800 mt-1">
                        Nove kategorije kreirane: <strong>{result.newCategories.join(", ")}</strong>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Column mapping details */}
            <div className="bg-white border border-stone-200 rounded-sm">
              <button
                onClick={() => setShowColumns(!showColumns)}
                className="w-full px-4 py-3 flex items-center justify-between text-sm text-[#666] hover:bg-stone-50"
              >
                <span>Mapiranje kolona ({Object.keys(result.mappedColumns).length} prepoznato)</span>
                {showColumns ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showColumns && (
                <div className="border-t border-stone-200 px-4 py-3">
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {Object.entries(result.mappedColumns).map(([field, col]) => (
                      <div key={field} className="flex justify-between py-1 px-2 bg-stone-50 rounded">
                        <span className="text-[#999]">{field}</span>
                        <span className="font-mono text-black">{col}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Errors list */}
            {result.errors.length > 0 && (
              <div className="bg-white border border-red-200 rounded-sm">
                <button
                  onClick={() => setShowErrors(!showErrors)}
                  className="w-full px-4 py-3 flex items-center justify-between text-sm text-red-600 hover:bg-red-50"
                >
                  <span className="flex items-center gap-2">
                    <AlertTriangle size={16} />
                    {result.errors.length} grešaka pri importu
                  </span>
                  {showErrors ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {showErrors && (
                  <div className="border-t border-red-200 max-h-80 overflow-y-auto">
                    {result.errors.map((err, i) => (
                      <div key={i} className="px-4 py-2.5 border-b border-stone-100 last:border-0 text-sm">
                        <span className="text-[#999] text-xs mr-2">Red {err.row}</span>
                        {err.name && <span className="text-black font-medium mr-2">{err.name}</span>}
                        <span className="text-red-600">{err.error}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => { setFile(null); setResult(null); setError(null); }}
                className="flex-1 py-2.5 bg-black text-white rounded-sm font-medium hover:bg-black/90 transition-colors text-sm"
              >
                Uvezi još jedan fajl
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
    </div>
  );
}
