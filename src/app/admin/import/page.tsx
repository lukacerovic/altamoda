"use client";

import { useState } from "react";
import {
  Upload,
  Download,
  FileSpreadsheet,
  ArrowRight,
  Check,
  AlertCircle,
  Clock,
  ChevronDown,
  File,
  X,
} from "lucide-react";

type Tab = "import" | "export";

interface ImportHistory {
  id: number;
  date: string;
  type: string;
  rowsImported: number;
  errors: number;
  status: "success" | "partial" | "error";
}

const importHistory: ImportHistory[] = [
  { id: 1, date: "2026-03-15 14:30", type: "Proizvodi", rowsImported: 156, errors: 0, status: "success" },
  { id: 2, date: "2026-03-10 10:00", type: "Cene", rowsImported: 342, errors: 3, status: "partial" },
  { id: 3, date: "2026-03-05 09:15", type: "Lager", rowsImported: 500, errors: 0, status: "success" },
  { id: 4, date: "2026-02-28 16:45", type: "Korisnici", rowsImported: 0, errors: 12, status: "error" },
  { id: 5, date: "2026-02-20 11:00", type: "Proizvodi", rowsImported: 89, errors: 1, status: "partial" },
];

const previewData = [
  { sku: "LOR-001", name: "Serie Expert Gold Quinoa", brand: "L'Oreal", price: "2500", stock: "45" },
  { sku: "SCH-002", name: "BC Peptide Repair", brand: "Schwarzkopf", price: "1800", stock: "32" },
  { sku: "KER-003", name: "Elixir Ultime Serum", brand: "Kerastase", price: "4200", stock: "3" },
  { sku: "WEL-004", name: "Oil Reflections Šampon", brand: "Wella", price: "1950", stock: "28" },
  { sku: "MOR-005", name: "Moroccanoil Treatment", brand: "Moroccanoil", price: "3500", stock: "15" },
];

const csvFields = ["SKU", "Naziv", "Brend", "Cena", "Stanje"];
const systemFields = ["SKU (Šifra)", "Naziv proizvoda", "Brend", "Cena (RSD)", "Stanje na lageru", "Kategorija", "Opis", "Težina"];

const fieldMappings: { csv: string; system: string }[] = [
  { csv: "SKU", system: "SKU (Šifra)" },
  { csv: "Naziv", system: "Naziv proizvoda" },
  { csv: "Brend", system: "Brend" },
  { csv: "Cena", system: "Cena (RSD)" },
  { csv: "Stanje", system: "Stanje na lageru" },
];

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState<Tab>("import");
  const [importType, setImportType] = useState("Proizvodi");
  const [fileUploaded, setFileUploaded] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(67);
  const [mappings, setMappings] = useState(fieldMappings);

  const [exportType, setExportType] = useState("Proizvodi");
  const [exportFormat, setExportFormat] = useState("CSV");
  const [exportDateFrom, setExportDateFrom] = useState("");
  const [exportDateTo, setExportDateTo] = useState("");

  const updateMapping = (index: number, value: string) => {
    const newMappings = [...mappings];
    newMappings[index] = { ...newMappings[index], system: value };
    setMappings(newMappings);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "import", label: "Import" },
    { id: "export", label: "Export" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#2d2d2d]">Import / Export</h1>
          <p className="text-[#666] mt-1">Masovni uvoz i izvoz podataka</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#f5f0e8] rounded-lg p-1 mb-6 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id ? "bg-white text-[#2d2d2d] shadow-sm" : "text-[#666] hover:text-[#333]"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Import Tab */}
      {activeTab === "import" && (
        <div className="space-y-6">
          {/* Import type */}
          <div className="bg-white rounded-xl border border-[#e0d8cc] p-5">
            <h3 className="font-semibold text-[#2d2d2d] mb-3">Tip uvoza</h3>
            <select
              value={importType}
              onChange={(e) => setImportType(e.target.value)}
              className="w-full sm:w-64 px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none"
            >
              <option value="Proizvodi">Proizvodi</option>
              <option value="Cene">Cene</option>
              <option value="Lager">Lager</option>
              <option value="Korisnici">Korisnici</option>
            </select>
          </div>

          {/* Template downloads */}
          <div className="bg-white rounded-xl border border-[#e0d8cc] p-5">
            <h3 className="font-semibold text-[#2d2d2d] mb-3">Preuzmite šablon</h3>
            <div className="flex flex-wrap gap-3">
              {["Preuzmite šablon za proizvode", "Preuzmite šablon za cene", "Preuzmite šablon za lager"].map((tmpl) => (
                <button key={tmpl} className="inline-flex items-center gap-2 px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm hover:bg-[#f5f0e8] transition-colors">
                  <Download size={16} className="text-[#8c4a5a]" />
                  {tmpl}
                </button>
              ))}
            </div>
          </div>

          {/* Drag and drop upload */}
          <div
            onClick={() => setFileUploaded(true)}
            className={`bg-white rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${fileUploaded ? "border-green-300 bg-green-50" : "border-[#e0d8cc] hover:border-[#8c4a5a]"}`}
          >
            {fileUploaded ? (
              <div>
                <Check size={40} className="mx-auto text-green-500 mb-3" />
                <p className="font-medium text-green-700">proizvodi_mart_2026.csv</p>
                <p className="text-sm text-green-600 mt-1">156 redova - 45KB</p>
                <button onClick={(e) => { e.stopPropagation(); setFileUploaded(false); }} className="mt-3 text-sm text-red-500 hover:text-red-700">
                  Ukloni fajl
                </button>
              </div>
            ) : (
              <div>
                <Upload size={40} className="mx-auto text-[#8c4a5a] mb-3" />
                <p className="font-medium text-[#333]">Prevucite fajl ovde ili kliknite za upload</p>
                <p className="text-sm text-[#999] mt-1">Podržani formati: CSV, Excel (.xlsx, .xls)</p>
              </div>
            )}
          </div>

          {/* Preview */}
          {fileUploaded && (
            <>
              <div className="bg-white rounded-xl border border-[#e0d8cc] overflow-hidden">
                <div className="p-4 border-b border-[#e0d8cc]">
                  <h3 className="font-semibold text-[#2d2d2d]">Pregled podataka (prvih 5 redova)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#f5f0e8] border-b border-[#e0d8cc]">
                      <tr>
                        {Object.keys(previewData[0]).map((key) => (
                          <th key={key} className="text-left px-4 py-3 font-semibold text-[#666] uppercase text-xs">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, i) => (
                        <tr key={i} className="border-b border-[#f5f0e8]">
                          <td className="px-4 py-2.5 text-[#333] font-mono text-xs">{row.sku}</td>
                          <td className="px-4 py-2.5 text-[#333]">{row.name}</td>
                          <td className="px-4 py-2.5 text-[#666]">{row.brand}</td>
                          <td className="px-4 py-2.5 text-[#333]">{row.price}</td>
                          <td className="px-4 py-2.5 text-[#333]">{row.stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Field Mapping */}
              <div className="bg-white rounded-xl border border-[#e0d8cc] p-5">
                <h3 className="font-semibold text-[#2d2d2d] mb-4">Mapiranje polja</h3>
                <div className="space-y-3">
                  {mappings.map((mapping, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-1 px-4 py-2 bg-[#f5f0e8] border border-[#e0d8cc] rounded-lg text-sm text-[#333]">
                        {mapping.csv}
                      </div>
                      <ArrowRight size={16} className="text-[#8c4a5a] flex-shrink-0" />
                      <select
                        value={mapping.system}
                        onChange={(e) => updateMapping(index, e.target.value)}
                        className="flex-1 px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none"
                      >
                        {systemFields.map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Import button + progress */}
              <div className="bg-white rounded-xl border border-[#e0d8cc] p-5">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setImporting(true)}
                    className="inline-flex items-center gap-2 bg-[#8c4a5a] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#b8994e] transition-colors"
                  >
                    <Upload size={16} />
                    Pokreni import
                  </button>
                  <span className="text-sm text-[#666]">{progress}% završeno</span>
                </div>
                <div className="w-full bg-[#f5f0e8] rounded-full h-3">
                  <div
                    className="bg-[#8c4a5a] h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-[#999] mt-2">Uvezeno 104 od 156 redova...</p>
              </div>
            </>
          )}

          {/* Import History */}
          <div className="bg-white rounded-xl border border-[#e0d8cc] overflow-hidden">
            <div className="p-4 border-b border-[#e0d8cc]">
              <h3 className="font-semibold text-[#2d2d2d]">Istorija uvoza</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#f5f0e8] border-b border-[#e0d8cc]">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-[#666]">Datum</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#666]">Tip</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#666]">Uvezeno redova</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#666]">Greške</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#666]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {importHistory.map((item) => (
                    <tr key={item.id} className="border-b border-[#f5f0e8] hover:bg-[#f5f0e8] transition-colors">
                      <td className="px-4 py-3 text-[#666] text-xs">{item.date}</td>
                      <td className="px-4 py-3 font-medium text-[#333]">{item.type}</td>
                      <td className="px-4 py-3 text-[#333]">{item.rowsImported}</td>
                      <td className="px-4 py-3">
                        <span className={item.errors > 0 ? "text-red-600 font-medium" : "text-[#999]"}>{item.errors}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.status === "success" ? "bg-green-100 text-green-700" :
                          item.status === "partial" ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {item.status === "success" ? "Uspešno" : item.status === "partial" ? "Delimično" : "Greška"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Export Tab */}
      {activeTab === "export" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#e0d8cc] p-5">
            <h3 className="font-semibold text-[#2d2d2d] mb-4">Podešavanja izvoza</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1">Tip podataka</label>
                  <select value={exportType} onChange={(e) => setExportType(e.target.value)} className="w-full px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none">
                    <option value="Proizvodi">Proizvodi</option>
                    <option value="Porudžbine">Porudžbine</option>
                    <option value="Korisnici">Korisnici</option>
                    <option value="Cene">Cene</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1">Format</label>
                  <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} className="w-full px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none">
                    <option value="CSV">CSV</option>
                    <option value="Excel">Excel (.xlsx)</option>
                  </select>
                </div>
              </div>
              {exportType === "Porudžbine" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#333] mb-1">Datum od</label>
                    <input type="date" value={exportDateFrom} onChange={(e) => setExportDateFrom(e.target.value)} className="w-full px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#333] mb-1">Datum do</label>
                    <input type="date" value={exportDateTo} onChange={(e) => setExportDateTo(e.target.value)} className="w-full px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-[#333] mb-1">Filteri</label>
                <div className="flex flex-wrap gap-3">
                  <select className="px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none">
                    <option>Sve kategorije</option>
                    <option>Nega kose</option>
                    <option>Boje za kosu</option>
                    <option>Styling</option>
                    <option>Ulja i serumi</option>
                  </select>
                  <select className="px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none">
                    <option>Svi brendovi</option>
                    <option>L&apos;Oreal</option>
                    <option>Schwarzkopf</option>
                    <option>Kerastase</option>
                    <option>Wella</option>
                  </select>
                  <select className="px-4 py-2 border border-[#e0d8cc] rounded-lg text-sm focus:border-[#8c4a5a] focus:outline-none">
                    <option>Svi statusi</option>
                    <option>Aktivan</option>
                    <option>Neaktivan</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#e0d8cc] p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#2d2d2d]">Spreman za izvoz</h3>
                <p className="text-sm text-[#666] mt-1">
                  {exportType} - {exportFormat} format
                </p>
              </div>
              <button className="inline-flex items-center gap-2 bg-[#8c4a5a] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#b8994e] transition-colors">
                <Download size={16} />
                Izvezi podatke
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
