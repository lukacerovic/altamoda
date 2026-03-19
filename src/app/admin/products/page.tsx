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
  FolderTree,
  Image as ImageIcon,
  Star,
  Film,
  FileImage,
  Palette,
  ShieldCheck,
  BarChart3,
  Globe,
  Layers,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

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
  badges: { isNew: boolean; isFeatured: boolean; isProfessionalOnly: boolean };
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
  seoTitle: string;
  metaDescription: string;
  slug: string;
  attributes: {
    sulfateFree: boolean;
    parabenFree: boolean;
    ammoniaFree: boolean;
    vegan: boolean;
    hairTypes: string[];
  };
}

type TabKey = "osnovno" | "cene" | "sadrzaj" | "mediji" | "zalihe" | "boja" | "seo" | "atributi";

/* ───────────────────────── Constants ───────────────────────── */

const brands = ["Svi brendovi", "L'Or\u00e9al", "Schwarzkopf", "K\u00e9rastase", "Wella", "Moroccanoil"];
const categories = ["Sve kategorije", "Nega kose", "Boje za kosu", "Styling", "Ulja i serumi"];
const statuses = ["Svi statusi", "Aktivan", "Neaktivan"];

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

const colorUndertones = [
  { value: "N", label: "N - Neutralni" },
  { value: "A", label: "A - Pepeljasti" },
  { value: "G", label: "G - Zlatni" },
  { value: "C", label: "C - Bakarni" },
  { value: "R", label: "R - Crveni" },
  { value: "V", label: "V - Ljubi\u010dasti" },
  { value: "M", label: "M - Mahagoni" },
  { value: "B", label: "B - Braon" },
];

const hairTypeOptions = ["Normalna", "Suva", "Masna", "Farbana", "O\u0161te\u0107ena", "Kovrd\u017eava"];

/* ───────────────────────── Mock Data ───────────────────────── */

const initialProducts: Product[] = [
  {
    id: 1, name: "Serie Expert Gold Quinoa", sku: "LOR-SE-GQ001", brand: "L'Or\u00e9al", productLine: "Serie Expert",
    category: "Nega kose", subCategory: "\u0160amponi", priceB2C: 2500, priceB2B: 1800, oldPrice: 3200, purchasePrice: 1200,
    stock: 45, lowStockThreshold: 10, weight: 300, volume: 300, status: "active",
    badges: { isNew: false, isFeatured: true, isProfessionalOnly: false },
    description: "Profesionalni \u0161ampon za o\u0161te\u0107enu kosu sa zlatnim kvinojom.",
    ingredients: "Aqua, Sodium Laureth Sulfate, Gold Quinoa Extract...",
    howToUse: "Nanesite na mokru kosu, upenite i isperite. Ponovite po potrebi.",
    images: [{ id: 1, url: "/products/loreal1.jpg", alt: "Serie Expert Gold Quinoa \u0161ampon", isPrimary: true }],
    videoUrl: "", gifUrl: "",
    seoTitle: "Serie Expert Gold Quinoa \u0160ampon | Alta Moda", metaDescription: "Profesionalni \u0161ampon za o\u0161te\u0107enu kosu. L'Or\u00e9al Serie Expert linija.", slug: "serie-expert-gold-quinoa",
    attributes: { sulfateFree: false, parabenFree: true, ammoniaFree: true, vegan: false, hairTypes: ["O\u0161te\u0107ena", "Farbana"] },
  },
  {
    id: 2, name: "BC Bonacure Peptide Repair", sku: "SCH-BC-PR001", brand: "Schwarzkopf", productLine: "BC Bonacure",
    category: "Nega kose", subCategory: "\u0160amponi", priceB2C: 1800, priceB2B: 1300, purchasePrice: 900,
    stock: 32, lowStockThreshold: 10, weight: 250, volume: 250, status: "active",
    badges: { isNew: true, isFeatured: false, isProfessionalOnly: false },
    description: "Rescue \u0161ampon za finu i o\u0161te\u0107enu kosu.",
    ingredients: "Aqua, Sodium Laureth Sulfate, Peptide Complex...",
    howToUse: "Nanesite na mokru kosu, masirajte i isperite.",
    images: [{ id: 1, url: "/products/schwarzkopf1.jpg", alt: "BC Bonacure Peptide Repair", isPrimary: true }],
    videoUrl: "", gifUrl: "",
    seoTitle: "BC Bonacure Peptide Repair | Alta Moda", metaDescription: "Schwarzkopf BC Bonacure Peptide Repair \u0161ampon za obnovu kose.", slug: "bc-bonacure-peptide-repair",
    attributes: { sulfateFree: true, parabenFree: true, ammoniaFree: true, vegan: false, hairTypes: ["O\u0161te\u0107ena", "Normalna"] },
  },
  {
    id: 3, name: "Elixir Ultime Serum", sku: "KER-EU-S001", brand: "K\u00e9rastase", productLine: "Elixir Ultime",
    category: "Ulja i serumi", subCategory: "Serumi", priceB2C: 4200, priceB2B: 3200, oldPrice: 4800, purchasePrice: 2200,
    stock: 3, lowStockThreshold: 5, weight: 100, volume: 100, status: "active",
    badges: { isNew: false, isFeatured: true, isProfessionalOnly: false },
    description: "Luksuzno ulje za izvanredan sjaj kose.",
    ingredients: "Cyclopentasiloxane, Dimethiconol, Argan Oil...",
    howToUse: "Nanesite 1-2 pumpe na suvu ili vla\u017enu kosu.",
    images: [{ id: 1, url: "/products/kerastase1.jpg", alt: "K\u00e9rastase Elixir Ultime", isPrimary: true }],
    videoUrl: "", gifUrl: "",
    seoTitle: "K\u00e9rastase Elixir Ultime Serum | Alta Moda", metaDescription: "Luksuzni serum za sjaj kose. K\u00e9rastase Elixir Ultime.", slug: "elixir-ultime-serum",
    attributes: { sulfateFree: true, parabenFree: true, ammoniaFree: true, vegan: false, hairTypes: ["Suva", "Normalna", "Farbana"] },
  },
  {
    id: 4, name: "Oil Reflections \u0160ampon", sku: "WEL-OR-S001", brand: "Wella", productLine: "Oil Reflections",
    category: "Nega kose", subCategory: "\u0160amponi", priceB2C: 1950, priceB2B: 1400, purchasePrice: 950,
    stock: 28, lowStockThreshold: 10, weight: 250, volume: 250, status: "active",
    badges: { isNew: false, isFeatured: false, isProfessionalOnly: false },
    description: "\u0160ampon za blistavu i glatku kosu.",
    ingredients: "Aqua, Sodium Laureth Sulfate, Camellia Oil...",
    howToUse: "Nanesite na mokru kosu, masirajte teme i isperite.",
    images: [{ id: 1, url: "/products/wella1.jpg", alt: "Wella Oil Reflections \u0161ampon", isPrimary: true }],
    videoUrl: "", gifUrl: "",
    seoTitle: "Wella Oil Reflections \u0160ampon | Alta Moda", metaDescription: "Wella Oil Reflections \u0161ampon za blistavu kosu.", slug: "oil-reflections-sampon",
    attributes: { sulfateFree: false, parabenFree: true, ammoniaFree: true, vegan: false, hairTypes: ["Normalna", "Suva"] },
  },
  {
    id: 5, name: "Moroccanoil Treatment 100ml", sku: "MOR-TR-001", brand: "Moroccanoil", productLine: "Treatment",
    category: "Ulja i serumi", subCategory: "Ulja", priceB2C: 3500, priceB2B: 2600, purchasePrice: 1800,
    stock: 15, lowStockThreshold: 5, weight: 120, volume: 100, status: "active",
    badges: { isNew: false, isFeatured: true, isProfessionalOnly: false },
    description: "Originalni Moroccanoil tretman za kosu sa arganovim uljem.",
    ingredients: "Cyclomethicone, Dimethicone, Argania Spinosa Kernel Oil...",
    howToUse: "Nanesite malu koli\u010dinu na vla\u017enu ili suvu kosu.",
    images: [{ id: 1, url: "/products/moroccanoil1.jpg", alt: "Moroccanoil Treatment", isPrimary: true }],
    videoUrl: "", gifUrl: "",
    seoTitle: "Moroccanoil Treatment Original | Alta Moda", metaDescription: "Originalni Moroccanoil tretman sa arganovim uljem.", slug: "moroccanoil-treatment-100ml",
    attributes: { sulfateFree: true, parabenFree: true, ammoniaFree: true, vegan: false, hairTypes: ["Suva", "O\u0161te\u0107ena", "Kovrd\u017eava"] },
  },
  {
    id: 6, name: "Igora Royal 60ml - 7.0", sku: "SCH-IR-700", brand: "Schwarzkopf", productLine: "Igora Royal",
    category: "Boje za kosu", subCategory: "Permanentne", priceB2C: 850, priceB2B: 580, purchasePrice: 350,
    stock: 120, lowStockThreshold: 20, weight: 80, volume: 60, status: "active",
    badges: { isNew: false, isFeatured: false, isProfessionalOnly: true },
    description: "Permanentna profesionalna boja za kosu. Nivo 7, prirodno plava.",
    ingredients: "Aqua, Cetearyl Alcohol, Propylene Glycol...",
    howToUse: "Pome\u0161ajte 1:1 sa razvo\u010diva\u010dem. Nanesite i ostavite 30-45 min.",
    images: [{ id: 1, url: "/products/igora1.jpg", alt: "Igora Royal 7.0", isPrimary: true }],
    videoUrl: "", gifUrl: "",
    colorLevel: 7, colorUndertone: "N", colorHex: "#8B6914", shadeCode: "7-0",
    seoTitle: "Igora Royal 7-0 Srednje Plava | Alta Moda", metaDescription: "Schwarzkopf Igora Royal 7-0 permanentna boja. Prirodno srednje plava.", slug: "igora-royal-7-0",
    attributes: { sulfateFree: false, parabenFree: false, ammoniaFree: false, vegan: false, hairTypes: [] },
  },
  {
    id: 7, name: "Majirel 50ml - 6.0", sku: "LOR-MJ-600", brand: "L'Or\u00e9al", productLine: "Majirel",
    category: "Boje za kosu", subCategory: "Permanentne", priceB2C: 900, priceB2B: 620, purchasePrice: 380,
    stock: 5, lowStockThreshold: 15, weight: 70, volume: 50, status: "active",
    badges: { isNew: false, isFeatured: false, isProfessionalOnly: true },
    description: "L'Or\u00e9al Majirel permanentna boja. Nivo 6, tamno plava.",
    ingredients: "Aqua, Cetearyl Alcohol, Hexylene Glycol...",
    howToUse: "Pome\u0161ajte sa oksidansom u srazmeri 1:1.5. Vreme delovanja 35 min.",
    images: [{ id: 1, url: "/products/majirel1.jpg", alt: "Majirel 6.0", isPrimary: true }],
    videoUrl: "", gifUrl: "",
    colorLevel: 6, colorUndertone: "N", colorHex: "#6B4226", shadeCode: "6.0",
    seoTitle: "L'Or\u00e9al Majirel 6.0 Tamno Plava | Alta Moda", metaDescription: "L'Or\u00e9al Majirel 6.0 profesionalna permanentna boja.", slug: "majirel-6-0",
    attributes: { sulfateFree: false, parabenFree: false, ammoniaFree: false, vegan: false, hairTypes: [] },
  },
  {
    id: 8, name: "OSIS+ Dust It", sku: "SCH-OS-DI01", brand: "Schwarzkopf", productLine: "OSIS+",
    category: "Styling", subCategory: "Puderi", priceB2C: 1200, priceB2B: 850, purchasePrice: 550,
    stock: 42, lowStockThreshold: 10, weight: 10, volume: 10, status: "inactive",
    badges: { isNew: false, isFeatured: false, isProfessionalOnly: true },
    description: "Matirajuc\u0301i puder za volumen i teksturu.",
    ingredients: "Silica, Magnesium Stearate...",
    howToUse: "Nanesite malu koli\u010dinu na korenove kose i umasirajte.",
    images: [{ id: 1, url: "/products/osis1.jpg", alt: "OSIS+ Dust It puder", isPrimary: true }],
    videoUrl: "", gifUrl: "",
    seoTitle: "OSIS+ Dust It Puder za Volumen | Alta Moda", metaDescription: "Schwarzkopf OSIS+ Dust It matirajuc\u0301i puder za volumen.", slug: "osis-dust-it",
    attributes: { sulfateFree: true, parabenFree: true, ammoniaFree: true, vegan: true, hairTypes: ["Normalna", "Masna"] },
  },
  {
    id: 9, name: "Tecni Art Pli Shaper", sku: "LOR-TA-PS01", brand: "L'Or\u00e9al", productLine: "Tecni Art",
    category: "Styling", subCategory: "Gelovi", priceB2C: 1450, priceB2B: 1050, purchasePrice: 680,
    stock: 18, lowStockThreshold: 8, weight: 190, volume: 190, status: "active",
    badges: { isNew: true, isFeatured: false, isProfessionalOnly: true },
    description: "Termo-aktivni gel za dugotrajno oblikovanje.",
    ingredients: "Aqua, VP/VA Copolymer, PEG-40 Hydrogenated Castor Oil...",
    howToUse: "Nanesite na vla\u017enu kosu pre feniranja.",
    images: [{ id: 1, url: "/products/tecniart1.jpg", alt: "Tecni Art Pli Shaper", isPrimary: true }],
    videoUrl: "", gifUrl: "",
    seoTitle: "Tecni Art Pli Shaper | Alta Moda", metaDescription: "L'Or\u00e9al Tecni Art Pli termo-aktivni gel.", slug: "tecni-art-pli-shaper",
    attributes: { sulfateFree: true, parabenFree: true, ammoniaFree: true, vegan: false, hairTypes: ["Normalna", "Suva"] },
  },
  {
    id: 10, name: "Koleston Perfect 60ml - 8/0", sku: "WEL-KP-800", brand: "Wella", productLine: "Koleston Perfect",
    category: "Boje za kosu", subCategory: "Permanentne", priceB2C: 950, priceB2B: 650, purchasePrice: 400,
    stock: 4, lowStockThreshold: 15, weight: 80, volume: 60, status: "active",
    badges: { isNew: false, isFeatured: false, isProfessionalOnly: true },
    description: "Profesionalna permanentna boja za kosu. Svetlo plava.",
    ingredients: "Aqua, Cetearyl Alcohol, Propylene Glycol...",
    howToUse: "Pome\u0161ajte sa Welloxon Perfect. Nanesite i ostavite 30 min.",
    images: [{ id: 1, url: "/products/koleston1.jpg", alt: "Koleston Perfect 8/0", isPrimary: true }],
    videoUrl: "", gifUrl: "",
    colorLevel: 8, colorUndertone: "N", colorHex: "#B8860B", shadeCode: "8/0",
    seoTitle: "Koleston Perfect 8/0 Svetlo Plava | Alta Moda", metaDescription: "Wella Koleston Perfect 8/0 permanentna boja.", slug: "koleston-perfect-8-0",
    attributes: { sulfateFree: false, parabenFree: false, ammoniaFree: false, vegan: false, hairTypes: [] },
  },
  {
    id: 11, name: "BlondMe Premium Lift", sku: "SCH-BM-PL01", brand: "Schwarzkopf", productLine: "BlondMe",
    category: "Boje za kosu", subCategory: "Posvetliva\u010di", priceB2C: 1100, priceB2B: 780, purchasePrice: 480,
    stock: 55, lowStockThreshold: 15, weight: 450, volume: 450, status: "active",
    badges: { isNew: false, isFeatured: true, isProfessionalOnly: true },
    description: "Premium puder za posvetljivanje do 9 nivoa.",
    ingredients: "Potassium Persulfate, Sodium Silicate, Magnesium Carbonate...",
    howToUse: "Pome\u0161ajte 1:2 sa razvo\u010diva\u010dem. Ne koristiti na ko\u017ei glave.",
    images: [{ id: 1, url: "/products/blondme1.jpg", alt: "BlondMe Premium Lift", isPrimary: true }],
    videoUrl: "", gifUrl: "",
    seoTitle: "BlondMe Premium Lift Posvetliva\u010d | Alta Moda", metaDescription: "Schwarzkopf BlondMe Premium Lift puder za posvetljivanje.", slug: "blondme-premium-lift",
    attributes: { sulfateFree: false, parabenFree: false, ammoniaFree: false, vegan: false, hairTypes: [] },
  },
  {
    id: 12, name: "Mythic Oil Huile", sku: "LOR-MO-H001", brand: "L'Or\u00e9al", productLine: "Serie Expert",
    category: "Ulja i serumi", subCategory: "Ulja", priceB2C: 2800, priceB2B: 2100, purchasePrice: 1400,
    stock: 22, lowStockThreshold: 8, weight: 120, volume: 100, status: "active",
    badges: { isNew: false, isFeatured: false, isProfessionalOnly: false },
    description: "Hranljivo ulje za kosu na bazi arganovog ulja.",
    ingredients: "Cyclomethicone, Dimethiconol, Argania Spinosa Oil...",
    howToUse: "Nanesite 1-2 kapi na krajeve kose. Mo\u017ee se koristiti na suvu ili vla\u017enu kosu.",
    images: [{ id: 1, url: "/products/mythic1.jpg", alt: "L'Or\u00e9al Mythic Oil", isPrimary: true }],
    videoUrl: "", gifUrl: "",
    seoTitle: "L'Or\u00e9al Mythic Oil Huile | Alta Moda", metaDescription: "L'Or\u00e9al Mythic Oil hranljivo ulje za kosu.", slug: "mythic-oil-huile",
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
  badges: { isNew: false, isFeatured: false, isProfessionalOnly: false },
  description: "",
  ingredients: "",
  howToUse: "",
  images: [],
  videoUrl: "",
  gifUrl: "",
  seoTitle: "",
  metaDescription: "",
  slug: "",
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
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("Svi brendovi");
  const [categoryFilter, setCategoryFilter] = useState("Sve kategorije");
  const [statusFilter, setStatusFilter] = useState("Svi statusi");
  const [currentPage, setCurrentPage] = useState(1);
  const [showPanel, setShowPanel] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("osnovno");

  const [formData, setFormData] = useState<Omit<Product, "id">>(defaultFormData());
  // Separate state for discount % input so user can type it
  const [discountInput, setDiscountInput] = useState("");

  const perPage = 8;

  /* ── Filtered / paginated ── */
  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
      const matchBrand = brandFilter === "Svi brendovi" || p.brand === brandFilter;
      const matchCategory = categoryFilter === "Sve kategorije" || p.category === categoryFilter;
      const matchStatus =
        statusFilter === "Svi statusi" ||
        (statusFilter === "Aktivan" && p.status === "active") ||
        (statusFilter === "Neaktivan" && p.status === "inactive");
      return matchSearch && matchBrand && matchCategory && matchStatus;
    });
  }, [products, search, brandFilter, categoryFilter, statusFilter]);

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

  const handleSave = () => {
    if (editingProduct) {
      setProducts(products.map((p) => (p.id === editingProduct.id ? { ...formData, id: editingProduct.id } : p)));
    } else {
      const newProduct: Product = {
        ...formData,
        id: Math.max(0, ...products.map((p) => p.id)) + 1,
        images: formData.images.length > 0 ? formData.images : [{ id: 1, url: "/products/placeholder.jpg", alt: formData.name, isPrimary: true }],
      };
      setProducts([newProduct, ...products]);
    }
    setShowPanel(false);
  };

  const handleDelete = (id: number) => {
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

  const bulkAction = (action: string) => {
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

  const showColorTab = formData.category === "Boje za kosu";

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "osnovno", label: "Osnovno", icon: <Layers size={16} /> },
    { key: "cene", label: "Cene", icon: <BarChart3 size={16} /> },
    { key: "sadrzaj", label: "Sadr\u017eaj", icon: <FileImage size={16} /> },
    { key: "mediji", label: "Mediji", icon: <ImageIcon size={16} /> },
    { key: "zalihe", label: "Zalihe", icon: <Package size={16} /> },
    ...(showColorTab ? [{ key: "boja" as TabKey, label: "Boja", icon: <Palette size={16} /> }] : []),
    { key: "seo", label: "SEO", icon: <Globe size={16} /> },
    { key: "atributi", label: "Atributi", icon: <ShieldCheck size={16} /> },
  ];

  /* ── Common input class ── */
  const inputCls = "w-full px-4 py-2.5 border border-[#e0d8cc] rounded-lg text-sm focus:outline-none focus:border-[#8c4a5a] bg-white text-[#2d2d2d] placeholder:text-[#aaa]";
  const labelCls = "block text-sm font-medium text-[#333] mb-1.5";
  const sectionCls = "space-y-5";

  /* ───────────────────── RENDER ───────────────────── */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#2d2d2d]">Proizvodi</h1>
          <p className="text-sm text-[#666] mt-1">{products.length} ukupno proizvoda</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openAddPanel}
            className="btn-gold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2"
          >
            <Plus size={18} />
            Dodaj Proizvod
          </button>
          <Link
            href="/admin/import"
            className="px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 border border-[#e0d8cc] text-[#2d2d2d] hover:bg-[#f5f0e8] transition-colors"
          >
            <Upload size={16} />
            Uvezi CSV/Excel
          </Link>
          <button
            onClick={() => alert("Upravljanje kategorijama \u0107e uskoro biti dostupno.")}
            className="px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 border border-[#e0d8cc] text-[#2d2d2d] hover:bg-[#f5f0e8] transition-colors"
          >
            <FolderTree size={16} />
            Upravljaj kategorijama
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-[#e0d8cc] p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
            <input
              type="text"
              placeholder="Pretra\u017ei po nazivu, brendu ili SKU..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-[#f5f0e8] border border-transparent rounded-lg text-sm focus:bg-white focus:border-[#8c4a5a] focus:outline-none"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden flex items-center gap-2 px-4 py-2.5 bg-[#f5f0e8] rounded-lg text-sm text-[#666]"
          >
            <Filter size={16} />
            Filteri
          </button>
          <div className={`${showFilters ? "flex" : "hidden"} sm:flex flex-col sm:flex-row gap-3`}>
            <select value={brandFilter} onChange={(e) => { setBrandFilter(e.target.value); setCurrentPage(1); }} className="px-3 py-2.5 bg-[#f5f0e8] border border-transparent rounded-lg text-sm cursor-pointer focus:border-[#8c4a5a] focus:outline-none">
              {brands.map((b) => <option key={b}>{b}</option>)}
            </select>
            <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }} className="px-3 py-2.5 bg-[#f5f0e8] border border-transparent rounded-lg text-sm cursor-pointer focus:border-[#8c4a5a] focus:outline-none">
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="px-3 py-2.5 bg-[#f5f0e8] border border-transparent rounded-lg text-sm cursor-pointer focus:border-[#8c4a5a] focus:outline-none">
              {statuses.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[#f0f0f0] flex items-center gap-3">
            <span className="text-sm text-[#666]">{selectedIds.length} selektovano</span>
            <div className="relative">
              <button
                onClick={() => setShowBulkMenu(!showBulkMenu)}
                className="px-3 py-1.5 bg-[#2d2d2d] text-white rounded-lg text-sm flex items-center gap-1"
              >
                Akcije <MoreVertical size={14} />
              </button>
              {showBulkMenu && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-lg shadow-xl border border-[#e0d8cc] overflow-hidden z-10">
                  <button onClick={() => bulkAction("activate")} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[#333] hover:bg-[#f5f0e8]">
                    <Eye size={14} /> Aktiviraj
                  </button>
                  <button onClick={() => bulkAction("deactivate")} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[#333] hover:bg-[#f5f0e8]">
                    <EyeOff size={14} /> Deaktiviraj
                  </button>
                  <button onClick={() => bulkAction("delete")} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50">
                    <Trash2 size={14} /> Obri\u0161i
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-[#e0d8cc] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f5f0e8] border-b border-[#e0d8cc]">
                <th className="px-4 py-3 text-left">
                  <button onClick={selectAll} className="text-[#999] hover:text-[#2d2d2d]">
                    {selectedIds.length === paginated.length && paginated.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">Proizvod</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden xl:table-cell">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden md:table-cell">Brend</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden lg:table-cell">Kategorija</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">Cena B2C</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden lg:table-cell">Cena B2B</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden sm:table-cell">Zalihe</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider hidden sm:table-cell">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">Akcije</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {paginated.map((product) => (
                <tr key={product.id} className="hover:bg-[#f5f0e8] transition-colors">
                  <td className="px-4 py-3">
                    <button onClick={() => toggleSelect(product.id)} className="text-[#999] hover:text-[#2d2d2d]">
                      {selectedIds.includes(product.id) ? <CheckSquare size={18} className="text-[#8c4a5a]" /> : <Square size={18} />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#f5f0e8] flex items-center justify-center flex-shrink-0">
                        <Package size={18} className="text-[#999]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-[#2d2d2d] truncate max-w-[200px]">{product.name}</p>
                          {product.badges.isProfessionalOnly && (
                            <span className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-[#8c4a5a]/10 text-[#8c4a5a]">
                              <ShieldCheck size={10} /> B2B
                            </span>
                          )}
                          {product.badges.isNew && (
                            <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">Novo</span>
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
                      <span className="text-sm font-medium text-[#2d2d2d]">{product.priceB2C.toLocaleString()} RSD</span>
                      {product.oldPrice && (
                        <span className="block text-xs text-[#999] line-through">{product.oldPrice.toLocaleString()} RSD</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#333] hidden lg:table-cell">{product.priceB2B.toLocaleString()} RSD</td>
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
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${product.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {product.status === "active" ? "Aktivan" : "Neaktivan"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEditPanel(product)} className="p-1.5 text-[#999] hover:text-[#8c4a5a] hover:bg-[#8c4a5a]/10 rounded-lg transition-colors">
                        <Edit3 size={15} />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-1.5 text-[#999] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-sm text-[#999]">
                    Nema proizvoda koji odgovaraju pretrazi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-[#e0d8cc] flex items-center justify-between">
            <span className="text-sm text-[#666]">
              Prikazano {(currentPage - 1) * perPage + 1}&ndash;{Math.min(currentPage * perPage, filtered.length)} od {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg text-[#666] hover:bg-[#f5f0e8] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${page === currentPage ? "bg-[#8c4a5a] text-white" : "text-[#666] hover:bg-[#f5f0e8]"}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg text-[#666] hover:bg-[#f5f0e8] disabled:opacity-30 disabled:cursor-not-allowed"
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
            <div className="flex-shrink-0 px-6 py-4 border-b border-[#e0d8cc] flex items-center justify-between bg-white">
              <h2 className="text-lg font-serif font-bold text-[#2d2d2d]">
                {editingProduct ? "Izmeni Proizvod" : "Dodaj Proizvod"}
              </h2>
              <button onClick={() => setShowPanel(false)} className="p-2 text-[#999] hover:text-[#2d2d2d] hover:bg-[#f5f0e8] rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Tab Bar */}
            <div className="flex-shrink-0 border-b border-[#e0d8cc] bg-[#faf8f4] overflow-x-auto">
              <div className="flex min-w-max px-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.key
                        ? "border-[#8c4a5a] text-[#8c4a5a]"
                        : "border-transparent text-[#666] hover:text-[#2d2d2d] hover:border-[#ccc]"
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
                    <label className={labelCls}>Naziv proizvoda *</label>
                    <input type="text" value={formData.name} onChange={(e) => handleNameChange(e.target.value)} className={inputCls} placeholder="Unesite naziv proizvoda..." />
                  </div>

                  <div>
                    <label className={labelCls}>SKU (\u0161ifra) *</label>
                    <input type="text" value={formData.sku} onChange={(e) => updateForm("sku", e.target.value)} className={inputCls} placeholder="npr. LOR-MJ-600" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Brend</label>
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
                        {brands.filter((b) => b !== "Svi brendovi").map((b) => <option key={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Linija proizvoda</label>
                      <select value={formData.productLine} onChange={(e) => updateForm("productLine", e.target.value)} className={inputCls + " cursor-pointer"}>
                        {(brandProductLines[formData.brand] || []).map((l) => <option key={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Kategorija</label>
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
                        {categories.filter((c) => c !== "Sve kategorije").map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Podkategorija</label>
                      <select value={formData.subCategory} onChange={(e) => updateForm("subCategory", e.target.value)} className={inputCls + " cursor-pointer"}>
                        {(categoryHierarchy[formData.category] || []).map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Status toggle */}
                  <div>
                    <label className={labelCls}>Status</label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => updateForm("status", formData.status === "active" ? "inactive" : "active")}
                        className={`relative w-12 h-6 rounded-full transition-colors ${formData.status === "active" ? "bg-[#8c4a5a]" : "bg-gray-300"}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.status === "active" ? "translate-x-[26px]" : "translate-x-[2px]"}`} />
                      </button>
                      <span className="text-sm text-[#666]">{formData.status === "active" ? "Aktivan" : "Neaktivan"}</span>
                    </div>
                  </div>

                  {/* Badges */}
                  <div>
                    <label className={labelCls}>Oznake / Badges</label>
                    <div className="flex flex-wrap gap-4 mt-1">
                      {([
                        { key: "isNew" as const, label: "Novo" },
                        { key: "isFeatured" as const, label: "Izdvojeno" },
                        { key: "isProfessionalOnly" as const, label: "Profesionalno (samo B2B)" },
                      ]).map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.badges[key]}
                            onChange={(e) => updateForm("badges", { ...formData.badges, [key]: e.target.checked })}
                            className="w-4 h-4 rounded border-[#e0d8cc] text-[#8c4a5a] accent-[#8c4a5a]"
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
                      <label className={labelCls}>Cena B2C (RSD) *</label>
                      <input
                        type="number"
                        value={formData.priceB2C || ""}
                        onChange={(e) => updateForm("priceB2C", Number(e.target.value) || 0)}
                        className={inputCls}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Cena B2B (RSD) *</label>
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
                      <label className={labelCls}>Stara cena (RSD)</label>
                      <input
                        type="number"
                        value={formData.oldPrice || ""}
                        onChange={(e) => handleOldPriceChange(e.target.value)}
                        className={inputCls}
                        placeholder="Za prikaz popusta"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Popust %</label>
                      <input
                        type="number"
                        value={discountInput}
                        onChange={(e) => handleDiscountChange(e.target.value)}
                        className={inputCls}
                        placeholder="Auto ili unesite %"
                        min={0}
                        max={99}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Nabavna cena (RSD)</label>
                    <input
                      type="number"
                      value={formData.purchasePrice || ""}
                      onChange={(e) => updateForm("purchasePrice", Number(e.target.value) || 0)}
                      className={inputCls}
                      placeholder="0"
                    />
                  </div>

                  {/* Margin info */}
                  {formData.purchasePrice > 0 && formData.priceB2C > 0 && (
                    <div className="p-3 bg-[#f5f0e8] rounded-lg text-sm text-[#666]">
                      Mar\u017ea B2C: <strong className="text-[#2d2d2d]">{Math.round(((formData.priceB2C - formData.purchasePrice) / formData.priceB2C) * 100)}%</strong>
                      {formData.priceB2B > 0 && (
                        <span className="ml-4">Mar\u017ea B2B: <strong className="text-[#2d2d2d]">{Math.round(((formData.priceB2B - formData.purchasePrice) / formData.priceB2B) * 100)}%</strong></span>
                      )}
                    </div>
                  )}

                  {/* Price Preview */}
                  <div>
                    <label className={labelCls}>Pregled cene na sajtu</label>
                    <div className="border border-[#e0d8cc] rounded-lg p-4 bg-[#faf8f4]">
                      <div className="flex items-baseline gap-3">
                        <span className="text-2xl font-bold text-[#2d2d2d]">{(formData.priceB2C || 0).toLocaleString()} RSD</span>
                        {formData.oldPrice && formData.oldPrice > formData.priceB2C && (
                          <>
                            <span className="text-lg text-[#999] line-through">{formData.oldPrice.toLocaleString()} RSD</span>
                            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded">-{discountPercent}%</span>
                          </>
                        )}
                      </div>
                      {formData.badges.isProfessionalOnly && (
                        <p className="text-xs text-[#8c4a5a] mt-1 flex items-center gap-1"><ShieldCheck size={12} /> Samo za profesionalce</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Tab: Sadr\u017eaj ── */}
              {activeTab === "sadrzaj" && (
                <div className={sectionCls}>
                  <div>
                    <label className={labelCls}>Opis proizvoda</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => updateForm("description", e.target.value)}
                      rows={6}
                      className={inputCls + " resize-y"}
                      placeholder="Detaljni opis proizvoda..."
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Sastojci / Sastav</label>
                    <textarea
                      value={formData.ingredients}
                      onChange={(e) => updateForm("ingredients", e.target.value)}
                      rows={4}
                      className={inputCls + " resize-y"}
                      placeholder="Aqua, Sodium Laureth Sulfate..."
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Na\u010din upotrebe</label>
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
                    <label className={labelCls}>Slike proizvoda</label>
                    <p className="text-xs text-[#999] mb-3">Prevucite slike ili kliknite za upload. Prva slika je glavna.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {formData.images.map((img, idx) => (
                        <div key={img.id} className="relative group border border-[#e0d8cc] rounded-lg overflow-hidden aspect-square bg-[#f5f0e8] flex items-center justify-center">
                          <div className="text-center p-2">
                            <ImageIcon size={28} className="mx-auto text-[#bbb] mb-1" />
                            <p className="text-[10px] text-[#999] truncate max-w-full">{img.url.split("/").pop()}</p>
                          </div>
                          {img.isPrimary && (
                            <div className="absolute top-1 left-1 bg-[#8c4a5a] text-white px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5">
                              <Star size={10} /> Glavna
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                const updated = formData.images.map((im) => ({ ...im, isPrimary: im.id === img.id }));
                                updateForm("images", updated);
                              }}
                              className="p-1.5 bg-white rounded-lg text-[#8c4a5a] hover:bg-[#f5f0e8]"
                              title="Postavi kao glavnu"
                            >
                              <Star size={14} />
                            </button>
                            <button
                              onClick={() => updateForm("images", formData.images.filter((_, i) => i !== idx))}
                              className="p-1.5 bg-white rounded-lg text-red-500 hover:bg-red-50"
                              title="Ukloni"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Add placeholder */}
                      <button
                        onClick={() => {
                          const newId = Math.max(0, ...formData.images.map((i) => i.id)) + 1;
                          updateForm("images", [
                            ...formData.images,
                            { id: newId, url: `/products/new-${newId}.jpg`, alt: formData.name, isPrimary: formData.images.length === 0 },
                          ]);
                        }}
                        className="border-2 border-dashed border-[#e0d8cc] rounded-lg aspect-square flex flex-col items-center justify-center gap-2 text-[#999] hover:border-[#8c4a5a] hover:text-[#8c4a5a] transition-colors cursor-pointer"
                      >
                        <Upload size={24} />
                        <span className="text-xs">Dodaj sliku</span>
                      </button>
                    </div>
                  </div>

                  {/* Alt texts */}
                  {formData.images.length > 0 && (
                    <div>
                      <label className={labelCls}>Alt tekstovi slika</label>
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
                              placeholder="Alt tekst..."
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>
                        <span className="flex items-center gap-1.5"><Film size={14} /> Video URL</span>
                      </label>
                      <input type="url" value={formData.videoUrl} onChange={(e) => updateForm("videoUrl", e.target.value)} className={inputCls} placeholder="https://youtube.com/..." />
                    </div>
                    <div>
                      <label className={labelCls}>
                        <span className="flex items-center gap-1.5"><FileImage size={14} /> GIF URL</span>
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
                      <label className={labelCls}>Koli\u010dina na zalihama *</label>
                      <input type="number" value={formData.stock || ""} onChange={(e) => updateForm("stock", Number(e.target.value) || 0)} className={inputCls} placeholder="0" min={0} />
                    </div>
                    <div>
                      <label className={labelCls}>Upozorenje za nisku zalihu</label>
                      <input type="number" value={formData.lowStockThreshold || ""} onChange={(e) => updateForm("lowStockThreshold", Number(e.target.value) || 0)} className={inputCls} placeholder="10" min={0} />
                    </div>
                  </div>

                  {formData.stock > 0 && formData.stock <= formData.lowStockThreshold && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                      <AlertTriangle size={16} />
                      Zalihe su ispod praga upozorenja ({formData.lowStockThreshold}).
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Te\u017eina (grami)</label>
                      <input type="number" value={formData.weight || ""} onChange={(e) => updateForm("weight", Number(e.target.value) || 0)} className={inputCls} placeholder="0" min={0} />
                    </div>
                    <div>
                      <label className={labelCls}>Zapremina (ml)</label>
                      <input type="number" value={formData.volume || ""} onChange={(e) => updateForm("volume", Number(e.target.value) || 0)} className={inputCls} placeholder="0" min={0} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Tab: Boja ── */}
              {activeTab === "boja" && showColorTab && (
                <div className={sectionCls}>
                  <div className="p-3 bg-[#f5f0e8] rounded-lg text-sm text-[#666] flex items-center gap-2">
                    <Palette size={16} className="text-[#8c4a5a]" />
                    Ovaj tab je dostupan samo za kategoriju &quot;Boje za kosu&quot;.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Nivo boje (1-10)</label>
                      <select value={formData.colorLevel || ""} onChange={(e) => updateForm("colorLevel", Number(e.target.value) || undefined)} className={inputCls + " cursor-pointer"}>
                        <option value="">Izaberite...</option>
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Podton</label>
                      <select value={formData.colorUndertone || ""} onChange={(e) => updateForm("colorUndertone", e.target.value || undefined)} className={inputCls + " cursor-pointer"}>
                        <option value="">Izaberite...</option>
                        {colorUndertones.map((u) => (
                          <option key={u.value} value={u.value}>{u.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Hex vrednost boje</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.colorHex || "#000000"}
                          onChange={(e) => updateForm("colorHex", e.target.value)}
                          className="w-10 h-10 rounded-lg border border-[#e0d8cc] cursor-pointer p-0.5"
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
                      <label className={labelCls}>\u0160ifra nijanse</label>
                      <input type="text" value={formData.shadeCode || ""} onChange={(e) => updateForm("shadeCode", e.target.value)} className={inputCls} placeholder="npr. 7-0" />
                    </div>
                  </div>

                  {/* Color preview */}
                  {formData.colorHex && (
                    <div className="flex items-center gap-3 p-3 bg-[#f5f0e8] rounded-lg">
                      <div className="w-12 h-12 rounded-lg border border-[#e0d8cc] shadow-inner" style={{ backgroundColor: formData.colorHex }} />
                      <div>
                        <p className="text-sm font-medium text-[#2d2d2d]">
                          {formData.shadeCode || "?"} &mdash; Nivo {formData.colorLevel || "?"} / {colorUndertones.find((u) => u.value === formData.colorUndertone)?.label || "?"}
                        </p>
                        <p className="text-xs text-[#999]">{formData.colorHex}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Tab: SEO ── */}
              {activeTab === "seo" && (
                <div className={sectionCls}>
                  <div>
                    <label className={labelCls}>
                      SEO naslov
                      <span className={`ml-2 text-xs ${(formData.seoTitle.length) > 60 ? "text-red-500" : "text-[#999]"}`}>
                        {formData.seoTitle.length}/60
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formData.seoTitle}
                      onChange={(e) => updateForm("seoTitle", e.target.value)}
                      className={inputCls}
                      placeholder="Naziv proizvoda | Alta Moda"
                      maxLength={80}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>
                      Meta opis
                      <span className={`ml-2 text-xs ${(formData.metaDescription.length) > 160 ? "text-red-500" : "text-[#999]"}`}>
                        {formData.metaDescription.length}/160
                      </span>
                    </label>
                    <textarea
                      value={formData.metaDescription}
                      onChange={(e) => updateForm("metaDescription", e.target.value)}
                      rows={3}
                      className={inputCls + " resize-y"}
                      placeholder="Kratak opis za pretra\u017eiva\u010de..."
                      maxLength={200}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>URL slug</label>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-[#999]">/proizvodi/</span>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => updateForm("slug", e.target.value)}
                        className={inputCls}
                        placeholder="auto-generisan-slug"
                      />
                    </div>
                    <p className="text-xs text-[#999] mt-1">Automatski generisan iz naziva. Mo\u017eete ru\u010dno izmeniti.</p>
                  </div>

                  {/* SEO Preview */}
                  <div>
                    <label className={labelCls}>Pregled u pretra\u017eiva\u010du</label>
                    <div className="border border-[#e0d8cc] rounded-lg p-4 bg-white space-y-1">
                      <p className="text-blue-700 text-base font-medium truncate">{formData.seoTitle || formData.name || "Naziv proizvoda"}</p>
                      <p className="text-green-700 text-xs">altamoda.rs/proizvodi/{formData.slug || "..."}</p>
                      <p className="text-sm text-[#555] line-clamp-2">{formData.metaDescription || formData.description || "Meta opis proizvoda..."}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Tab: Atributi ── */}
              {activeTab === "atributi" && (
                <div className={sectionCls}>
                  <div>
                    <label className={labelCls}>Svojstva proizvoda</label>
                    <div className="space-y-3 mt-1">
                      {([
                        { key: "sulfateFree" as const, label: "Bez sulfata" },
                        { key: "parabenFree" as const, label: "Bez parabena" },
                        { key: "ammoniaFree" as const, label: "Bez amonijaka" },
                        { key: "vegan" as const, label: "Vegan" },
                      ]).map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between py-2 border-b border-[#f0f0f0]">
                          <span className="text-sm text-[#333]">{label}</span>
                          <button
                            type="button"
                            onClick={() => updateForm("attributes", { ...formData.attributes, [key]: !formData.attributes[key] })}
                            className={`relative w-11 h-6 rounded-full transition-colors ${formData.attributes[key] ? "bg-[#8c4a5a]" : "bg-gray-300"}`}
                          >
                            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.attributes[key] ? "translate-x-[22px]" : "translate-x-[2px]"}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Tip kose (vi\u0161estruki izbor)</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {hairTypeOptions.map((ht) => {
                        const selected = formData.attributes.hairTypes.includes(ht);
                        return (
                          <button
                            key={ht}
                            type="button"
                            onClick={() => {
                              const newTypes = selected
                                ? formData.attributes.hairTypes.filter((t) => t !== ht)
                                : [...formData.attributes.hairTypes, ht];
                              updateForm("attributes", { ...formData.attributes, hairTypes: newTypes });
                            }}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                              selected
                                ? "bg-[#8c4a5a] text-white border-[#8c4a5a]"
                                : "bg-white text-[#666] border-[#e0d8cc] hover:border-[#8c4a5a] hover:text-[#8c4a5a]"
                            }`}
                          >
                            {ht}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Panel Footer (fixed) */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-[#e0d8cc] bg-white flex items-center justify-between">
              <button
                onClick={() => setShowPanel(false)}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-[#666] hover:bg-[#f5f0e8] transition-colors"
              >
                Otka\u017ei
              </button>
              <button onClick={handleSave} className="btn-gold px-6 py-2.5 rounded-lg text-sm font-medium">
                {editingProduct ? "Sa\u010duvaj Izmene" : "Dodaj Proizvod"}
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
    </div>
  );
}
