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
  Film,
  FileImage,
  Palette,
  ShieldCheck,
  BarChart3,
  Layers,
  AlertTriangle,
} from "lucide-react";
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
  ingredients: string;
  howToUse: string;
  images: ProductImage[];
  videoUrl: string;
  gifUrl: string;
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
  attributes: {
    sulfateFree: boolean;
    parabenFree: boolean;
    ammoniaFree: boolean;
    vegan: boolean;
    hairTypes: string[];
  };
}

type TabKey = "osnovno" | "cene" | "sadrzaj" | "mediji" | "zalihe" | "boja" | "atributi";

/* ───────────────────────── Constants ───────────────────────── */

const brandNames = ["L'Oréal", "Schwarzkopf", "Kérastase", "Wella", "Moroccanoil"];

const brandProductLines: Record<string, string[]> = {
  "L'Or\u00e9al": ["Majirel", "Serie Expert", "Tecni Art", "Blond Studio", "Inoa"],
  Schwarzkopf: ["Igora Royal", "BC Bonacure", "OSIS+", "BlondMe", "Fibre Clinix"],
  "K\u00e9rastase": ["Elixir Ultime", "Nutritive", "Resistance", "Densifique", "Chronologiste"],
  Wella: ["Koleston Perfect", "Oil Reflections", "EIMI", "Fusion", "Elements"],
  Moroccanoil: ["Treatment", "Hydration", "Repair", "Color Complete", "Curl"],
};

const categoryHierarchy: Record<string, string[]> = {
  "Nega kose": ["\u0160amponi", "Balzami", "Maske", "Tretmani"],
  "Boje za kosu": ["Permanentne", "Polutrajna", "Toneri", "Posvetliva\u010di"],
  Styling: ["Gelovi", "Voskovi", "Sprejevi", "Puderi", "Pene"],
  "Ulja i serumi": ["Ulja", "Serumi", "Eliksiri"],
};

/* colorUndertones and hairTypeOptions moved inside component to use t() */

/* ───────────────────────── Mock Data ───────────────────────── */

const initialProducts: Product[] = [
  {
    id: 1, name: "Serie Expert Gold Quinoa", sku: "LOR-SE-GQ001", brand: "L'Or\u00e9al", productLine: "Serie Expert",
    category: "Nega kose", subCategory: "\u0160amponi", priceB2C: 2500, priceB2B: 1800, oldPrice: 3200, purchasePrice: 1200,
    stock: 45, lowStockThreshold: 10, weight: 300, volume: 300, status: "active",
    badges: { isNew: false, isFeatured: true, isBestseller: false, isProfessionalOnly: false },
    description: "Profesionalni \u0161ampon za o\u0161te\u0107enu kosu sa zlatnim kvinojom.",
    ingredients: "Aqua, Sodium Laureth Sulfate, Gold Quinoa Extract...",
    howToUse: "Nanesite na mokru kosu, upenite i isperite. Ponovite po potrebi.",
    images: [{ id: 1, url: "/products/loreal1.jpg", alt: "Serie Expert Gold Quinoa \u0161ampon", isPrimary: true }],
    videoUrl: "", gifUrl: "",
    seoTitle: "Serie Expert Gold Quinoa \u0160ampon | Alta Moda", metaDescription: "Profesionalni \u0161ampon za o\u0161te\u0107enu kosu. L'Or\u00e9al Serie Expert linija.", slug: "serie-expert-gold-quinoa",
    barcode: "", vatRate: 20, vatCode: "R2", erpId: "",
    attributes: { sulfateFree: false, parabenFree: true, ammoniaFree: true, vegan: false, hairTypes: ["O\u0161te\u0107ena", "Farbana"] },
  },
  {
    id: 2, name: "BC Bonacure Peptide Repair", sku: "SCH-BC-PR001", brand: "Schwarzkopf", productLine: "BC Bonacure",
    category: "Nega kose", subCategory: "\u0160amponi", priceB2C: 1800, priceB2B: 1300, purchasePrice: 900,
    stock: 32, lowStockThreshold: 10, weight: 250, volume: 250, status: "active",
    badges: { isNew: true, isFeatured: false, isBestseller: false, isProfessionalOnly: false },
    description: "Rescue \u0161ampon za finu i o\u0161te\u0107enu kosu.",
    ingredients: "Aqua, Sodium Laureth Sulfate, Peptide Complex...",
    howToUse: "Nanesite na mokru kosu, masirajte i isperite.",
    images: [{ id: 1, url: "/products/schwarzkopf1.jpg", alt: "BC Bonacure Peptide Repair", isPrimary: true }],
    videoUrl: "", gifUrl: "",
    seoTitle: "BC Bonacure Peptide Repair | Alta Moda", metaDescription: "Schwarzkopf BC Bonacure Peptide Repair \u0161ampon za obnovu kose.", slug: "bc-bonacure-peptide-repair",
    barcode: "", vatRate: 20, vatCode: "R2", erpId: "",
    attributes: { sulfateFree: true, parabenFree: true, ammoniaFree: true, vegan: false, hairTypes: ["O\u0161te\u0107ena", "Normalna"] },
  },
  {
    id: 3, name: "Elixir Ultime Serum", sku: "KER-EU-S001", brand: "K\u00e9rastase", productLine: "Elixir Ultime",
    category: "Ulja i serumi", subCategory: "Serumi", priceB2C: 4200, priceB2B: 3200, oldPrice: 4800, purchasePrice: 2200,
    stock: 3, lowStockThreshold: 5, weight: 100, volume: 100, status: "active",
    badges: { isNew: false, isFeatured: true, isBestseller: false, isProfessionalOnly: false },
    description: "Luksuzno ulje za izvanredan sjaj kose.",
    ingredients: "Cyclopentasiloxane, Dimethiconol, Argan Oil...",
    howToUse: "Nanesite 1-2 pumpe na suvu ili vla\u017enu kosu.",
    images: [{ id: 1, url: "/products/kerastase1.jpg", alt: "K\u00e9rastase Elixir Ultime", isPrimary: true }],
    videoUrl: "", gifUrl: "",
    seoTitle: "K\u00e9rastase Elixir Ultime Serum | Alta Moda", metaDescription: "Luksuzni serum za sjaj kose. K\u00e9rastase Elixir Ultime.", slug: "elixir-ultime-serum",
    barcode: "", vatRate: 20, vatCode: "R2", erpId: "",
    attributes: { sulfateFree: true, parabenFree: true, ammoniaFree: true, vegan: false, hairTypes: ["Suva", "Normalna", "Farbana"] },
  },
  {
    id: 4, name: "Oil Reflections \u0160ampon", sku: "WEL-OR-S001", brand: "Wella", productLine: "Oil Reflections",
    category: "Nega kose", subCategory: "\u0160amponi", priceB2C: 1950, priceB2B: 1400, purchasePrice: 950,
    stock: 28, lowStockThreshold: 10, weight: 250, volume: 250, status: "active",
    badges: { isNew: false, isFeatured: false, isBestseller: false, isProfessionalOnly: false },
    description: "\u0160ampon za blistavu i glatku kosu.",
    ingredients: "Aqua, Sodium Laureth Sulfate, Camellia Oil...",
    howToUse: "Nanesite na mokru kosu, masirajte teme i isperite.",
    images: [{ id: 1, url: "/products/wella1.jpg", alt: "Wella Oil Reflections \u0161ampon", isPrimary: true }],
    videoUrl: "", gifUrl: "",
    seoTitle: "Wella Oil Reflections \u0160ampon | Alta Moda", metaDescription: "Wella Oil Reflections \u0161ampon za blistavu kosu.", slug: "oil-reflections-sampon",
    barcode: "", vatRate: 20, vatCode: "R2", erpId: "",
    attributes: { sulfateFree: false, parabenFree: true, ammoniaFree: true, vegan: false, hairTypes: ["Normalna", "Suva"] },
  },
  {
    id: 5, name: "Moroccanoil Treatment 100ml", sku: "MOR-TR-001", brand: "Moroccanoil", productLine: "Treatment",
    category: "Ulja i serumi", subCategory: "Ulja", priceB2C: 3500, priceB2B: 2600, purchasePrice: 1800,
    stock: 15, lowStockThreshold: 5, weight: 120, volume: 100, status: "active",
    badges: { isNew: false, isFeatured: true, isBestseller: false, isProfessionalOnly: false },
    description: "Originalni Moroccanoil tretman za kosu sa arganovim uljem.",
    ingredients: "Cyclomethicone, Dimethicone, Argania Spinosa Kernel Oil...",
    howToUse: "Nanesite malu koli\u010dinu na vla\u017enu ili suvu kosu.",
    images: [{ id: 1, url: "/products/moroccanoil1.jpg", alt: "Moroccanoil Treatment", isPrimary: true }],
    videoUrl: "", gifUrl: "",
    seoTitle: "Moroccanoil Treatment Original | Alta Moda", metaDescription: "Originalni Moroccanoil tretman sa arganovim uljem.", slug: "moroccanoil-treatment-100ml",
    barcode: "", vatRate: 20, vatCode: "R2", erpId: "",
    attributes: { sulfateFree: true, parabenFree: true, ammoniaFree: true, vegan: false, hairTypes: ["Suva", "O\u0161te\u0107ena", "Kovrd\u017eava"] },
  },
  {
    id: 6, name: "Igora Royal 60ml - 7.0", sku: "SCH-IR-700", brand: "Schwarzkopf", productLine: "Igora Royal",
    category: "Boje za kosu", subCategory: "Permanentne", priceB2C: 850, priceB2B: 580, purchasePrice: 350,
    stock: 120, lowStockThreshold: 20, weight: 80, volume: 60, status: "active",
    badges: { isNew: false, isFeatured: false, isBestseller: false, isProfessionalOnly: true },
    description: "Permanentna profesionalna boja za kosu. Nivo 7, prirodno plava.",
    ingredients: "Aqua, Cetearyl Alcohol, Propylene Glycol...",
    howToUse: "Pome\u0161ajte 1:1 sa razvo\u010diva\u010dem. Nanesite i ostavite 30-45 min.",
    images: [{ id: 1, url: "/products/igora1.jpg", alt: "Igora Royal 7.0", isPrimary: true }],
    videoUrl: "", gifUrl: "",
    colorLevel: 7, colorUndertone: "N", colorHex: "#8B6914", shadeCode: "7-0",
    seoTitle: "Igora Royal 7-0 Srednje Plava | Alta Moda", metaDescription: "Schwarzkopf Igora Royal 7-0 permanentna boja. Prirodno srednje plava.", slug: "igora-royal-7-0",
    barcode: "", vatRate: 20, vatCode: "R2", erpId: "",
    attributes: { sulfateFree: false, parabenFree: false, ammoniaFree: false, vegan: false, hairTypes: [] },
  },
  {
    id: 7, name: "Majirel 50ml - 6.0", sku: "LOR-MJ-600", brand: "L'Or\u00e9al", productLine: "Majirel",
    category: "Boje za kosu", subCategory: "Permanentne", priceB2C: 900, priceB2B: 620, purchasePrice: 380,
    stock: 5, lowStockThreshold: 15, weight: 70, volume: 50, status: "active",
    badges: { isNew: false, isFeatured: false, isBestseller: false, isProfessionalOnly: true },
    description: "L'Or\u00e9al Majirel permanentna boja. Nivo 6, tamno plava.",
    ingredients: "Aqua, Cetearyl Alcohol, Hexylene Glycol...",
    howToUse: "Pome\u0161ajte sa oksidansom u srazmeri 1:1.5. Vreme delovanja 35 min.",
    images: [{ id: 1, url: "/products/majirel1.jpg", alt: "Majirel 6.0", isPrimary: true }],
    videoUrl: "", gifUrl: "",
    colorLevel: 6, colorUndertone: "N", colorHex: "#6B4226", shadeCode: "6.0",
    seoTitle: "L'Or\u00e9al Majirel 6.0 Tamno Plava | Alta Moda", metaDescription: "L'Or\u00e9al Majirel 6.0 profesionalna permanentna boja.", slug: "majirel-6-0",
    barcode: "", vatRate: 20, vatCode: "R2", erpId: "",
    attributes: { sulfateFree: false, parabenFree: false, ammoniaFree: false, vegan: false, hairTypes: [] },
  },
  {
    id: 8, name: "OSIS+ Dust It", sku: "SCH-OS-DI01", brand: "Schwarzkopf", productLine: "OSIS+",
    category: "Styling", subCategory: "Puderi", priceB2C: 1200, priceB2B: 850, purchasePrice: 550,
    stock: 42, lowStockThreshold: 10, weight: 10, volume: 10, status: "inactive",
    badges: { isNew: false, isFeatured: false, isBestseller: false, isProfessionalOnly: true },
    description: "Matirajuc\u0301i puder za volumen i teksturu.",
    ingredients: "Silica, Magnesium Stearate...",
    howToUse: "Nanesite malu koli\u010dinu na korenove kose i umasirajte.",
    images: [{ id: 1, url: "/products/osis1.jpg", alt: "OSIS+ Dust It puder", isPrimary: true }],
    videoUrl: "", gifUrl: "",
    seoTitle: "OSIS+ Dust It Puder za Volumen | Alta Moda", metaDescription: "Schwarzkopf OSIS+ Dust It matirajuc\u0301i puder za volumen.", slug: "osis-dust-it",
    barcode: "", vatRate: 20, vatCode: "R2", erpId: "",
    attributes: { sulfateFree: true, parabenFree: true, ammoniaFree: true, vegan: true, hairTypes: ["Normalna", "Masna"] },
  },
  {
    id: 9, name: "Tecni Art Pli Shaper", sku: "LOR-TA-PS01", brand: "L'Or\u00e9al", productLine: "Tecni Art",
    category: "Styling", subCategory: "Gelovi", priceB2C: 1450, priceB2B: 1050, purchasePrice: 680,
    stock: 18, lowStockThreshold: 8, weight: 190, volume: 190, status: "active",
    badges: { isNew: true, isFeatured: false, isBestseller: false, isProfessionalOnly: true },
    description: "Termo-aktivni gel za dugotrajno oblikovanje.",
    ingredients: "Aqua, VP/VA Copolymer, PEG-40 Hydrogenated Castor Oil...",
    howToUse: "Nanesite na vla\u017enu kosu pre feniranja.",
    images: [{ id: 1, url: "/products/tecniart1.jpg", alt: "Tecni Art Pli Shaper", isPrimary: true }],
    videoUrl: "", gifUrl: "",
    seoTitle: "Tecni Art Pli Shaper | Alta Moda", metaDescription: "L'Or\u00e9al Tecni Art Pli termo-aktivni gel.", slug: "tecni-art-pli-shaper",
    barcode: "", vatRate: 20, vatCode: "R2", erpId: "",
    attributes: { sulfateFree: true, parabenFree: true, ammoniaFree: true, vegan: false, hairTypes: ["Normalna", "Suva"] },
  },
  {
    id: 10, name: "Koleston Perfect 60ml - 8/0", sku: "WEL-KP-800", brand: "Wella", productLine: "Koleston Perfect",
    category: "Boje za kosu", subCategory: "Permanentne", priceB2C: 950, priceB2B: 650, purchasePrice: 400,
    stock: 4, lowStockThreshold: 15, weight: 80, volume: 60, status: "active",
    badges: { isNew: false, isFeatured: false, isBestseller: false, isProfessionalOnly: true },
    description: "Profesionalna permanentna boja za kosu. Svetlo plava.",
    ingredients: "Aqua, Cetearyl Alcohol, Propylene Glycol...",
    howToUse: "Pome\u0161ajte sa Welloxon Perfect. Nanesite i ostavite 30 min.",
    images: [{ id: 1, url: "/products/koleston1.jpg", alt: "Koleston Perfect 8/0", isPrimary: true }],
    videoUrl: "", gifUrl: "",
    colorLevel: 8, colorUndertone: "N", colorHex: "#B8860B", shadeCode: "8/0",
    seoTitle: "Koleston Perfect 8/0 Svetlo Plava | Alta Moda", metaDescription: "Wella Koleston Perfect 8/0 permanentna boja.", slug: "koleston-perfect-8-0",
    barcode: "", vatRate: 20, vatCode: "R2", erpId: "",
    attributes: { sulfateFree: false, parabenFree: false, ammoniaFree: false, vegan: false, hairTypes: [] },
  },
  {
    id: 11, name: "BlondMe Premium Lift", sku: "SCH-BM-PL01", brand: "Schwarzkopf", productLine: "BlondMe",
    category: "Boje za kosu", subCategory: "Posvetliva\u010di", priceB2C: 1100, priceB2B: 780, purchasePrice: 480,
    stock: 55, lowStockThreshold: 15, weight: 450, volume: 450, status: "active",
    badges: { isNew: false, isFeatured: true, isBestseller: false, isProfessionalOnly: true },
    description: "Premium puder za posvetljivanje do 9 nivoa.",
    ingredients: "Potassium Persulfate, Sodium Silicate, Magnesium Carbonate...",
    howToUse: "Pome\u0161ajte 1:2 sa razvo\u010diva\u010dem. Ne koristiti na ko\u017ei glave.",
    images: [{ id: 1, url: "/products/blondme1.jpg", alt: "BlondMe Premium Lift", isPrimary: true }],
    videoUrl: "", gifUrl: "",
    seoTitle: "BlondMe Premium Lift Posvetliva\u010d | Alta Moda", metaDescription: "Schwarzkopf BlondMe Premium Lift puder za posvetljivanje.", slug: "blondme-premium-lift",
    barcode: "", vatRate: 20, vatCode: "R2", erpId: "",
    attributes: { sulfateFree: false, parabenFree: false, ammoniaFree: false, vegan: false, hairTypes: [] },
  },
  {
    id: 12, name: "Mythic Oil Huile", sku: "LOR-MO-H001", brand: "L'Or\u00e9al", productLine: "Serie Expert",
    category: "Ulja i serumi", subCategory: "Ulja", priceB2C: 2800, priceB2B: 2100, purchasePrice: 1400,
    stock: 22, lowStockThreshold: 8, weight: 120, volume: 100, status: "active",
    badges: { isNew: false, isFeatured: false, isBestseller: false, isProfessionalOnly: false },
    description: "Hranljivo ulje za kosu na bazi arganovog ulja.",
    ingredients: "Cyclomethicone, Dimethiconol, Argania Spinosa Oil...",
    howToUse: "Nanesite 1-2 kapi na krajeve kose. Mo\u017ee se koristiti na suvu ili vla\u017enu kosu.",
    images: [{ id: 1, url: "/products/mythic1.jpg", alt: "L'Or\u00e9al Mythic Oil", isPrimary: true }],
    videoUrl: "", gifUrl: "",
    seoTitle: "L'Or\u00e9al Mythic Oil Huile | Alta Moda", metaDescription: "L'Or\u00e9al Mythic Oil hranljivo ulje za kosu.", slug: "mythic-oil-huile",
    barcode: "", vatRate: 20, vatCode: "R2", erpId: "",
    attributes: { sulfateFree: true, parabenFree: true, ammoniaFree: true, vegan: false, hairTypes: ["Suva", "Normalna", "O\u0161te\u0107ena"] },
  },
];

/* ───────────────────────── Default Form ───────────────────────── */

const defaultFormData = (): Omit<Product, "id"> => ({
  name: "",
  sku: "",
  brand: "L'Or\u00e9al",
  productLine: brandProductLines["L'Or\u00e9al"][0],
  category: "Nega kose",
  subCategory: categoryHierarchy["Nega kose"][0],
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
  ingredients: "",
  howToUse: "",
  images: [],
  videoUrl: "",
  gifUrl: "",
  seoTitle: "",
  metaDescription: "",
  slug: "",
  barcode: "",
  vatRate: 20,
  vatCode: "R2",
  erpId: "",
  attributes: { sulfateFree: false, parabenFree: false, ammoniaFree: false, vegan: false, hairTypes: [] },
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
  const [brandFilter, setBrandFilter] = useState(t("admin.allBrands"));
  const [categoryFilter, setCategoryFilter] = useState(t("admin.allCategories"));
  const [statusFilter, setStatusFilter] = useState(t("admin.allStatuses"));
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

  // Translated filter options
  const brands = [t("admin.allBrands"), ...brandNames];
  const categories = [t("admin.allCategories"), "Nega kose", "Boje za kosu", "Styling", "Ulja i serumi"];
  const statuses = [t("admin.allStatuses"), t("admin.active"), t("admin.inactive")];

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

  const hairTypeOptions = [
    { value: "Normalna", label: t("admin.normal") },
    { value: "Suva", label: t("admin.dry") },
    { value: "Masna", label: t("admin.oily") },
    { value: "Farbana", label: t("admin.colored") },
    { value: "Oštećena", label: t("admin.damaged") },
    { value: "Kovrđava", label: t("admin.curly") },
  ];

  const perPage = 8;
  const loadedRef = useRef(false);

  const fetchProducts = useCallback(() => {
    fetch("/api/products?limit=100")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.products) {
          const mapped: Product[] = data.data.products.map((p: Record<string, unknown>) => ({
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
            purchasePrice: (p.costPrice || 0) as number,
            stock: (p.stockQuantity || 0) as number,
            lowStockThreshold: 5,
            weight: 0,
            volume: 0,
            status: (p.stockQuantity as number) >= 0 ? "active" as const : "inactive" as const,
            badges: {
              isNew: (p.isNew || false) as boolean,
              isFeatured: (p.isFeatured || false) as boolean,
              isBestseller: (p.isBestseller || false) as boolean,
              isProfessionalOnly: (p.isProfessional || false) as boolean,
            },
            description: "",
            ingredients: "",
            howToUse: "",
            images: p.image ? [{ id: 1, url: p.image as string, alt: (p.name || "") as string, isPrimary: true }] : [],
            videoUrl: "",
            gifUrl: "",
            seoTitle: "",
            metaDescription: "",
            slug: (p.slug || "") as string,
            barcode: (p.barcode || "") as string,
            vatRate: (p.vatRate ?? 20) as number,
            vatCode: (p.vatCode || (p.vatRate === 10 ? "R1" : "R2")) as string,
            erpId: (p.erpId || "") as string,
            attributes: { sulfateFree: false, parabenFree: false, ammoniaFree: false, vegan: false, hairTypes: [] },
          }));
          setProducts(mapped);
          setApiLoaded(true);
        }
      })
      .catch(() => {
        setApiLoaded(true);
      });
  }, []);

  // Load products from API on mount
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    fetchProducts();
  }, [fetchProducts]);


  /* ── Filtered / paginated ── */
  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
      const matchBrand = brandFilter === t("admin.allBrands") || p.brand === brandFilter;
      const matchCategory = categoryFilter === t("admin.allCategories") || p.category === categoryFilter;
      const matchStatus =
        statusFilter === t("admin.allStatuses") ||
        (statusFilter === t("admin.active") && p.status === "active") ||
        (statusFilter === t("admin.inactive") && p.status === "inactive");
      return matchSearch && matchBrand && matchCategory && matchStatus;
    });
  }, [products, search, brandFilter, categoryFilter, statusFilter, t]);

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

  const openEditPanel = (product: Product) => {
    setEditingProduct(product);
    const { id: _id, ...rest } = product;
    setFormData(rest);
    if (product.oldPrice && product.oldPrice > product.priceB2C) {
      setDiscountInput(Math.round(((product.oldPrice - product.priceB2C) / product.oldPrice) * 100).toString());
    } else {
      setDiscountInput("");
    }
    setActiveTab("osnovno");
    setShowPanel(true);
  };

  const handleSave = async () => {
    // Validate required fields
    const errors: string[] = [];
    if (!formData.name.trim()) errors.push(t("admin.productName"));
    if (!formData.sku.trim()) errors.push(t("admin.skuCode"));
    if (!formData.priceB2C || formData.priceB2C <= 0) errors.push(t("admin.priceB2c"));
    if (!formData.priceB2B || formData.priceB2B <= 0) errors.push(t("admin.priceB2b"));
    if (formData.stock === undefined || formData.stock < 0) errors.push(t("admin.stockQuantity"));

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setSaving(true);
    const apiBody = {
      nameLat: formData.name,
      sku: formData.sku,
      priceB2c: formData.priceB2C,
      priceB2b: formData.priceB2B || null,
      oldPrice: formData.oldPrice || null,
      costPrice: formData.purchasePrice || null,
      stockQuantity: formData.stock,
      lowStockThreshold: formData.lowStockThreshold,
      weightGrams: formData.weight || null,
      volumeMl: formData.volume || null,
      description: formData.description || null,
      ingredients: formData.ingredients || null,
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
        if (res.ok) {
          setProducts(products.map((p) => (p.id === editingProduct.id ? { ...formData, id: editingProduct.id } : p)));
        }
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiBody),
        });
        const data = await res.json();
        if (data.success) {
          const newProduct: Product = {
            ...formData,
            id: data.data.id,
            images: formData.images.length > 0 ? formData.images : [{ id: 1, url: "/products/placeholder.jpg", alt: formData.name, isPrimary: true }],
          };
          setProducts([newProduct, ...products]);
        }
      }
    } catch (err) {
      console.error("Save failed:", err);
    }
    setSaving(false);
    setShowPanel(false);
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/products/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Delete failed:", err);
    }
    setProducts(products.filter((p) => p.id !== id));
    setSelectedIds(selectedIds.filter((sid) => sid !== id));
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

    if (action === "delete") {
      setProducts(products.filter((p) => !selectedIds.includes(p.id)));
    } else if (action === "activate") {
      setProducts(products.map((p) => (selectedIds.includes(p.id) ? { ...p, status: "active" as const } : p)));
    } else if (action === "deactivate") {
      setProducts(products.map((p) => (selectedIds.includes(p.id) ? { ...p, status: "inactive" as const } : p)));
    }
    setSelectedIds([]);
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
    { key: "boja", label: t("admin.colorLevel").split(" ")[0] || "Boja", icon: <Palette size={16} /> },
    { key: "atributi", label: t("admin.productAttributes"), icon: <ShieldCheck size={16} /> },
  ];

  /* ── Common input class ── */
  const inputCls = "w-full px-4 py-2.5 border border-stone-200 rounded-sm text-sm focus:outline-none focus:border-black bg-white text-black placeholder:text-[#aaa]";
  const labelCls = "block text-sm font-medium text-[#333] mb-1.5";
  const sectionCls = "space-y-5";

  /* ───────────────────── RENDER ───────────────────── */

  return (
    <div className="space-y-6 min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-black">{t("admin.products")}</h1>
          <p className="text-sm text-[#666] mt-1">{products.length} {t("admin.totalProducts")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/import"
            className="px-4 py-2.5 rounded-sm text-sm flex items-center gap-2 bg-stone-900 text-white hover:bg-black transition-colors"
          >
            <Upload size={16} />
            <span className="hidden sm:inline">{t("admin.importCsv")}</span>
          </Link>
          <button
            onClick={openAddPanel}
            className="px-5 py-2.5 rounded-sm text-sm flex items-center gap-2 bg-stone-900 text-white hover:bg-black transition-colors"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">{t("admin.addProduct")}</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-sm border border-stone-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
            <input
              type="text"
              placeholder={t("admin.searchProducts")}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-stone-100 border border-transparent rounded-sm text-sm focus:bg-white focus:border-black focus:outline-none"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden flex items-center gap-2 px-4 py-2.5 bg-stone-100 rounded-sm text-sm text-[#666]"
          >
            <Filter size={16} />
            {t("admin.filters")}
          </button>
          <div className={`${showFilters ? "flex" : "hidden"} sm:flex flex-col sm:flex-row gap-3`}>
            <select value={brandFilter} onChange={(e) => { setBrandFilter(e.target.value); setCurrentPage(1); }} className="px-3 py-2.5 bg-stone-100 border border-transparent rounded-sm text-sm cursor-pointer focus:border-black focus:outline-none">
              {brands.map((b) => <option key={b}>{b}</option>)}
            </select>
            <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }} className="px-3 py-2.5 bg-stone-100 border border-transparent rounded-sm text-sm cursor-pointer focus:border-black focus:outline-none">
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="px-3 py-2.5 bg-stone-100 border border-transparent rounded-sm text-sm cursor-pointer focus:border-black focus:outline-none">
              {statuses.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[#f0f0f0] flex items-center gap-3">
            <span className="text-sm text-[#666]">{selectedIds.length} {t("admin.selected")}</span>
            <div className="relative">
              <button
                onClick={() => setShowBulkMenu(!showBulkMenu)}
                className="px-3 py-1.5 bg-black text-white rounded-sm text-sm flex items-center gap-1"
              >
                {t("admin.actions")} <MoreVertical size={14} />
              </button>
              {showBulkMenu && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-sm shadow-xl border border-stone-200 overflow-hidden z-10">
                  <button onClick={() => bulkAction("activate")} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[#333] hover:bg-stone-100">
                    <Eye size={14} /> {t("admin.activate")}
                  </button>
                  <button onClick={() => bulkAction("deactivate")} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[#333] hover:bg-stone-100">
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
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-stone-100 border-b border-stone-200">
                <th className="px-4 py-3 text-left">
                  <button onClick={selectAll} className="text-[#999] hover:text-black">
                    {selectedIds.length === paginated.length && paginated.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">{t("admin.product")}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden xl:table-cell">{t("admin.sku")}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden md:table-cell">{t("admin.brand")}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden lg:table-cell">{t("admin.category")}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">{t("admin.priceB2c")}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden lg:table-cell">{t("admin.priceB2b")}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden lg:table-cell">Nabavna</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden sm:table-cell">{t("admin.stock")}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden xl:table-cell">Barkod</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden xl:table-cell">ERP ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden sm:table-cell">{t("admin.status")}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">{t("admin.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {paginated.map((product) => (
                <tr key={product.id} className="hover:bg-stone-100 transition-colors">
                  <td className="px-4 py-3">
                    <button onClick={() => toggleSelect(product.id)} className="text-[#999] hover:text-black">
                      {selectedIds.includes(product.id) ? <CheckSquare size={18} className="text-secondary" /> : <Square size={18} />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-sm bg-stone-100 flex items-center justify-center flex-shrink-0">
                        <Package size={18} className="text-[#999]" />
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
                        <p className="text-xs text-[#999] md:hidden">{product.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-[#666] hidden xl:table-cell">{product.sku}</td>
                  <td className="px-4 py-3 text-sm text-[#333] hidden md:table-cell">{product.brand}</td>
                  <td className="px-4 py-3 text-sm text-[#333] hidden lg:table-cell">{product.category}</td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="text-sm font-medium text-black">{product.priceB2C.toLocaleString()} RSD</span>
                      {product.oldPrice && (
                        <span className="block text-xs text-[#999] line-through">{product.oldPrice.toLocaleString()} RSD</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#333] hidden lg:table-cell">{product.priceB2B.toLocaleString()} RSD</td>
                  <td className="px-4 py-3 text-sm text-[#666] hidden lg:table-cell">{product.purchasePrice ? `${product.purchasePrice.toLocaleString()} RSD` : "—"}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-medium ${product.stock <= product.lowStockThreshold ? "text-red-500" : product.stock <= product.lowStockThreshold * 2 ? "text-orange-500" : "text-[#333]"}`}>
                        {product.stock}
                      </span>
                      {product.stock <= product.lowStockThreshold && (
                        <AlertTriangle size={14} className="text-red-400" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-[#666] hidden xl:table-cell">{product.barcode || "—"}</td>
                  <td className="px-4 py-3 text-xs font-mono text-[#666] hidden xl:table-cell">{product.erpId || "—"}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${product.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {product.status === "active" ? t("admin.active") : t("admin.inactive")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEditPanel(product)} className="p-1.5 text-[#999] hover:text-secondary hover:bg-black/10 rounded-sm transition-colors">
                        <Edit3 size={15} />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-1.5 text-[#999] hover:text-red-500 hover:bg-red-50 rounded-sm transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-4 py-12 text-center text-sm text-[#999]">
                    {t("admin.noProductsMatch")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 sm:px-6 py-4 border-t border-stone-200 flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm text-[#666] whitespace-nowrap">
              {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filtered.length)} / {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-sm text-[#666] hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page = i + 1;
                if (totalPages > 5) {
                  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                  page = start + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-sm text-sm font-medium transition-colors ${page === currentPage ? "bg-black text-white" : "text-[#666] hover:bg-stone-100"}`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-sm text-[#666] hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
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
              <button onClick={() => setShowPanel(false)} className="p-2 text-[#999] hover:text-black hover:bg-stone-100 rounded-sm transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Tab Bar */}
            <div className="flex-shrink-0 border-b border-stone-200 bg-[#faf8f4] overflow-x-auto">
              <div className="flex min-w-max px-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.key
                        ? "border-black text-secondary"
                        : "border-transparent text-[#666] hover:text-black hover:border-[#ccc]"
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
                      <label className="text-[10px] uppercase tracking-wider text-[#999] font-medium">ERP / Pantheon</label>
                      <div className="flex gap-6 mt-1.5 text-sm text-[#666]">
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
                          const lines = brandProductLines[newBrand] || [];
                          updateForm("productLine", lines[0] || "");
                        }}
                        className={inputCls + " cursor-pointer"}
                      >
                        {brands.filter((b) => b !== t("admin.allBrands")).map((b) => <option key={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>{t("admin.productLine")}</label>
                      <select value={formData.productLine} onChange={(e) => updateForm("productLine", e.target.value)} className={inputCls + " cursor-pointer"}>
                        {(brandProductLines[formData.brand] || []).map((l) => <option key={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>{t("admin.category")}</label>
                      <select
                        value={formData.category}
                        onChange={(e) => {
                          const cat = e.target.value;
                          updateForm("category", cat);
                          const subs = categoryHierarchy[cat] || [];
                          updateForm("subCategory", subs[0] || "");
                        }}
                        className={inputCls + " cursor-pointer"}
                      >
                        {categories.filter((c) => c !== t("admin.allCategories")).map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>{t("admin.subcategory")}</label>
                      <select value={formData.subCategory} onChange={(e) => updateForm("subCategory", e.target.value)} className={inputCls + " cursor-pointer"}>
                        {(categoryHierarchy[formData.category] || []).map((s) => <option key={s}>{s}</option>)}
                      </select>
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
                      <span className="text-sm text-[#666]">{formData.status === "active" ? t("admin.active") : t("admin.inactive")}</span>
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
                            className="w-4 h-4 rounded border-stone-200 text-secondary accent-[#735b28]"
                          />
                          <span className="text-sm text-[#333]">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Tab: Cene ── */}
              {activeTab === "cene" && (
                <div className={sectionCls}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>{t("admin.priceB2c")} (RSD) *</label>
                      <input
                        type="number"
                        value={formData.priceB2C || ""}
                        onChange={(e) => updateForm("priceB2C", Number(e.target.value) || 0)}
                        className={inputCls}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>{t("admin.priceB2b")} (RSD) *</label>
                      <input
                        type="number"
                        value={formData.priceB2B || ""}
                        onChange={(e) => updateForm("priceB2B", Number(e.target.value) || 0)}
                        className={inputCls}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>{t("admin.oldPrice")}</label>
                      <input
                        type="number"
                        value={formData.oldPrice || ""}
                        onChange={(e) => handleOldPriceChange(e.target.value)}
                        className={inputCls}
                        placeholder={t("admin.forDiscount")}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>{t("admin.discountPercent")}</label>
                      <input
                        type="number"
                        value={discountInput}
                        onChange={(e) => handleDiscountChange(e.target.value)}
                        className={inputCls}
                        placeholder={t("admin.autoOrEnter")}
                        min={0}
                        max={99}
                      />
                    </div>
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
                    <div className="p-3 bg-stone-100 rounded-sm text-sm text-[#666]">
                      {t("admin.marginB2c")}: <strong className="text-black">{Math.round(((formData.priceB2C - formData.purchasePrice) / formData.priceB2C) * 100)}%</strong>
                      {formData.priceB2B > 0 && (
                        <span className="ml-4">{t("admin.marginB2b")}: <strong className="text-black">{Math.round(((formData.priceB2B - formData.purchasePrice) / formData.priceB2B) * 100)}%</strong></span>
                      )}
                    </div>
                  )}

                  {/* Price Preview */}
                  <div>
                    <label className={labelCls}>{t("admin.pricePreview")}</label>
                    <div className="border border-stone-200 rounded-sm p-4 bg-[#faf8f4]">
                      <div className="flex items-baseline gap-3">
                        <span className="text-2xl font-bold text-black">{(formData.priceB2C || 0).toLocaleString()} RSD</span>
                        {formData.oldPrice && formData.oldPrice > formData.priceB2C && (
                          <>
                            <span className="text-lg text-[#999] line-through">{formData.oldPrice.toLocaleString()} RSD</span>
                            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded">-{discountPercent}%</span>
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
                      rows={6}
                      className={inputCls + " resize-y"}
                      placeholder={t("admin.detailedDescription")}
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
                    <p className="text-xs text-[#999] mb-3">{t("admin.dragImages")}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {formData.images.map((img, idx) => (
                        <div key={img.id} className="relative group border border-stone-200 rounded-sm overflow-hidden aspect-square bg-stone-100 flex items-center justify-center">
                          {img.url.startsWith("/uploads/") ? (
                            <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center p-2">
                              <ImageIcon size={28} className="mx-auto text-[#bbb] mb-1" />
                              <p className="text-[10px] text-[#999] truncate max-w-full">{img.url.split("/").pop()}</p>
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
                        className="border-2 border-dashed border-stone-200 rounded-sm aspect-square flex flex-col items-center justify-center gap-2 text-[#999] hover:border-black hover:text-secondary transition-colors cursor-pointer disabled:opacity-50"
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
                            <span className="text-xs text-[#999] w-20 flex-shrink-0 truncate">{img.url.split("/").pop()}</span>
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>
                        <span className="flex items-center gap-1.5"><Film size={14} /> {t("admin.videoUrl")}</span>
                      </label>
                      <input type="url" value={formData.videoUrl} onChange={(e) => updateForm("videoUrl", e.target.value)} className={inputCls} placeholder="https://youtube.com/..." />
                    </div>
                    <div>
                      <label className={labelCls}>
                        <span className="flex items-center gap-1.5"><FileImage size={14} /> {t("admin.gifUrl")}</span>
                      </label>
                      <input type="url" value={formData.gifUrl} onChange={(e) => updateForm("gifUrl", e.target.value)} className={inputCls} placeholder="https://..." />
                    </div>
                  </div>
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

              {/* ── Tab: Boja ── */}
              {activeTab === "boja" && (
                <div className={sectionCls}>
                  <div className="p-3 bg-stone-100 rounded-sm text-xs text-stone-500 flex items-center gap-2">
                    <Palette size={16} className="text-secondary" />
                    Dodelite boju proizvodu — podaci se koriste za vizuelni prikaz i filtriranje na sajtu.
                  </div>

                  {/* Level selector — visual */}
                  <div>
                    <label className={labelCls}>{t("admin.colorLevel")} (1-10)</label>
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
                  <div>
                    <label className={labelCls}>{t("admin.undertone")}</label>
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>{t("admin.hexColor")}</label>
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
                    <div>
                      <label className={labelCls}>{t("admin.shadeCode")}</label>
                      <input type="text" value={formData.shadeCode || ""} onChange={(e) => updateForm("shadeCode", e.target.value)} className={inputCls} placeholder="npr. 7-0, 8/1, 6.44" />
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
                          {formData.shadeCode || "—"} &mdash; Nivo {formData.colorLevel || "?"} / {colorUndertones.find((u) => u.value === formData.colorUndertone)?.label || "—"}
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
              )}

              {/* ── Tab: Atributi ── */}
              {activeTab === "atributi" && (
                <div className={sectionCls}>
                  <div>
                    <label className={labelCls}>{t("admin.productAttributes")}</label>
                    <div className="space-y-3 mt-1">
                      {([
                        { key: "sulfateFree" as const, label: t("admin.sulfateFree") },
                        { key: "parabenFree" as const, label: t("admin.parabenFree") },
                        { key: "ammoniaFree" as const, label: t("admin.ammoniaFree") },
                        { key: "vegan" as const, label: t("admin.vegan") },
                      ]).map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between py-2 border-b border-[#f0f0f0]">
                          <span className="text-sm text-[#333]">{label}</span>
                          <button
                            type="button"
                            onClick={() => updateForm("attributes", { ...formData.attributes, [key]: !formData.attributes[key] })}
                            className={`relative w-11 h-6 rounded-full transition-colors ${formData.attributes[key] ? "bg-black" : "bg-gray-300"}`}
                          >
                            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.attributes[key] ? "translate-x-[22px]" : "translate-x-[2px]"}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>{t("admin.hairType")}</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {hairTypeOptions.map((ht) => {
                        const selected = formData.attributes.hairTypes.includes(ht.value);
                        return (
                          <button
                            key={ht.value}
                            type="button"
                            onClick={() => {
                              const newTypes = selected
                                ? formData.attributes.hairTypes.filter((t) => t !== ht.value)
                                : [...formData.attributes.hairTypes, ht.value];
                              updateForm("attributes", { ...formData.attributes, hairTypes: newTypes });
                            }}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                              selected
                                ? "bg-black text-white border-black"
                                : "bg-white text-[#666] border-stone-200 hover:border-black hover:text-secondary"
                            }`}
                          >
                            {ht.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Panel Footer (fixed) */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-stone-200 bg-white flex items-center justify-between">
              <button
                onClick={() => setShowPanel(false)}
                className="px-5 py-2.5 rounded-sm text-sm font-medium text-[#666] hover:bg-stone-100 transition-colors"
              >
                {t("admin.cancel")}
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-gold px-6 py-2.5 rounded-sm text-sm font-medium disabled:opacity-50">
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
              <p className="text-sm text-[#666] mb-3">{t("admin.fillRequiredFields") || "Popunite sva obavezna polja pre nego što sačuvate proizvod:"}</p>
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
                className="btn-gold px-6 py-2.5 rounded-sm text-sm font-medium"
              >
                {t("admin.understood") || "Razumem"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
