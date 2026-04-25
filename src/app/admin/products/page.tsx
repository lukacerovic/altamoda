"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  MoreVertical,
  CheckSquare,
  Square,
  Package,
  Eye,
  EyeOff,
  Upload,
  Image as ImageIcon,
  Star,
  FileImage,
  Palette,
  ShieldCheck,
  BarChart3,
  Layers,
  AlertTriangle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

/* ───────────────────────── Types ───────────────────────── */

interface ProductImage {
  id: number;
  url: string;
  alt: string;
  isPrimary: boolean;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  brand: string;
  productLine: string;
  category: string;
  subCategory: string;
  priceB2C: number;
  priceB2B: number;
  oldPrice?: number;
  purchasePrice: number;
  stock: number;
  lowStockThreshold: number;
  weight: number;
  volume: number;
  status: "active" | "inactive";
  badges: { isNew: boolean; isFeatured: boolean; isBestseller: boolean; isProfessionalOnly: boolean };
  description: string;
  benefits?: string;
  ingredients: string;
  declaration?: string;
  howToUse: string;
  images: ProductImage[];
  colorLevel?: number;
  colorUndertone?: string;
  colorHex?: string;
  shadeCode?: string;
  removeColor?: boolean;
  seoTitle: string;
  metaDescription: string;
  slug: string;
  barcode: string;
  vatRate: number;
  vatCode: string;
  erpId: string;
}

type TabKey = "osnovno" | "cene" | "sadrzaj" | "mediji" | "zalihe";

/* ───────────────────────── Constants ───────────────────────── */

const brandNames = ["Redken", "Matrix", "Framesi", "Biolage", "Olivia Garden", "Elchim", "L'image"];

const brandProductLines: Record<string, string[]> = {
  Redken: ["All Soft", "Extreme", "Color Extend", "Brews", "Frizz Dismiss"],
  Matrix: ["Total Results", "Biolage", "SoColor", "Oil Wonders", "Style Link"],
  Framesi: ["Morphosis", "Color Lover", "By Super Hold", "Framcolor"],
  Biolage: ["Hydra Source", "Color Last", "Strength Recovery", "Volume Bloom", "Smooth Proof"],
  "Olivia Garden": ["Ceramic + Ion", "Nano Thermic", "Healthy Hair"],
  Elchim: ["3900 Healthy Ionic", "8th Sense", "Dress Code"],
  "L'image": ["Training Heads", "Mannequin Heads"],
};

const categoryHierarchy: Record<string, string[]> = {
  "Nega": ["\u0160amponi", "Regeneratori", "Maske", "Ulja", "Serumi", "Tretmani", "Leave-in", "Nega kose", "Nega boje"],
  "Styling": ["Stajling", "Sprejevi", "Mu\u0161ki stajling"],
  "Kolor": ["Boje za kosu"],
  "Pribor": ["\u010cetke", "Makaze", "\u010ce\u0161ljevi", "Alat i pribor", "Dodaci", "Trening oprema"],
  "Aparati": ["Aparati za kosu"],
};

/* colorUndertones moved inside component to use t() */

/* ───────────────────────── Mock Data ───────────────────────── */

const initialProducts: Product[] = [
  {
    id: 1, name: "Redken All Soft Shampoo 300ml", sku: "RED-AS-S300", brand: "Redken", productLine: "All Soft",
    category: "Nega", subCategory: "\u0160amponi", priceB2C: 2500, priceB2B: 1800, oldPrice: 3200, purchasePrice: 1200,
    stock: 45, lowStockThreshold: 10, weight: 300, volume: 300, status: "active",
    badges: { isNew: false, isFeatured: true, isBestseller: false, isProfessionalOnly: false },
    description: "Profesionalni \u0161ampon za suvu i lomljivu kosu.",
    ingredients: "Aqua, Sodium Laureth Sulfate, Argan Oil...",
    howToUse: "Nanesite na mokru kosu, upenite i isperite. Ponovite po potrebi.",
    images: [{ id: 1, url: "/products/redken1.jpg", alt: "Redken All Soft \u0161ampon", isPrimary: true }],
    seoTitle: "Redken All Soft \u0160ampon | Alta Moda", metaDescription: "Profesionalni \u0161ampon za suvu kosu. Redken All Soft linija.", slug: "redken-all-soft-shampoo-300ml",
    barcode: "", vatRate: 20, vatCode: "R2", erpId: "",
  },
  {
    id: 2, name: "Matrix Total Results Repair 300ml", sku: "MAT-TR-R300", brand: "Matrix", productLine: "Total Results",
    category: "Nega", subCategory: "\u0160amponi", priceB2C: 1800, priceB2B: 1300, purchasePrice: 900,
    stock: 32, lowStockThreshold: 10, weight: 250, volume: 300, status: "active",
    badges: { isNew: true, isFeatured: false, isBestseller: false, isProfessionalOnly: false },
    description: "Repair \u0161ampon za o\u0161te\u0107enu kosu.",
    ingredients: "Aqua, Sodium Laureth Sulfate, Ceramide Complex...",
    howToUse: "Nanesite na mokru kosu, masirajte i isperite.",
    images: [{ id: 1, url: "/products/matrix1.jpg", alt: "Matrix Total Results Repair", isPrimary: true }],
    seoTitle: "Matrix Total Results Repair | Alta Moda", metaDescription: "Matrix Total Results Repair \u0161ampon za obnovu kose.", slug: "matrix-total-results-repair-300ml",
    barcode: "", vatRate: 20, vatCode: "R2", erpId: "",
  },
  {
    id: 3, name: "Framesi Morphosis Serum 100ml", sku: "FRA-MO-S100", brand: "Framesi", productLine: "Morphosis",
    category: "Nega", subCategory: "Serumi", priceB2C: 4200, priceB2B: 3200, oldPrice: 4800, purchasePrice: 2200,
    stock: 3, lowStockThreshold: 5, weight: 100, volume: 100, status: "active",
    badges: { isNew: false, isFeatured: true, isBestseller: false, isProfessionalOnly: false },
    description: "Luksuzni serum za izvanredan sjaj kose.",
    ingredients: "Cyclopentasiloxane, Dimethiconol, Argan Oil...",
    howToUse: "Nanesite 1-2 pumpe na suvu ili vla\u017enu kosu.",
    images: [{ id: 1, url: "/products/framesi1.jpg", alt: "Framesi Morphosis Serum", isPrimary: true }],
    seoTitle: "Framesi Morphosis Serum | Alta Moda", metaDescription: "Luksuzni serum za sjaj kose. Framesi Morphosis.", slug: "framesi-morphosis-serum-100ml",
    barcode: "", vatRate: 20, vatCode: "R2", erpId: "",
  },
  {
    id: 4, name: "Biolage Hydra Source \u0160ampon 250ml", sku: "BIO-HS-S250", brand: "Biolage", productLine: "Hydra Source",
    category: "Nega", subCategory: "\u0160amponi", priceB2C: 1950, priceB2B: 1400, purchasePrice: 950,
    stock: 28, lowStockThreshold: 10, weight: 250, volume: 250, status: "active",
    badges: { isNew: false, isFeatured: false, isBestseller: false, isProfessionalOnly: false },
    description: "\u0160ampon za hidrataciju suve kose.",
    ingredients: "Aqua, Sodium Laureth Sulfate, Aloe Extract...",
    howToUse: "Nanesite na mokru kosu, masirajte i isperite.",
    images: [{ id: 1, url: "/products/biolage1.jpg", alt: "Biolage Hydra Source \u0161ampon", isPrimary: true }],
    seoTitle: "Biolage Hydra Source \u0160ampon | Alta Moda", metaDescription: "Biolage Hydra Source \u0161ampon za hidrataciju.", slug: "biolage-hydra-source-sampon-250ml",
    barcode: "", vatRate: 20, vatCode: "R2", erpId: "",
  },
  {
    id: 5, name: "Olivia Garden Ceramic Ion Brush 45mm", sku: "OG-CI-B45", brand: "Olivia Garden", productLine: "Ceramic + Ion",
    category: "Pribor", subCategory: "\u010cetke", priceB2C: 3500, priceB2B: 2600, purchasePrice: 1800,
    stock: 15, lowStockThreshold: 5, weight: 120, volume: 0, status: "active",
    badges: { isNew: false, isFeatured: true, isBestseller: false, isProfessionalOnly: true },
    description: "Profesionalna kerami\u010dka \u010detka za feniranje.",
    ingredients: "",
    howToUse: "Koristite prilikom feniranja za glatku i sjajnu kosu.",
    images: [{ id: 1, url: "/products/oliviagarden1.jpg", alt: "Olivia Garden Ceramic Ion Brush", isPrimary: true }],
    seoTitle: "Olivia Garden Ceramic Ion Brush | Alta Moda", metaDescription: "Profesionalna \u010detka za feniranje.", slug: "olivia-garden-ceramic-ion-brush-45mm",
    barcode: "", vatRate: 20, vatCode: "R2", erpId: "",
  },
  {
    id: 6, name: "Framesi Framcolor 60ml - 7.0", sku: "FRA-FC-700", brand: "Framesi", productLine: "Framcolor",
    category: "Kolor", subCategory: "Boje za kosu", priceB2C: 850, priceB2B: 580, purchasePrice: 350,
    stock: 120, lowStockThreshold: 20, weight: 80, volume: 60, status: "active",
    badges: { isNew: false, isFeatured: false, isBestseller: false, isProfessionalOnly: true },
    description: "Permanentna profesionalna boja za kosu. Nivo 7, prirodno plava.",
    ingredients: "Aqua, Cetearyl Alcohol, Propylene Glycol...",
    howToUse: "Pome\u0161ajte 1:1 sa razvo\u010diva\u010dem. Nanesite i ostavite 30-45 min.",
    images: [{ id: 1, url: "/products/framesi-color1.jpg", alt: "Framesi Framcolor 7.0", isPrimary: true }],
    colorLevel: 7, colorUndertone: "N", colorHex: "#8B6914", shadeCode: "7-0",
    seoTitle: "Framesi Framcolor 7-0 | Alta Moda", metaDescription: "Framesi Framcolor 7-0 permanentna boja.", slug: "framesi-framcolor-7-0",
    barcode: "", vatRate: 20, vatCode: "R2", erpId: "",
  },
  {
    id: 7, name: "Matrix SoColor 60ml - 6N", sku: "MAT-SC-6N", brand: "Matrix", productLine: "SoColor",
    category: "Kolor", subCategory: "Boje za kosu", priceB2C: 900, priceB2B: 620, purchasePrice: 380,
    stock: 5, lowStockThreshold: 15, weight: 70, volume: 60, status: "active",
    badges: { isNew: false, isFeatured: false, isBestseller: false, isProfessionalOnly: true },
    description: "Matrix SoColor permanentna boja. Nivo 6, tamno plava.",
    ingredients: "Aqua, Cetearyl Alcohol, Hexylene Glycol...",
    howToUse: "Pome\u0161ajte sa oksidansom u srazmeri 1:1.5. Vreme delovanja 35 min.",
    images: [{ id: 1, url: "/products/matrix-socolor1.jpg", alt: "Matrix SoColor 6N", isPrimary: true }],
    colorLevel: 6, colorUndertone: "N", colorHex: "#6B4226", shadeCode: "6N",
    seoTitle: "Matrix SoColor 6N | Alta Moda", metaDescription: "Matrix SoColor 6N permanentna boja.", slug: "matrix-socolor-6n",
    barcode: "", vatRate: 20, vatCode: "R2", erpId: "",
  },
  {
    id: 8, name: "Redken Brews Clay Pomade", sku: "RED-BR-CP01", brand: "Redken", productLine: "Brews",
    category: "Styling", subCategory: "Stajling", priceB2C: 1200, priceB2B: 850, purchasePrice: 550,
    stock: 42, lowStockThreshold: 10, weight: 100, volume: 100, status: "active",
    badges: { isNew: false, isFeatured: false, isBestseller: false, isProfessionalOnly: false },
    description: "Pomada sa glinom za matiran zavr\u0161ni izgled.",
    ingredients: "Aqua, Kaolin, Beeswax...",
    howToUse: "Nanesite malu koli\u010dinu na suvu kosu i oblikujte.",
    images: [{ id: 1, url: "/products/redken-brews1.jpg", alt: "Redken Brews Clay Pomade", isPrimary: true }],
    seoTitle: "Redken Brews Clay Pomade | Alta Moda", metaDescription: "Redken Brews Clay Pomade za matiran izgled.", slug: "redken-brews-clay-pomade",
    barcode: "", vatRate: 20, vatCode: "R2", erpId: "",
  },
  {
    id: 9, name: "Biolage Strength Recovery Maska 250ml", sku: "BIO-SR-M250", brand: "Biolage", productLine: "Strength Recovery",
    category: "Nega", subCategory: "Maske", priceB2C: 1450, priceB2B: 1050, purchasePrice: 680,
    stock: 18, lowStockThreshold: 8, weight: 250, volume: 250, status: "active",
    badges: { isNew: true, isFeatured: false, isBestseller: false, isProfessionalOnly: false },
    description: "Intenzivna maska za obnovu o\u0161te\u0107ene kose.",
    ingredients: "Aqua, Cetearyl Alcohol, Squalane...",
    howToUse: "Nanesite na opranu kosu, ostavite 5 min i isperite.",
    images: [{ id: 1, url: "/products/biolage-sr1.jpg", alt: "Biolage Strength Recovery Maska", isPrimary: true }],
    seoTitle: "Biolage Strength Recovery Maska | Alta Moda", metaDescription: "Biolage Strength Recovery maska za obnovu kose.", slug: "biolage-strength-recovery-maska-250ml",
    barcode: "", vatRate: 20, vatCode: "R2", erpId: "",
  },
  {
    id: 10, name: "Elchim 3900 Healthy Ionic Fen", sku: "ELC-39-HI01", brand: "Elchim", productLine: "3900 Healthy Ionic",
    category: "Aparati", subCategory: "Aparati za kosu", priceB2C: 15000, priceB2B: 12000, purchasePrice: 8000,
    stock: 4, lowStockThreshold: 2, weight: 480, volume: 0, status: "active",
    badges: { isNew: false, isFeatured: true, isBestseller: false, isProfessionalOnly: true },
    description: "Profesionalni fen sa jonskom tehnologijom.",
    ingredients: "",
    howToUse: "Koristite sa difuzerom ili koncentratorom.",
    images: [{ id: 1, url: "/products/elchim1.jpg", alt: "Elchim 3900 Healthy Ionic", isPrimary: true }],
    seoTitle: "Elchim 3900 Healthy Ionic | Alta Moda", metaDescription: "Elchim 3900 profesionalni fen.", slug: "elchim-3900-healthy-ionic",
    barcode: "", vatRate: 20, vatCode: "R2", erpId: "",
  },
  {
    id: 11, name: "Framesi Color Lover Shampoo 500ml", sku: "FRA-CL-S500", brand: "Framesi", productLine: "Color Lover",
    category: "Nega", subCategory: "Nega boje", priceB2C: 1100, priceB2B: 780, purchasePrice: 480,
    stock: 55, lowStockThreshold: 15, weight: 500, volume: 500, status: "active",
    badges: { isNew: false, isFeatured: true, isBestseller: false, isProfessionalOnly: false },
    description: "\u0160ampon za o\u010duvanje boje farbane kose.",
    ingredients: "Aqua, Sodium Laureth Sulfate, Quinoa Extract...",
    howToUse: "Nanesite na mokru kosu, upenite i isperite.",
    images: [{ id: 1, url: "/products/framesi-cl1.jpg", alt: "Framesi Color Lover Shampoo", isPrimary: true }],
    seoTitle: "Framesi Color Lover Shampoo | Alta Moda", metaDescription: "Framesi Color Lover \u0161ampon za farbanu kosu.", slug: "framesi-color-lover-shampoo-500ml",
    barcode: "", vatRate: 20, vatCode: "R2", erpId: "",
  },
  {
    id: 12, name: "Redken Extreme Ulje 100ml", sku: "RED-EX-U100", brand: "Redken", productLine: "Extreme",
    category: "Nega", subCategory: "Ulja", priceB2C: 2800, priceB2B: 2100, purchasePrice: 1400,
    stock: 22, lowStockThreshold: 8, weight: 120, volume: 100, status: "active",
    badges: { isNew: false, isFeatured: false, isBestseller: false, isProfessionalOnly: false },
    description: "Hranljivo ulje za obnovu o\u0161te\u0107ene kose.",
    ingredients: "Cyclomethicone, Dimethiconol, Argania Spinosa Oil...",
    howToUse: "Nanesite 1-2 kapi na krajeve kose.",
    images: [{ id: 1, url: "/products/redken-extreme1.jpg", alt: "Redken Extreme Ulje", isPrimary: true }],
    seoTitle: "Redken Extreme Ulje | Alta Moda", metaDescription: "Redken Extreme hranljivo ulje za kosu.", slug: "redken-extreme-ulje-100ml",
    barcode: "", vatRate: 20, vatCode: "R2", erpId: "",
  },
];

/* ───────────────────────── Default Form ───────────────────────── */

const defaultFormData = (): Omit<Product, "id"> => ({
  name: "",
  sku: "",
  brand: "Redken",
  productLine: brandProductLines["Redken"][0],
  category: "Nega",
  subCategory: categoryHierarchy["Nega"][0],
  priceB2C: 0,
  priceB2B: 0,
  oldPrice: undefined,
  purchasePrice: 0,
  stock: 0,
  lowStockThreshold: 10,
  weight: 0,
  volume: 0,
  status: "active",
  badges: { isNew: false, isFeatured: false, isBestseller: false, isProfessionalOnly: false },
  description: "",
  benefits: "",
  ingredients: "",
  declaration: "",
  howToUse: "",
  images: [],
  seoTitle: "",
  metaDescription: "",
  slug: "",
  barcode: "",
  vatRate: 20,
  vatCode: "R2",
  erpId: "",
});

/* ───────────────────────── Helpers ───────────────────────── */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[čć]/g, "c").replace(/[šŠ]/g, "s").replace(/[žŽ]/g, "z").replace(/[đĐ]/g, "dj")
    .replace(/[''\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ───────────────────────── Component ───────────────────────── */

export default function ProductsPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("__all__");
  const [categoryFilter, setCategoryFilter] = useState("__all__");
  const [statusFilter, setStatusFilter] = useState("__all__");
  // __all__ | retail | professional — matches Product.badges.isProfessionalOnly
  const [userTypeFilter, setUserTypeFilter] = useState("__all__");
  const [currentPage, setCurrentPage] = useState(1);
  const [showPanel, setShowPanel] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("osnovno");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [apiLoaded, setApiLoaded] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const [formData, setFormData] = useState<Omit<Product, "id">>(defaultFormData());
  // Separate state for discount % input so user can type it
  const [discountInput, setDiscountInput] = useState("");

  // Dynamic category management
  const [customCategories, setCustomCategories] = useState<Record<string, string[]>>({});
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewSubCategory, setShowNewSubCategory] = useState(false);
  const [newSubCategoryName, setNewSubCategoryName] = useState("");

  // Brands and categories pulled from the API so admin-created entries (from
  // /admin/brands and /admin/categories) appear in the dropdowns alongside the
  // hardcoded defaults — without needing a code change for every new entry.
  const [dbBrands, setDbBrands] = useState<{ name: string; productLines: { name: string }[] }[]>([]);
  const [dbCategoryTree, setDbCategoryTree] = useState<Record<string, string[]>>({});

  // Dedupe case-insensitively (so "Redken" hardcoded and "redken" from DB
  // collapse), preferring whichever casing the iteration sees first — DB
  // values are passed in first below so they win over the hardcoded defaults.
  const dedupeCI = (values: string[]): string[] => {
    const seen = new Map<string, string>();
    for (const v of values) {
      if (!v) continue;
      const key = v.trim().toLowerCase();
      if (!seen.has(key)) seen.set(key, v.trim());
    }
    return [...seen.values()].sort((a, b) => a.localeCompare(b));
  };

  // Trust the DB as source of truth once it's loaded; the hardcoded list is
  // just a bootstrap for an empty/loading DB so the dropdown isn't blank.
  const availableBrands = dbBrands.length > 0
    ? dedupeCI([...dbBrands.map(b => b.name), ...products.map((p) => p.brand).filter(Boolean)])
    : dedupeCI([...brandNames, ...products.map((p) => p.brand).filter(Boolean)]);

  const allCategoryNames = Object.keys(dbCategoryTree).length > 0
    ? dedupeCI([...Object.keys(dbCategoryTree), ...Object.keys(customCategories)])
    : dedupeCI([...Object.keys(categoryHierarchy), ...Object.keys(customCategories)]);

  const getAllSubcategories = (cat: string): string[] => {
    const dbSubs = dbCategoryTree[cat];
    if (dbSubs) return dedupeCI([...dbSubs, ...(customCategories[cat] || [])]);
    return dedupeCI([...(categoryHierarchy[cat] || []), ...(customCategories[cat] || [])]);
  };

  const getProductLinesForBrand = (brand: string): string[] => {
    const dbMatch = dbBrands.find(b => b.name.trim().toLowerCase() === brand.trim().toLowerCase());
    if (dbMatch) return dedupeCI(dbMatch.productLines.map(l => l.name));
    return dedupeCI(brandProductLines[brand] || []);
  };

  const colorUndertones = [
    { value: "N", label: "N - Neutralni" },
    { value: "A", label: "A - Pepeljasti" },
    { value: "G", label: "G - Zlatni" },
    { value: "C", label: "C - Bakarni" },
    { value: "R", label: "R - Crveni" },
    { value: "V", label: "V - Ljubičasti" },
    { value: "M", label: "M - Mahagoni" },
    { value: "B", label: "B - Braon" },
  ];

  const perPage = 8;
  const loadedRef = useRef(false);

  const fetchProducts = useCallback(async () => {
    try {
      // Page 1 first, then fan out for any remaining pages so the admin grid
      // sees every product regardless of stock — the API sorts by stock-desc,
      // so a single ?limit=N call would push freshly-created (stock=0) rows
      // past the cutoff once the catalog grows.
      const firstRes = await fetch("/api/products?limit=100&page=1");
      const firstJson = await firstRes.json();
      if (!firstJson?.success || !firstJson.data?.products) {
        setApiLoaded(true);
        return;
      }
      const rawProducts: Record<string, unknown>[] = [...firstJson.data.products];
      const totalPages: number = firstJson.data.pagination?.totalPages || 1;
      if (totalPages > 1) {
        const remaining = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, i) =>
            fetch(`/api/products?limit=100&page=${i + 2}`).then(r => r.json()).catch(() => null),
          ),
        );
        for (const r of remaining) {
          if (r?.success && r.data?.products) rawProducts.push(...r.data.products);
        }
      }
      const mapped: Product[] = rawProducts.map((p) => ({
        id: p.id as number,
        name: (p.name || "") as string,
        sku: (p.sku || "") as string,
        brand: ((p.brand as Record<string, unknown>)?.name || "") as string,
        productLine: "",
        category: ((p.category as Record<string, unknown>)?.nameLat || "") as string,
        subCategory: "",
        priceB2C: (p.priceB2c || 0) as number,
        priceB2B: (p.priceB2b || 0) as number,
        oldPrice: (p.oldPrice || undefined) as number | undefined,
        purchasePrice: 0,
        stock: (p.stockQuantity || 0) as number,
        lowStockThreshold: 5,
        weight: 0,
        volume: 0,
        status: (p.stockQuantity as number) >= 0 ? ("active" as const) : ("inactive" as const),
        badges: {
          isNew: (p.isNew || false) as boolean,
          isFeatured: (p.isFeatured || false) as boolean,
          isBestseller: (p.isBestseller || false) as boolean,
          isProfessionalOnly: (p.isProfessional || false) as boolean,
        },
        description: "",
        benefits: "",
        ingredients: "",
        declaration: "",
        howToUse: "",
        images: p.image ? [{ id: 1, url: p.image as string, alt: (p.name || "") as string, isPrimary: true }] : [],
        seoTitle: "",
        metaDescription: "",
        slug: (p.slug || "") as string,
        barcode: (p.barcode || "") as string,
        vatRate: (p.vatRate ?? 20) as number,
        vatCode: (p.vatCode || ((p.vatRate as number) === 10 ? "R1" : "R2")) as string,
        erpId: (p.erpId || "") as string,
      }));
      setProducts(mapped);
      setApiLoaded(true);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setApiLoaded(true);
    }
  }, []);

  const fetchTaxonomy = useCallback(() => {
    // Brands include their product lines, so one round-trip covers both dropdowns.
    fetch("/api/brands")
      .then(res => res.json())
      .then(data => {
        if (data?.success && Array.isArray(data.data)) {
          setDbBrands(data.data.map((b: { name: string; productLines?: { name: string }[] }) => ({
            name: b.name,
            productLines: b.productLines || [],
          })));
        }
      })
      .catch(() => {});

    // Categories come back as a tree of roots with `children`. Flatten into a
    // { rootName: [subName, ...] } map matching the form's existing shape so
    // the dropdown logic doesn't need to change.
    fetch("/api/categories")
      .then(res => res.json())
      .then(data => {
        if (data?.success && Array.isArray(data.data)) {
          const tree: Record<string, string[]> = {};
          for (const root of data.data as { nameLat: string; children?: { nameLat: string }[] }[]) {
            tree[root.nameLat] = (root.children || []).map(c => c.nameLat);
          }
          setDbCategoryTree(tree);
        }
      })
      .catch(() => {});
  }, []);

  // Load products from API on mount
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    fetchProducts();
    fetchTaxonomy();
  }, [fetchProducts, fetchTaxonomy]);

  /* ── Filtered / paginated ── */
  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
      const matchBrand = brandFilter === "__all__" || p.brand === brandFilter;
      const matchCategory = categoryFilter === "__all__" || p.category === categoryFilter;
      const matchStatus =
        statusFilter === "__all__" ||
        (statusFilter === "active" && p.status === "active") ||
        (statusFilter === "inactive" && p.status === "inactive");
      const matchUserType =
        userTypeFilter === "__all__" ||
        (userTypeFilter === "professional" && p.badges.isProfessionalOnly) ||
        (userTypeFilter === "retail" && !p.badges.isProfessionalOnly);
      return matchSearch && matchBrand && matchCategory && matchStatus && matchUserType;
    });
  }, [products, search, brandFilter, categoryFilter, statusFilter, userTypeFilter, t]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  /* ── Form helpers ── */
  const updateForm = useCallback(<K extends keyof Omit<Product, "id">>(key: K, value: Omit<Product, "id">[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const openAddPanel = () => {
    setEditingProduct(null);
    setFormData(defaultFormData());
    setDiscountInput("");
    setActiveTab("osnovno");
    setShowPanel(true);
  };

  const openEditPanel = async (product: Product) => {
    setEditingProduct(product);
    const { id: _id, ...rest } = product;
    setFormData(rest);
    setActiveTab("osnovno");
    setShowPanel(true);

    // Fetch full product detail to get all fields (costPrice, description, etc.)
    try {
      const res = await fetch(`/api/products/${product.id}`);
      const json = await res.json();
      if (json.success) {
        const p = json.data;
        setFormData(prev => ({
          ...prev,
          purchasePrice: p.costPrice ? Number(p.costPrice) : 0,
          description: p.description || "",
          benefits: p.benefits || "",
          ingredients: p.ingredients || "",
          declaration: p.declaration || "",
          howToUse: p.usageInstructions || "",
          weight: p.weightGrams || 0,
          volume: p.volumeMl || 0,
          lowStockThreshold: p.lowStockThreshold || 5,
          stock: p.stockQuantity || 0,
          status: p.isActive ? "active" as const : "inactive" as const,
          seoTitle: p.seoTitle || "",
          metaDescription: p.seoDescription || "",
          images: p.images?.map((img: { id: string; url: string; altText: string | null; isPrimary: boolean }) => ({
            id: img.id, url: img.url, alt: img.altText || "", isPrimary: img.isPrimary,
          })) || prev.images,
        }));
      }
    } catch { /* keep form data as-is */ }

    if (product.oldPrice && product.oldPrice > product.priceB2C) {
      setDiscountInput(Math.round(((product.oldPrice - product.priceB2C) / product.oldPrice) * 100).toString());
    } else {
      setDiscountInput("");
    }
  };

  const handleSave = async () => {
    // Validate required fields
    const errors: string[] = [];
    if (!formData.name.trim()) errors.push(t("admin.productName"));
    if (!formData.sku.trim()) errors.push(t("admin.skuCode"));
    if (formData.badges.isProfessionalOnly) {
      if (!formData.priceB2B || formData.priceB2B <= 0) errors.push(t("admin.priceB2b"));
    } else {
      if (!formData.priceB2C || formData.priceB2C <= 0) errors.push(t("admin.priceB2c"));
    }
    if (formData.stock === undefined || formData.stock < 0) errors.push(t("admin.stockQuantity"));

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setSaving(true);
    const apiBody = {
      nameLat: formData.name,
      sku: formData.sku,
      // Send taxonomy as names; the API resolves (find-or-create) to FK ids so
      // newly added categories/brands persist and show up in client filters.
      brand: formData.brand || null,
      productLine: formData.productLine || null,
      category: formData.category || null,
      subCategory: formData.subCategory || null,
      // B2B-only products still need a non-null priceB2c (schema constraint);
      // mirror priceB2b into priceB2c so the DB is satisfied and the public
      // storefront — which only ever reads priceB2c for unauth'd users — has a
      // sensible fallback price to hide behind the "sign-in for wholesale" UX.
      priceB2c: formData.badges.isProfessionalOnly
        ? (formData.priceB2C || formData.priceB2B)
        : formData.priceB2C,
      priceB2b: formData.priceB2B || null,
      oldPrice: formData.oldPrice || null,
      costPrice: formData.purchasePrice > 0 ? formData.purchasePrice : null,
      stockQuantity: formData.stock,
      lowStockThreshold: formData.lowStockThreshold,
      weightGrams: formData.weight || null,
      volumeMl: formData.volume || null,
      description: formData.description || null,
      benefits: formData.benefits || null,
      ingredients: formData.ingredients || null,
      declaration: formData.declaration || null,
      usageInstructions: formData.howToUse || null,
      isProfessional: formData.badges.isProfessionalOnly,
      isNew: formData.badges.isNew,
      isFeatured: formData.badges.isFeatured,
      isBestseller: formData.badges.isBestseller,
      isActive: formData.status === "active",
      barcode: formData.barcode || null,
      vatRate: formData.vatRate || 20,
      vatCode: formData.vatCode || (formData.vatRate === 10 ? "R1" : "R2"),
      erpId: formData.erpId || null,
      seoTitle: formData.seoTitle || null,
      seoDescription: formData.metaDescription || null,
      slug: formData.slug || null,
      // Color data — only include if a color level is actually set
      ...(formData.colorLevel ? {
        colorLevel: formData.colorLevel,
        undertoneCode: formData.colorUndertone || "N",
        undertoneName: colorUndertones.find(u => u.value === formData.colorUndertone)?.label.split(" - ")[1] || "Neutralni",
        hexValue: formData.colorHex || "#000000",
        shadeCode: formData.shadeCode || "",
      } : {
        ...(formData.removeColor ? { removeColor: true } : {}),
      }),
      images: formData.images.map(img => ({ url: img.url, altText: img.alt, isPrimary: img.isPrimary })),
    };

    try {
      if (editingProduct) {
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiBody),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.success === false) {
          setValidationErrors([data?.error || `Greška pri čuvanju (${res.status})`]);
          setSaving(false);
          return;
        }
        // Re-fetch from server so list reflects persisted DB state (avoids stale optimistic data)
        fetchProducts();
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiBody),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.success === false) {
          setValidationErrors([data?.error || `Greška pri čuvanju (${res.status})`]);
          setSaving(false);
          return;
        }
        const newProduct: Product = {
          ...formData,
          id: data.data.id,
          images: formData.images.length > 0 ? formData.images : [{ id: 1, url: "/products/placeholder.jpg", alt: formData.name, isPrimary: true }],
        };
        setProducts([newProduct, ...products]);
      }
    } catch (err) {
      console.error("Save failed:", err);
      setValidationErrors([(err as Error).message || "Greška pri čuvanju"]);
      setSaving(false);
      return;
    }
    setSaving(false);
    setShowPanel(false);
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        setValidationErrors([data?.error || `Greška pri brisanju (${res.status})`]);
        return;
      }
      // Soft-delete fallback (product had order history): show an info notice
      // instead of silently leaving the row in place.
      if (data?.data?.soft) {
        setValidationErrors([data.data.message || "Proizvod je deaktiviran umesto trajno obrisan."]);
      }
    } catch (err) {
      console.error("Delete failed:", err);
      setValidationErrors([(err as Error).message || "Greška pri brisanju"]);
      return;
    }
    setSelectedIds(selectedIds.filter((sid) => sid !== id));
    // Re-fetch so the list reflects whether the row was actually removed
    // (hard delete) or just deactivated (soft delete fallback).
    fetchProducts();
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]));
  };

  const selectAll = () => {
    if (selectedIds.length === paginated.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginated.map((p) => p.id));
    }
  };

  const bulkAction = async (action: string) => {
    const promises = selectedIds.map(id => {
      if (action === "delete") {
        return fetch(`/api/products/${id}`, { method: "DELETE" });
      } else if (action === "activate") {
        return fetch(`/api/products/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: true }) });
      } else if (action === "deactivate") {
        return fetch(`/api/products/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: false }) });
      }
      return Promise.resolve();
    });
    await Promise.all(promises);

    if (action === "activate") {
      setProducts(products.map((p) => (selectedIds.includes(p.id) ? { ...p, status: "active" as const } : p)));
    } else if (action === "deactivate") {
      setProducts(products.map((p) => (selectedIds.includes(p.id) ? { ...p, status: "inactive" as const } : p)));
    }
    setSelectedIds([]);
    if (action === "delete") {
      // Re-fetch — some rows may have soft-fallen-back to deactivated due to
      // order history, so trust the server rather than guessing locally.
      fetchProducts();
    }
    setShowBulkMenu(false);
  };

  /* ── Auto slug from name ── */
  const handleNameChange = (val: string) => {
    updateForm("name", val);
    if (!editingProduct || formData.slug === slugify(formData.name)) {
      updateForm("slug", slugify(val));
    }
  };

  /* ── Discount <-> OldPrice sync ── */
  const handleOldPriceChange = (val: string) => {
    const old = Number(val) || 0;
    updateForm("oldPrice", old || undefined);
    if (old > 0 && formData.priceB2C > 0) {
      setDiscountInput(Math.round(((old - formData.priceB2C) / old) * 100).toString());
    } else {
      setDiscountInput("");
    }
  };

  const handleDiscountChange = (val: string) => {
    setDiscountInput(val);
    const disc = Number(val) || 0;
    if (disc > 0 && disc < 100 && formData.priceB2C > 0) {
      const old = Math.round(formData.priceB2C / (1 - disc / 100));
      updateForm("oldPrice", old);
    }
  };

  /* ── Computed ── */
  const discountPercent =
    formData.oldPrice && formData.oldPrice > formData.priceB2C
      ? Math.round(((formData.oldPrice - formData.priceB2C) / formData.oldPrice) * 100)
      : 0;

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "osnovno", label: t("admin.productName"), icon: <Layers size={16} /> },
    { key: "cene", label: t("admin.priceB2c").replace(/ B2C/, ""), icon: <BarChart3 size={16} /> },
    { key: "sadrzaj", label: t("admin.productDescription"), icon: <FileImage size={16} /> },
    { key: "mediji", label: t("admin.productImages"), icon: <ImageIcon size={16} /> },
    { key: "zalihe", label: t("admin.stock"), icon: <Package size={16} /> },
  ];

  /* ── Common input class ── */
  const inputCls = "w-full px-4 py-2.5 border border-stone-200 rounded-sm text-sm focus:outline-none focus:border-black bg-white text-black placeholder:text-[#837A64]";
  const labelCls = "block text-sm font-medium text-[#2e2e2e] mb-1.5";
  const sectionCls = "space-y-5";

  /* ───────────────────── RENDER ───────────────────── */

  return (
    <div className="space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-black">{t("admin.products")}</h1>
          <p className="text-sm text-[#837A64] mt-1">{products.length} {t("admin.totalProducts")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openAddPanel}
            className="px-5 py-2.5 rounded-sm text-sm flex items-center gap-2 bg-black text-white hover:bg-stone-800 transition-colors"
          >
            <Plus size={18} />
            {t("admin.addProduct")}
          </button>
          <Link
            href="/admin/import"
            className="px-4 py-2.5 rounded-sm text-sm flex items-center gap-2 bg-black text-white hover:bg-stone-800 transition-colors"
          >
            <Upload size={16} />
            {t("admin.importCsv")}
          </Link>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-sm border border-stone-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#837A64]" />
            <input
              type="text"
              placeholder={t("admin.searchByNameOrCode")}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-stone-100 border border-transparent rounded-sm text-sm focus:bg-white focus:border-black focus:outline-none"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden flex items-center gap-2 px-4 py-2.5 bg-stone-100 rounded-sm text-sm text-[#837A64]"
          >
            <Filter size={16} />
            {t("admin.filters")}
          </button>
          <div className={`${showFilters ? "flex" : "hidden"} sm:flex flex-col sm:flex-row gap-3`}>
            <select value={brandFilter} onChange={(e) => { setBrandFilter(e.target.value); setCurrentPage(1); }} className="px-3 py-2.5 bg-stone-100 border border-transparent rounded-sm text-sm cursor-pointer focus:border-black focus:outline-none">
              <option value="__all__">{t("admin.allBrands")}</option>
              {availableBrands.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }} className="px-3 py-2.5 bg-stone-100 border border-transparent rounded-sm text-sm cursor-pointer focus:border-black focus:outline-none">
              <option value="__all__">{t("admin.allCategories")}</option>
              {allCategoryNames.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={userTypeFilter} onChange={(e) => { setUserTypeFilter(e.target.value); setCurrentPage(1); }} className="px-3 py-2.5 bg-stone-100 border border-transparent rounded-sm text-sm cursor-pointer focus:border-black focus:outline-none">
              <option value="__all__">Svi korisnici</option>
              <option value="retail">B2C (maloprodaja)</option>
              <option value="professional">B2B (profesionalci)</option>
            </select>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="px-3 py-2.5 bg-stone-100 border border-transparent rounded-sm text-sm cursor-pointer focus:border-black focus:outline-none">
              <option value="__all__">{t("admin.allStatuses")}</option>
              <option value="active">{t("admin.active")}</option>
              <option value="inactive">{t("admin.inactive")}</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[#FFFFFF] flex items-center gap-3">
            <span className="text-sm text-[#837A64]">{selectedIds.length} {t("admin.selected")}</span>
            <div className="relative">
              <button
                onClick={() => setShowBulkMenu(!showBulkMenu)}
                className="px-3 py-1.5 bg-black text-white rounded-sm text-sm flex items-center gap-1"
              >
                {t("admin.actions")} <MoreVertical size={14} />
              </button>
              {showBulkMenu && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-sm shadow-xl border border-stone-200 overflow-hidden z-10">
                  <button onClick={() => bulkAction("activate")} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[#2e2e2e] hover:bg-stone-100">
                    <Eye size={14} /> {t("admin.activate")}
                  </button>
                  <button onClick={() => bulkAction("deactivate")} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[#2e2e2e] hover:bg-stone-100">
                    <EyeOff size={14} /> {t("admin.deactivate")}
                  </button>
                  <button onClick={() => bulkAction("delete")} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50">
                    <Trash2 size={14} /> {t("admin.delete")}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-sm border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-stone-100 border-b border-stone-200">
                <th className="px-4 py-3 text-left">
                  <button onClick={selectAll} className="text-[#837A64] hover:text-black">
                    {selectedIds.length === paginated.length && paginated.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#837A64] uppercase tracking-wider">{t("admin.product")}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#837A64] uppercase tracking-wider">{t("admin.sku")}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#837A64] uppercase tracking-wider">{t("admin.brand")}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#837A64] uppercase tracking-wider">{t("admin.category")}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#837A64] uppercase tracking-wider">{t("admin.priceB2c")}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#837A64] uppercase tracking-wider">{t("admin.priceB2b")}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#837A64] uppercase tracking-wider">{t("admin.stock")}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#837A64] uppercase tracking-wider">{t("admin.status")}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#837A64] uppercase tracking-wider">{t("admin.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FFFFFF]">
              {paginated.map((product) => (
                <tr key={product.id} className="hover:bg-stone-100 transition-colors">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleSelect(product.id)}
                      aria-label={selectedIds.includes(product.id) ? t("admin.deselectRow") : t("admin.selectRow")}
                      aria-pressed={selectedIds.includes(product.id)}
                      className="text-[#837A64] hover:text-black"
                    >
                      {selectedIds.includes(product.id) ? <CheckSquare size={18} className="text-secondary" /> : <Square size={18} />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-sm bg-stone-100 flex items-center justify-center flex-shrink-0">
                        <Package size={18} className="text-[#837A64]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-black truncate max-w-[200px]">{product.name}</p>
                          {product.badges.isProfessionalOnly && (
                            <span className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-black/10 text-secondary">
                              <ShieldCheck size={10} /> B2B
                            </span>
                          )}
                          {product.badges.isNew && (
                            <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">{t("admin.new")}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-[#837A64]">{product.sku}</td>
                  <td className="px-4 py-3 text-sm text-[#2e2e2e]">{product.brand}</td>
                  <td className="px-4 py-3 text-sm text-[#2e2e2e]">{product.category}</td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="text-sm font-medium text-black">{product.priceB2C.toLocaleString()} RSD</span>
                      {product.oldPrice && (
                        <span className="block text-xs text-[#837A64] line-through">{product.oldPrice.toLocaleString()} RSD</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#2e2e2e]">{product.priceB2B.toLocaleString()} RSD</td>
                  <td className="px-4 py-3 ">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-medium ${product.stock <= product.lowStockThreshold ? "text-red-500" : product.stock <= product.lowStockThreshold * 2 ? "text-orange-500" : "text-[#2e2e2e]"}`}>
                        {product.stock}
                      </span>
                      {product.stock <= product.lowStockThreshold && (
                        <AlertTriangle size={14} className="text-red-400" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 ">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${product.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {product.status === "active" ? t("admin.active") : t("admin.inactive")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditPanel(product)}
                        aria-label={`${t("admin.editProduct")}: ${product.name}`}
                        title={t("admin.editProduct")}
                        className="p-1.5 text-[#837A64] hover:text-secondary hover:bg-black/10 rounded-sm transition-colors"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        aria-label={`${t("admin.deleteProduct")}: ${product.name}`}
                        title={t("admin.deleteProduct")}
                        className="p-1.5 text-[#837A64] hover:text-red-500 hover:bg-red-50 rounded-sm transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-sm text-[#837A64]">
                    {t("admin.noProductsMatch")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-stone-200 flex items-center justify-between">
            <span className="text-sm text-[#837A64]">
              {t("admin.showing")} {(currentPage - 1) * perPage + 1}&ndash;{Math.min(currentPage * perPage, filtered.length)} {t("admin.of")} {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-sm text-[#837A64] hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 rounded-sm text-sm font-medium transition-colors ${page === currentPage ? "bg-black text-white" : "text-[#837A64] hover:bg-stone-100"}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-sm text-[#837A64] hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ────────────────── SLIDE-OVER PANEL ────────────────── */}
      {showPanel && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowPanel(false)} />

          {/* Panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[75%] lg:w-[60%] bg-white shadow-2xl flex flex-col animate-slideInRight">
            {/* Panel Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-white">
              <h2 className="text-lg font-serif font-bold text-black">
                {editingProduct ? t("admin.editProduct") : t("admin.addProduct")}
              </h2>
              <button onClick={() => setShowPanel(false)} className="p-2 text-[#837A64] hover:text-black hover:bg-stone-100 rounded-sm transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Tab Bar */}
            <div className="flex-shrink-0 border-b border-stone-200 bg-[#FFFFFF] overflow-x-auto">
              <div className="flex min-w-max px-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.key
                        ? "border-black text-secondary"
                        : "border-transparent text-[#837A64] hover:text-black hover:border-[#D8CFBC]"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content (scrollable) */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* ── Tab: Osnovno ── */}
              {activeTab === "osnovno" && (
                <div className={sectionCls}>
                  <div>
                    <label className={labelCls}>{t("admin.productName")} *</label>
                    <input type="text" value={formData.name} onChange={(e) => handleNameChange(e.target.value)} className={inputCls} placeholder={t("admin.enterProductName")} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>{t("admin.skuCode")} *</label>
                      <input type="text" value={formData.sku} onChange={(e) => updateForm("sku", e.target.value)} className={inputCls} placeholder="npr. LOR-MJ-600" />
                    </div>
                    <div>
                      <label className={labelCls}>Barkod (EAN)</label>
                      <input type="text" value={formData.barcode} onChange={(e) => updateForm("barcode", e.target.value)} className={inputCls} placeholder="npr. 3474630715530" />
                    </div>
                  </div>

                  {/* ERP Info (read-only) */}
                  {(formData.erpId || formData.vatCode) && (
                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-sm">
                      <label className="text-[10px] uppercase tracking-wider text-[#837A64] font-medium">ERP / Pantheon</label>
                      <div className="flex gap-6 mt-1.5 text-sm text-[#837A64]">
                        {formData.erpId && <span>ERP ID: <strong className="text-black">{formData.erpId}</strong></span>}
                        <span>PDV kod: <strong className="text-black">{formData.vatCode || "R2"}</strong></span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>{t("admin.brand")}</label>
                      <select
                        value={formData.brand}
                        onChange={(e) => {
                          const newBrand = e.target.value;
                          updateForm("brand", newBrand);
                          const lines = getProductLinesForBrand(newBrand);
                          updateForm("productLine", lines[0] || "");
                        }}
                        className={inputCls + " cursor-pointer"}
                      >
                        {availableBrands.map((b) => <option key={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>{t("admin.productLine")}</label>
                      <select value={formData.productLine} onChange={(e) => updateForm("productLine", e.target.value)} className={inputCls + " cursor-pointer"}>
                        {getProductLinesForBrand(formData.brand).map((l) => <option key={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>{t("admin.category")}</label>
                      <div className="flex gap-2">
                        <select
                          value={formData.category}
                          onChange={(e) => {
                            const cat = e.target.value;
                            updateForm("category", cat);
                            const subs = getAllSubcategories(cat);
                            updateForm("subCategory", subs[0] || "");
                          }}
                          className={inputCls + " cursor-pointer flex-1"}
                        >
                          {allCategoryNames.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <button
                          type="button"
                          onClick={() => setShowNewCategory(!showNewCategory)}
                          className="px-3 py-2 border border-stone-200 rounded-sm text-xs font-medium text-secondary hover:bg-stone-50 transition-colors whitespace-nowrap"
                        >
                          + Nova
                        </button>
                      </div>
                      {showNewCategory && (
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="Naziv nove kategorije"
                            className={inputCls + " flex-1"}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newCategoryName.trim()) {
                                const name = newCategoryName.trim();
                                setCustomCategories((prev) => ({ ...prev, [name]: prev[name] || [] }));
                                updateForm("category", name);
                                updateForm("subCategory", "");
                                setNewCategoryName("");
                                setShowNewCategory(false);
                              }
                            }}
                            className="px-4 py-2 bg-black text-white rounded-sm text-xs font-medium hover:bg-stone-800 transition-colors"
                          >
                            Dodaj
                          </button>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className={labelCls}>{t("admin.subcategory")}</label>
                      <div className="flex gap-2">
                        <select value={formData.subCategory} onChange={(e) => updateForm("subCategory", e.target.value)} className={inputCls + " cursor-pointer flex-1"}>
                          {getAllSubcategories(formData.category).map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button
                          type="button"
                          onClick={() => setShowNewSubCategory(!showNewSubCategory)}
                          className="px-3 py-2 border border-stone-200 rounded-sm text-xs font-medium text-secondary hover:bg-stone-50 transition-colors whitespace-nowrap"
                        >
                          + Nova
                        </button>
                      </div>
                      {showNewSubCategory && (
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            value={newSubCategoryName}
                            onChange={(e) => setNewSubCategoryName(e.target.value)}
                            placeholder="Naziv nove podkategorije"
                            className={inputCls + " flex-1"}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newSubCategoryName.trim()) {
                                const name = newSubCategoryName.trim();
                                const cat = formData.category;
                                setCustomCategories((prev) => ({
                                  ...prev,
                                  [cat]: [...(prev[cat] || []), name],
                                }));
                                updateForm("subCategory", name);
                                setNewSubCategoryName("");
                                setShowNewSubCategory(false);
                              }
                            }}
                            className="px-4 py-2 bg-black text-white rounded-sm text-xs font-medium hover:bg-stone-800 transition-colors"
                          >
                            Dodaj
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status toggle */}
                  <div>
                    <label className={labelCls}>{t("admin.status")}</label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => updateForm("status", formData.status === "active" ? "inactive" : "active")}
                        className={`relative w-12 h-6 rounded-full transition-colors ${formData.status === "active" ? "bg-black" : "bg-gray-300"}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.status === "active" ? "translate-x-[26px]" : "translate-x-[2px]"}`} />
                      </button>
                      <span className="text-sm text-[#837A64]">{formData.status === "active" ? t("admin.active") : t("admin.inactive")}</span>
                    </div>
                  </div>

                  {/* Badges */}
                  <div>
                    <label className={labelCls}>{t("admin.badgesLabels")}</label>
                    <div className="flex flex-wrap gap-4 mt-1">
                      {([
                        { key: "isNew" as const, label: t("admin.new") },
                        { key: "isFeatured" as const, label: t("admin.featured") },
                        { key: "isBestseller" as const, label: t("admin.bestseller") },
                        { key: "isProfessionalOnly" as const, label: t("admin.professionalOnly") },
                      ]).map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.badges[key]}
                            onChange={(e) => updateForm("badges", { ...formData.badges, [key]: e.target.checked })}
                            className="w-4 h-4 rounded border-stone-200 text-secondary accent-[#837A64]"
                          />
                          <span className="text-sm text-[#2e2e2e]">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* ── Color section — only for color-related categories ── */}
                  {(formData.category === "Kolor" || formData.category === "Boje za kosu") && (
                    <>
                      <div className="border-t border-stone-200 pt-5 mt-2">
                        <div className="flex items-center gap-2 mb-4">
                          <Palette size={18} className="text-secondary" />
                          <h3 className="text-sm font-semibold text-black">Podaci o boji</h3>
                        </div>
                        <div className="p-3 bg-stone-100 rounded-sm text-xs text-stone-500 flex items-center gap-2 mb-5">
                          <Palette size={16} className="text-secondary" />
                          Dodelite boju proizvodu — podaci se koriste za vizuelni prikaz i filtriranje na sajtu.
                        </div>

                        {/* Level selector — visual */}
                        <div className="mb-5">
                          <label className={labelCls}>Ton (1-10)</label>
                          <div className="flex gap-1.5">
                            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                              const levelHex = [
                                "#1a1a1a", "#2d1f1a", "#3d2b1a", "#5a3825", "#6b4226",
                                "#7a5533", "#8B6914", "#B8860B", "#D4A843", "#F5E6B8",
                              ][n - 1];
                              return (
                                <button
                                  key={n}
                                  type="button"
                                  onClick={() => { updateForm("colorLevel", formData.colorLevel === n ? undefined : n); updateForm("removeColor", undefined); }}
                                  className={`w-9 h-9 rounded-sm text-xs font-bold transition-all border-2 ${
                                    formData.colorLevel === n
                                      ? "border-black ring-2 ring-black/20 scale-110"
                                      : "border-transparent hover:border-stone-400"
                                  }`}
                                  style={{ backgroundColor: levelHex, color: n <= 5 ? "#fff" : "#000" }}
                                >
                                  {n}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Undertone selector — visual chips */}
                        <div className="mb-5">
                          <label className={labelCls}>Pod ton</label>
                          <div className="flex flex-wrap gap-2">
                            {colorUndertones.map((u) => (
                              <button
                                key={u.value}
                                type="button"
                                onClick={() => updateForm("colorUndertone", formData.colorUndertone === u.value ? undefined : u.value)}
                                className={`px-3 py-1.5 text-xs font-medium border transition-all rounded-sm ${
                                  formData.colorUndertone === u.value
                                    ? "bg-black text-white border-black"
                                    : "bg-white text-stone-600 border-stone-200 hover:border-black"
                                }`}
                              >
                                {u.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                          <div>
                            <label className={labelCls}>Šifra boje</label>
                            <input type="text" value={formData.shadeCode || ""} onChange={(e) => updateForm("shadeCode", e.target.value)} className={inputCls} placeholder="npr. 7-0, 8/1, 6.44" />
                          </div>
                          <div>
                            <label className={labelCls}>Hexa kod boje</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={formData.colorHex || "#000000"}
                                onChange={(e) => updateForm("colorHex", e.target.value)}
                                className="w-10 h-10 rounded-sm border border-stone-200 cursor-pointer p-0.5"
                              />
                              <input
                                type="text"
                                value={formData.colorHex || ""}
                                onChange={(e) => updateForm("colorHex", e.target.value)}
                                className={inputCls}
                                placeholder="#8B6914"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Live color preview */}
                        {(formData.colorHex || formData.colorLevel) && (
                          <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-sm border border-stone-200">
                            <div
                              className="w-14 h-14 rounded-full border-2 border-white shadow-md flex-shrink-0"
                              style={{ backgroundColor: formData.colorHex || "#888" }}
                            />
                            <div>
                              <p className="text-sm font-bold text-black">
                                {formData.shadeCode || "—"} &mdash; Ton {formData.colorLevel || "?"} / {colorUndertones.find((u) => u.value === formData.colorUndertone)?.label || "—"}
                              </p>
                              <p className="text-xs text-stone-400 mt-0.5 font-mono">{formData.colorHex || "Bez boje"}</p>
                            </div>
                            {formData.colorHex && (
                              <button
                                type="button"
                                onClick={() => {
                                  updateForm("colorLevel", undefined);
                                  updateForm("colorUndertone", undefined);
                                  updateForm("colorHex", undefined);
                                  updateForm("shadeCode", undefined);
                                  updateForm("removeColor", true);
                                }}
                                className="ml-auto text-xs text-stone-400 hover:text-red-500 transition-colors"
                              >
                                Ukloni boju
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── Tab: Cene ── */}
              {activeTab === "cene" && (
                <div className={sectionCls}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>{formData.badges.isProfessionalOnly ? t("admin.priceB2b") : t("admin.priceB2c")} (RSD) *</label>
                      <input
                        type="number"
                        value={formData.badges.isProfessionalOnly ? (formData.priceB2B || "") : (formData.priceB2C || "")}
                        onChange={(e) => updateForm(formData.badges.isProfessionalOnly ? "priceB2B" : "priceB2C", Number(e.target.value) || 0)}
                        className={inputCls}
                        placeholder="0"
                      />
                    </div>
                    {!formData.badges.isProfessionalOnly && (
                      <div>
                        <label className={labelCls}>{t("admin.priceB2b")} (RSD)</label>
                        <input
                          type="number"
                          value={formData.priceB2B || ""}
                          onChange={(e) => updateForm("priceB2B", Number(e.target.value) || 0)}
                          className={inputCls}
                          placeholder="0"
                        />
                      </div>
                    )}
                  </div>


                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>{t("admin.purchasePrice")}</label>
                      <input
                        type="number"
                        value={formData.purchasePrice || ""}
                        onChange={(e) => updateForm("purchasePrice", Number(e.target.value) || 0)}
                        className={inputCls}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>PDV stopa</label>
                      <select
                        value={formData.vatRate}
                        onChange={(e) => {
                          const rate = Number(e.target.value);
                          updateForm("vatRate", rate);
                          updateForm("vatCode", rate === 10 ? "R1" : "R2");
                        }}
                        className={inputCls + " cursor-pointer"}
                      >
                        <option value={20}>20% (opšta stopa)</option>
                        <option value={10}>10% (posebna stopa)</option>
                      </select>
                    </div>
                  </div>

                  {/* Margin info */}
                  {formData.purchasePrice > 0 && formData.priceB2C > 0 && (
                    <div className="p-3 bg-stone-100 rounded-sm text-sm text-[#837A64]">
                      {t("admin.marginB2c")}: <strong className="text-black">{Math.round(((formData.priceB2C - formData.purchasePrice) / formData.priceB2C) * 100)}%</strong>
                      {formData.priceB2B > 0 && (
                        <span className="ml-4">{t("admin.marginB2b")}: <strong className="text-black">{Math.round(((formData.priceB2B - formData.purchasePrice) / formData.priceB2B) * 100)}%</strong></span>
                      )}
                    </div>
                  )}

                  {/* Price Preview */}
                  <div>
                    <label className={labelCls}>{t("admin.pricePreview")}</label>
                    <div className="border border-stone-200 rounded-sm p-4 bg-[#FFFFFF]">
                      <div className="flex items-baseline gap-3">
                        {formData.badges.isProfessionalOnly ? (
                          <span className="text-2xl font-bold text-green-700">{(formData.priceB2B || 0).toLocaleString()} RSD <span className="text-sm font-normal text-green-600">B2B</span></span>
                        ) : (
                          <>
                            <span className="text-2xl font-bold text-black">{(formData.priceB2C || 0).toLocaleString()} RSD</span>
                            {formData.priceB2B > 0 && (
                              <span className="text-sm text-green-700 font-medium">B2B: {formData.priceB2B.toLocaleString()} RSD</span>
                            )}
                          </>
                        )}
                      </div>
                      {formData.badges.isProfessionalOnly && (
                        <p className="text-xs text-secondary mt-1 flex items-center gap-1"><ShieldCheck size={12} /> {t("admin.forProfessionals")}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Tab: Sadr\u017eaj ── */}
              {activeTab === "sadrzaj" && (
                <div className={sectionCls}>
                  <div>
                    <label className={labelCls}>{t("admin.productDescription")}</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => updateForm("description", e.target.value)}
                      rows={4}
                      className={inputCls + " resize-y"}
                      placeholder={t("admin.detailedDescription")}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>{t("admin.benefits")}</label>
                    <textarea
                      value={formData.benefits || ""}
                      onChange={(e) => updateForm("benefits", e.target.value)}
                      rows={4}
                      className={inputCls + " resize-y"}
                      placeholder={t("admin.benefitsPlaceholder")}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>{t("admin.ingredients")}</label>
                    <textarea
                      value={formData.ingredients}
                      onChange={(e) => updateForm("ingredients", e.target.value)}
                      rows={4}
                      className={inputCls + " resize-y"}
                      placeholder="Aqua, Sodium Laureth Sulfate..."
                    />
                  </div>
                  <div>
                    <label className={labelCls}>{t("admin.declaration")}</label>
                    <textarea
                      value={formData.declaration || ""}
                      onChange={(e) => updateForm("declaration", e.target.value)}
                      rows={4}
                      className={inputCls + " resize-y"}
                      placeholder={t("admin.declarationPlaceholder")}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>{t("admin.howToUse")}</label>
                    <textarea
                      value={formData.howToUse}
                      onChange={(e) => updateForm("howToUse", e.target.value)}
                      rows={4}
                      className={inputCls + " resize-y"}
                      placeholder="Nanesite na mokru kosu..."
                    />
                  </div>
                </div>
              )}

              {/* ── Tab: Mediji ── */}
              {activeTab === "mediji" && (
                <div className={sectionCls}>
                  <div>
                    <label className={labelCls}>{t("admin.productImages")}</label>
                    <p className="text-xs text-[#837A64] mb-3">{t("admin.dragImages")}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {formData.images.map((img, idx) => (
                        <div key={img.id} className="relative group border border-stone-200 rounded-sm overflow-hidden aspect-square bg-stone-100 flex items-center justify-center">
                          {img.url.startsWith("/uploads/") ? (
                            <Image src={img.url} alt={img.alt} width={80} height={80} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center p-2">
                              <ImageIcon size={28} className="mx-auto text-[#D8CFBC] mb-1" />
                              <p className="text-[10px] text-[#837A64] truncate max-w-full">{img.url.split("/").pop()}</p>
                            </div>
                          )}
                          {img.isPrimary && (
                            <div className="absolute top-1 left-1 bg-black text-white px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5">
                              <Star size={10} /> {t("admin.mainImage")}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              onClick={() => updateForm("images", formData.images.filter((_, i) => i !== idx))}
                              className="p-1.5 bg-white rounded-sm text-red-500 hover:bg-red-50"
                              title={t("admin.remove")}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Upload image */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        multiple
                        className="hidden"
                        onChange={async (e) => {
                          const files = e.target.files;
                          if (!files || files.length === 0) return;
                          setUploading(true);
                          try {
                            const newImages = [...formData.images];
                            for (const file of Array.from(files)) {
                              const fd = new FormData();
                              fd.append("file", file);
                              const res = await fetch("/api/upload", { method: "POST", body: fd });
                              const data = await res.json();
                              if (data.success) {
                                const newId = Math.max(0, ...newImages.map((i) => i.id)) + 1;
                                newImages.push({
                                  id: newId,
                                  url: data.data.url,
                                  alt: formData.name || file.name,
                                  isPrimary: newImages.length === 0,
                                });
                              }
                            }
                            updateForm("images", newImages);
                          } catch (err) {
                            console.error("Upload failed:", err);
                          } finally {
                            setUploading(false);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }
                        }}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="border-2 border-dashed border-stone-200 rounded-sm aspect-square flex flex-col items-center justify-center gap-2 text-[#837A64] hover:border-black hover:text-secondary transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {uploading ? (
                          <>
                            <div className="w-6 h-6 border-2 border-stone-300 border-t-black rounded-full animate-spin" />
                            <span className="text-xs">Upload...</span>
                          </>
                        ) : (
                          <>
                            <Upload size={24} />
                            <span className="text-xs">{t("admin.addImage")}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Alt texts */}
                  {formData.images.length > 0 && (
                    <div>
                      <label className={labelCls}>{t("admin.altTexts")}</label>
                      <div className="space-y-2">
                        {formData.images.map((img, idx) => (
                          <div key={img.id} className="flex items-center gap-2">
                            <span className="text-xs text-[#837A64] w-20 flex-shrink-0 truncate">{img.url.split("/").pop()}</span>
                            <input
                              type="text"
                              value={img.alt}
                              onChange={(e) => {
                                const updated = [...formData.images];
                                updated[idx] = { ...updated[idx], alt: e.target.value };
                                updateForm("images", updated);
                              }}
                              className={inputCls}
                              placeholder={t("admin.altText")}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* ── Tab: Zalihe ── */}
              {activeTab === "zalihe" && (
                <div className={sectionCls}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>{t("admin.stockQuantity")} *</label>
                      <input type="number" value={formData.stock || ""} onChange={(e) => updateForm("stock", Number(e.target.value) || 0)} className={inputCls} placeholder="0" min={0} />
                    </div>
                    <div>
                      <label className={labelCls}>{t("admin.lowStockWarning")}</label>
                      <input type="number" value={formData.lowStockThreshold || ""} onChange={(e) => updateForm("lowStockThreshold", Number(e.target.value) || 0)} className={inputCls} placeholder="10" min={0} />
                    </div>
                  </div>

                  {formData.stock > 0 && formData.stock <= formData.lowStockThreshold && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-sm text-sm text-red-600">
                      <AlertTriangle size={16} />
                      Zalihe su ispod praga upozorenja ({formData.lowStockThreshold}).
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>{t("admin.weight")}</label>
                      <input type="number" value={formData.weight || ""} onChange={(e) => updateForm("weight", Number(e.target.value) || 0)} className={inputCls} placeholder="0" min={0} />
                    </div>
                    <div>
                      <label className={labelCls}>{t("admin.volume")}</label>
                      <input type="number" value={formData.volume || ""} onChange={(e) => updateForm("volume", Number(e.target.value) || 0)} className={inputCls} placeholder="0" min={0} />
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Panel Footer (fixed) */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-stone-200 bg-white flex items-center justify-between">
              <button
                onClick={() => setShowPanel(false)}
                className="px-5 py-2.5 rounded-sm text-sm font-medium text-[#837A64] hover:bg-stone-100 transition-colors"
              >
                {t("admin.cancel")}
              </button>
              <button onClick={handleSave} disabled={saving} className="bg-black text-white hover:bg-stone-800 transition-colors px-6 py-2.5 rounded-sm text-sm font-medium disabled:opacity-50">
                {saving ? t("admin.saving") : editingProduct ? t("admin.saveChanges") : t("admin.addProduct")}
              </button>
            </div>
          </div>

          {/* Slide-in animation style */}
          <style jsx>{`
            @keyframes slideInRight {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
            .animate-slideInRight {
              animation: slideInRight 0.3s ease-out;
            }
          `}</style>
        </>
      )}

      {/* Validation errors modal */}
      {validationErrors.length > 0 && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-sm shadow-xl max-w-sm w-full mx-4 overflow-hidden">
            <div className="flex items-center gap-3 px-6 pt-6 pb-2">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <h3 className="text-lg font-serif font-bold text-black">{t("admin.requiredFields") || "Obavezna polja"}</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-[#837A64] mb-3">{t("admin.fillRequiredFields") || "Popunite sva obavezna polja pre nego što sačuvate proizvod:"}</p>
              <ul className="space-y-1.5">
                {validationErrors.map((field) => (
                  <li key={field} className="flex items-center gap-2 text-sm text-red-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                    {field}
                  </li>
                ))}
              </ul>
            </div>
            <div className="px-6 pb-6 pt-2 flex justify-end">
              <button
                onClick={() => setValidationErrors([])}
                className="bg-black text-white hover:bg-stone-800 transition-colors px-6 py-2.5 rounded-sm text-sm font-medium"
              >
                {t("auth.understood")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
