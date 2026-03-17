"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag, Heart, User, Star, ChevronRight, Minus, Plus, Truck,
  RotateCcw, Shield, Sparkles, Instagram, Facebook, Youtube, Mail, MapPin, Phone,
  Play, Share2, Copy, CheckCircle, X, Camera, Link2, AlertCircle,
} from "lucide-react";

const product = {
  id: 1, brand: "L'Oreal Professionnel", name: "Majirel 7.0 - Srednje Plava Boja za Kosu",
  rating: 4.8, reviewCount: 124, oldPrice: 1290, price: 890,
  productLine: "Majirel",
  professionalOnly: true,
  isColor: true,
  colorLevel: "7",
  colorUndertone: "Neutralni (Prirodni)",
  stock: 23,
  stockStatus: "in_stock" as const,
  expectedDate: "",
  description: "Majirel je permanentna boja za kosu koja pruza savrseno pokrivanje sedih i dugotrajnu postojanost boje. Ionene G i Incell tehnologija stite kosu tokom procesa farbanja, ostavljajuci je mekom, sjajnom i punom zivota. Idealna za profesionalnu upotrebu u salonu.",
  ingredients: "Aqua, Cetearyl Alcohol, Propylene Glycol, Deceth-3, Laureth-12, Oleth-30, Hexadimethrine Chloride, Ammonium Hydroxide, Oleyl Alcohol, Glycol Distearate, Sodium Metabisulfite, Parfum.",
  usage: "Pomesajte boju sa L'Oreal Oxydant kremom u odnosu 1:1.5. Nanesite na suvu kosu. Vreme delovanja: 35 minuta za potpuno pokrivanje, 20 minuta za osvezavanje boje. Isperite temeljno i nanesite odgovarajuci sampon i balzam.",
};

const reviews = [
  { id: 1, name: "Jelena M.", rating: 5, date: "10. mar 2026", text: "Odlicna boja! Pokrivanje sedih je savrseno, a kosa je meka i sjajna nakon tretmana. Preporucujem svim kolegama frizerima." },
  { id: 2, name: "Marko S.", rating: 4, date: "5. mar 2026", text: "Kvalitetna boja sa dobrim pokrivanjem. Jedina zamerka je sto bi mogla biti malo postojanija na pranje. Inace odlican proizvod." },
  { id: 3, name: "Ana P.", rating: 5, date: "28. feb 2026", text: "Koristim Majirel vec godinama i uvek sam zadovoljna rezultatom. Nijansa je tacna, a kosa ostaje u odlicnom stanju." },
];

const mainImages = [
  "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1599751449128-eb7249c3d6b1?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=800&fit=crop",
];

const related = [
  { id: 2, brand: "L'Oreal", name: "Majirel 6.0 Tamno Plava", price: 890, rating: 5, image: "https://images.unsplash.com/photo-1599751449128-eb7249c3d6b1?w=500&h=500&fit=crop" },
  { id: 3, brand: "L'Oreal", name: "Majirel 8.0 Svetlo Plava", price: 890, rating: 4, image: "https://images.unsplash.com/photo-1597354984706-fac992d9306f?w=500&h=500&fit=crop" },
  { id: 4, brand: "L'Oreal", name: "Oxydant Creme 6% 1000ml", price: 1200, rating: 5, image: "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=500&h=500&fit=crop" },
  { id: 5, brand: "L'Oreal", name: "Vitamino Color Šampon 300ml", price: 2100, rating: 4, image: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=500&h=500&fit=crop" },
];

const relatedShades = [
  { shade: "5.0", name: "Svetlo Smedja", color: "#6B4226" },
  { shade: "6.0", name: "Tamno Plava", color: "#8B6914" },
  { shade: "7.0", name: "Srednje Plava", color: "#A0824A", active: true },
  { shade: "7.1", name: "Pepeljasto Plava", color: "#9E8B6E" },
  { shade: "7.3", name: "Zlatno Plava", color: "#C4A265" },
  { shade: "7.4", name: "Bakarno Plava", color: "#B5651D" },
  { shade: "8.0", name: "Svetlo Plava", color: "#C4A97D" },
  { shade: "8.1", name: "Svetlo Pepeljasta", color: "#BEB09A" },
  { shade: "9.0", name: "Veoma Svetla Plava", color: "#D4C5A9" },
  { shade: "10.0", name: "Najsvetlija Plava", color: "#E8DCC8" },
];

export default function ProductDetailPage() {
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("opis");
  const [liked, setLiked] = useState(false);
  const [activeThumb, setActiveThumb] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [linkCopied, setLinkCopied] = useState(false);

  const tabs = [
    { key: "opis", label: "Opis" },
    { key: "sastojci", label: "Sastojci" },
    { key: "upotreba", label: "Nacin upotrebe" },
    { key: "recenzije", label: `Recenzije (${reviews.length})` },
  ];

  const handleCopyLink = () => {
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* HEADER */}
      <header className="bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <Link href="/" className="block"><img src="/logo.png" alt="Alta Moda" className="h-8" /></Link>
          <nav className="hidden md:flex items-center gap-6">
            {["Boje","Nega","Styling","Aparati","Akcije","Blog"].map((n) => (
              <Link key={n} href="/products" className="text-xs uppercase tracking-wide text-[#1a1a1a] hover:text-[#c8a96e] transition-colors font-medium">{n}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/wishlist" className="hidden sm:block"><Heart className="w-5 h-5 text-[#1a1a1a]" /></Link>
            <Link href="/account" className="hidden sm:block"><User className="w-5 h-5 text-[#1a1a1a]" /></Link>
            <Link href="/cart" className="relative"><ShoppingBag className="w-5 h-5 text-[#1a1a1a]" /><span className="absolute -top-2 -right-2 w-4 h-4 bg-[#c8a96e] text-white text-[10px] rounded-full flex items-center justify-center">2</span></Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-[#c8a96e]">Pocetna</Link><ChevronRight className="w-3 h-3" />
          <Link href="/products" className="hover:text-[#c8a96e]">Proizvodi</Link><ChevronRight className="w-3 h-3" />
          <Link href="/colors" className="hover:text-[#c8a96e]">Boje za kosu</Link><ChevronRight className="w-3 h-3" />
          <span className="text-[#1a1a1a]">{product.name}</span>
        </nav>

        {/* 2-Column layout */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* IMAGE GALLERY */}
          <div>
            <div className="aspect-square rounded-lg overflow-hidden mb-4 relative">
              <img src={mainImages[activeThumb]} alt={product.name} className="w-full h-full object-cover" />
              {/* Video play overlay for thumbnail 1 */}
              {activeThumb === 1 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center cursor-pointer hover:bg-white transition-colors">
                    <Play className="w-7 h-7 text-[#1a1a1a] ml-1" />
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {mainImages.map((img, t) => (
                <button key={t} onClick={() => setActiveThumb(t)} className={`aspect-square rounded overflow-hidden border-2 transition-colors relative ${activeThumb === t ? "border-[#c8a96e]" : "border-transparent hover:border-gray-200"}`}>
                  <img src={img} alt={`View ${t + 1}`} className="w-full h-full object-cover" />
                  {/* Video indicator on thumbnail 1 */}
                  {t === 1 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="w-5 h-5 text-white" />
                    </div>
                  )}
                  {/* GIF badge on thumbnail 2 */}
                  {t === 2 && (
                    <span className="absolute top-1 right-1 bg-[#c8a96e] text-white text-[8px] font-bold px-1.5 py-0.5 rounded">GIF</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* PRODUCT INFO */}
          <div>
            <span className="text-sm text-[#c8a96e] font-medium uppercase tracking-wider">{product.brand}</span>
            {/* Product Line */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">Linija proizvoda:</span>
              <Link href="/products?line=majirel" className="text-xs text-[#c8a96e] hover:text-[#a8894e] font-medium underline">{product.productLine}</Link>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a1a] mt-2 mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>{product.name}</h1>

            {/* Professional Use Badge */}
            {product.professionalOnly && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] text-white text-xs font-medium rounded mb-4">
                <AlertCircle className="w-3.5 h-3.5" />
                Samo za profesionalnu upotrebu
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < Math.round(product.rating) ? "fill-[#c8a96e] text-[#c8a96e]" : "text-gray-200"}`} />)}
              </div>
              <span className="text-sm text-gray-500">{product.rating} ({product.reviewCount} recenzija)</span>
            </div>

            {/* Availability Status */}
            <div className="mb-4">
              {product.stockStatus === "in_stock" ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-green-600 font-medium">
                  <CheckCircle className="w-4 h-4" /> Na stanju ({product.stock} kom)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm text-red-600 font-medium">
                  <X className="w-4 h-4" /> Nema na stanju - ocekujemo do {product.expectedDate}
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-gray-400 line-through text-lg">{product.oldPrice.toLocaleString("sr-RS")} RSD</span>
              <span className="text-3xl font-bold text-[#1a1a1a]">{product.price.toLocaleString("sr-RS")} RSD</span>
              <span className="bg-[#c0392b] text-white text-xs px-2 py-1 rounded font-semibold">-31%</span>
            </div>

            {/* B2B Price Indicator */}
            <div className="border-2 border-[#c8a96e] rounded-lg p-4 mb-6 bg-[#faf7f2]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#c8a96e]" />
                <div>
                  <span className="text-sm font-semibold text-[#c8a96e]">B2B Cena</span>
                  <p className="text-xs text-gray-500">Prijavite se za posebne cene za profesionalce i salone</p>
                </div>
              </div>
            </div>

            {/* Quantity + Add to cart */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center border border-gray-200 rounded">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"><Minus className="w-4 h-4" /></button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"><Plus className="w-4 h-4" /></button>
              </div>
              <button className="flex-1 bg-[#c8a96e] hover:bg-[#a8894e] text-white py-3 rounded font-medium transition-all flex items-center justify-center gap-2">
                <ShoppingBag className="w-5 h-5" /> Dodaj u Korpu
              </button>
              <button onClick={() => setLiked(!liked)} className={`w-12 h-12 border rounded flex items-center justify-center transition-colors ${liked ? "border-[#c0392b] bg-red-50" : "border-gray-200 hover:border-[#c8a96e]"}`}>
                <Heart className={`w-5 h-5 ${liked ? "fill-[#c0392b] text-[#c0392b]" : "text-gray-400"}`} />
              </button>
            </div>

            {/* Share Buttons */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xs text-gray-500">Podeli:</span>
              <a href="#" className="w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center hover:opacity-80 transition-opacity">
                <Facebook className="w-4 h-4 text-white" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center hover:opacity-80 transition-opacity">
                <Instagram className="w-4 h-4 text-white" />
              </a>
              <button onClick={handleCopyLink} className={`h-8 px-3 rounded-full flex items-center gap-1.5 text-xs font-medium transition-all ${linkCopied ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {linkCopied ? <><CheckCircle className="w-3.5 h-3.5" /> Kopirano!</> : <><Link2 className="w-3.5 h-3.5" /> Kopiraj link</>}
              </button>
            </div>

            {/* Delivery info */}
            <div className="bg-[#faf7f2] rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3 text-sm"><Truck className="w-5 h-5 text-[#c8a96e]" /><span><strong>Besplatna dostava</strong> za porudzbine preko 5.000 RSD</span></div>
              <div className="flex items-center gap-3 text-sm"><RotateCcw className="w-5 h-5 text-[#c8a96e]" /><span><strong>Povrat u roku od 14 dana</strong> bez pitanja</span></div>
              <div className="flex items-center gap-3 text-sm"><Shield className="w-5 h-5 text-[#c8a96e]" /><span><strong>Originalni proizvodi</strong> sa garancijom autenticnosti</span></div>
            </div>

            {/* Color Section - only for color products */}
            {product.isColor && (
              <div className="mt-6 bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="text-sm font-semibold text-[#1a1a1a] mb-3">Informacije o boji</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded p-3">
                    <span className="text-xs text-gray-500">Nivo (Level)</span>
                    <p className="text-sm font-semibold text-[#1a1a1a]">{product.colorLevel}</p>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <span className="text-xs text-gray-500">Podton (Undertone)</span>
                    <p className="text-sm font-semibold text-[#1a1a1a]">{product.colorUndertone}</p>
                  </div>
                </div>
                <h4 className="text-xs font-medium text-gray-500 mb-2">Srodne nijanse iz Majirel linije</h4>
                <div className="flex flex-wrap gap-2">
                  {relatedShades.map((shade) => (
                    <button key={shade.shade} className={`flex items-center gap-2 px-2.5 py-1.5 rounded border transition-colors ${shade.active ? "border-[#c8a96e] bg-[#faf7f2]" : "border-gray-200 hover:border-[#c8a96e]"}`}>
                      <div className="w-5 h-5 rounded-full border border-gray-200" style={{ backgroundColor: shade.color }} />
                      <span className="text-xs font-medium text-[#1a1a1a]">{shade.shade}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TABS */}
        <div className="mt-16">
          <div className="flex border-b border-gray-200 gap-0">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-6 py-3 text-sm font-medium transition-colors relative ${activeTab === tab.key ? "text-[#c8a96e] border-b-2 border-[#c8a96e]" : "text-gray-500 hover:text-[#1a1a1a]"}`}>{tab.label}</button>
            ))}
          </div>
          <div className="py-8">
            {activeTab === "opis" && <div className="prose max-w-none"><p className="text-gray-600 leading-relaxed">{product.description}</p></div>}
            {activeTab === "sastojci" && <div className="prose max-w-none"><p className="text-gray-600 leading-relaxed">{product.ingredients}</p></div>}
            {activeTab === "upotreba" && <div className="prose max-w-none"><p className="text-gray-600 leading-relaxed">{product.usage}</p></div>}
            {activeTab === "recenzije" && (
              <div>
                {/* Add Review Button */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="text-lg font-bold text-[#1a1a1a]">{product.rating}</span>
                    <span className="text-sm text-gray-500"> / 5 ({product.reviewCount} recenzija)</span>
                  </div>
                  <button onClick={() => setShowReviewForm(true)} className="px-4 py-2 bg-[#c8a96e] hover:bg-[#a8894e] text-white text-sm font-medium rounded transition-colors flex items-center gap-2">
                    <Star className="w-4 h-4" /> Oceni proizvod
                  </button>
                </div>

                <div className="space-y-6">
                  {reviews.map((r) => (
                    <div key={r.id} className="bg-white rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-semibold text-[#1a1a1a]">{r.name}</span>
                          <div className="flex items-center gap-0.5 mt-1">{[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < r.rating ? "fill-[#c8a96e] text-[#c8a96e]" : "text-gray-200"}`} />)}</div>
                        </div>
                        <span className="text-xs text-gray-400">{r.date}</span>
                      </div>
                      <p className="text-gray-600 text-sm mt-3">{r.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RELATED / RECOMMENDED */}
        <section className="mt-12 mb-16">
          <h2 className="text-2xl font-bold text-[#1a1a1a] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>Povezani proizvodi</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {related.map((p) => (
              <Link key={p.id} href={`/products/${p.id}`} className="product-card bg-white rounded-lg shadow-sm hover:shadow-md transition-all group overflow-hidden">
                <div className="aspect-square overflow-hidden">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="p-4">
                  <span className="text-xs text-[#c8a96e] font-medium uppercase tracking-wider">{p.brand}</span>
                  <h3 className="text-sm font-medium text-[#1a1a1a] mt-1 line-clamp-2">{p.name}</h3>
                  <div className="flex items-center gap-0.5 mt-2">{[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < p.rating ? "fill-[#c8a96e] text-[#c8a96e]" : "text-gray-200"}`} />)}</div>
                  <span className="text-base font-bold text-[#1a1a1a] mt-2 block">{p.price.toLocaleString("sr-RS")} RSD</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Review Form Modal */}
      {showReviewForm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowReviewForm(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => setShowReviewForm(false)} className="absolute top-4 right-4"><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
              <h3 className="text-xl font-bold text-[#1a1a1a] mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Oceni proizvod</h3>
              <p className="text-sm text-gray-500 mb-6">{product.name}</p>

              <div className="space-y-4">
                {/* Star Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vasa ocena</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setReviewRating(star)} className="p-1">
                        <Star className={`w-7 h-7 transition-colors ${star <= reviewRating ? "fill-[#c8a96e] text-[#c8a96e]" : "text-gray-200 hover:text-[#c8a96e]"}`} />
                      </button>
                    ))}
                    {reviewRating > 0 && <span className="text-sm text-gray-500 ml-2">{reviewRating}/5</span>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vase ime</label>
                  <input type="text" placeholder="Ime i prezime" className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:border-[#c8a96e] focus:outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Komentar</label>
                  <textarea rows={4} placeholder="Podelite svoje iskustvo sa ovim proizvodom..." className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm resize-none focus:border-[#c8a96e] focus:outline-none" />
                </div>

                {/* Photo Upload Area */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fotografija (opciono)</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-[#c8a96e] transition-colors cursor-pointer">
                    <Camera className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Kliknite da dodate fotografiju</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG do 5MB</p>
                  </div>
                </div>

                <button className="w-full bg-[#c8a96e] hover:bg-[#a8894e] text-white py-3 rounded font-medium transition-colors">
                  Posalji recenziju
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* FOOTER */}
      <footer className="bg-[#111] text-white/70">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <img src="/logo.png" alt="Alta Moda" className="h-6 brightness-0 invert mb-4" />
              <p className="text-sm">Vas pouzdani partner za profesionalnu frizersku opremu i kozmetiku.</p>
              <div className="flex items-center gap-3 mt-4">
                <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#c8a96e] transition-colors"><Instagram className="w-4 h-4" /></a>
                <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#c8a96e] transition-colors"><Facebook className="w-4 h-4" /></a>
                <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#c8a96e] transition-colors"><Youtube className="w-4 h-4" /></a>
              </div>
            </div>
            <div><h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Kupovina</h4><div className="space-y-2 text-sm"><Link href="/products" className="block hover:text-[#c8a96e]">Svi Proizvodi</Link><Link href="/colors" className="block hover:text-[#c8a96e]">Boje za Kosu</Link><Link href="/outlet" className="block hover:text-[#c8a96e]">Akcije</Link></div></div>
            <div><h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Informacije</h4><div className="space-y-2 text-sm"><Link href="/faq" className="block hover:text-[#c8a96e]">Cesta Pitanja</Link><Link href="/blog" className="block hover:text-[#c8a96e]">Blog</Link><Link href="/seminars" className="block hover:text-[#c8a96e]">Seminari</Link></div></div>
            <div><h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Kontakt</h4><div className="space-y-3 text-sm"><div className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 text-[#c8a96e]" /><span>Knez Mihailova 22, Beograd</span></div><div className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#c8a96e]" /><span>+381 11 123 4567</span></div><div className="flex items-center gap-2"><Mail className="w-4 h-4 text-[#c8a96e]" /><span>info@altamoda.rs</span></div></div></div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-xs">&copy; 2026 Alta Moda. Sva prava zadrzana.</span>
            <div className="flex items-center gap-4 text-xs"><span className="px-3 py-1 bg-white/10 rounded">Visa</span><span className="px-3 py-1 bg-white/10 rounded">Mastercard</span><span className="px-3 py-1 bg-white/10 rounded">PayPal</span></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
