"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight, Clock, ArrowRight,
} from "lucide-react";

const categories = ["Sve", "Trendovi", "Nega", "Styling", "Tehnika", "Poslovni saveti"];

const posts = [
  { id: 1, slug: "trendovi-boja-prolece-2026", title: "Trendovi boja za kosu - Proleće 2026", excerpt: "Otkrijte najaktuelnije nijanse i tehnike farbanja za predstojeću sezonu. Od mekanih balayage preliva do odvažnih crvenih tonova.", category: "Trendovi", date: "12. mar 2026", readTime: "5 min", image: "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=600&h=400&fit=crop" },
  { id: 2, slug: "nega-farbane-kose", title: "Kako pravilno negovati farbanu kosu", excerpt: "Kompletni vodič za održavanje boje i zdravlja farbane kose. Saznajte koje proizvode koristiti i koje greške izbegavati.", category: "Nega", date: "8. mar 2026", readTime: "7 min", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400&fit=crop" },
  { id: 3, slug: "top-5-styling-volumen", title: "Top 5 styling proizvoda za volumen", excerpt: "Pregled najboljih proizvoda za kreiranje volumena koji traje ceo dan. Od pena do sprejeva za korenove.", category: "Styling", date: "3. mar 2026", readTime: "4 min", image: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&h=400&fit=crop" },
  { id: 4, slug: "olaplex-vodic", title: "Olaplex sistem - Kompletni vodič", excerpt: "Sve što trebate znati o Olaplex sistemu za rekonstrukciju kose. Kako funkcioniše i kako ga pravilno koristiti.", category: "Tehnika", date: "28. feb 2026", readTime: "8 min", image: "https://images.unsplash.com/photo-1519735777090-ec97162dc266?w=600&h=400&fit=crop" },
  { id: 5, slug: "salon-marketing-2026", title: "Marketing strategije za frizerske salone u 2026", excerpt: "Kako privući nove klijente i zadržati postojeće koristeći digitalni marketing i društvene mreže.", category: "Poslovni saveti", date: "22. feb 2026", readTime: "6 min", image: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&h=400&fit=crop" },
  { id: 6, slug: "balayage-tehnika", title: "Balayage tehnika - korak po korak", excerpt: "Detaljno uputstvo za savršeni balayage efekat. Saveti od profesionalnih kolorista.", category: "Tehnika", date: "15. feb 2026", readTime: "10 min", image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=600&h=400&fit=crop" },
];

const popularPosts = posts.slice(0, 3);
const tags = ["Balayage", "Olaplex", "Boja za kosu", "Kerastase", "Nega", "Volumen", "Keratin", "Blonde", "Sampon", "Serum"];

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("Sve");

  const filtered = activeCategory === "Sve" ? posts : posts.filter((p) => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Hero */}
      <section className="relative h-[300px] md:h-[400px] overflow-hidden">
        <img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1600&h=600&fit=crop" alt="Blog" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-stone-900/70" />
        <div className="relative max-w-7xl mx-auto px-4 h-full flex items-center justify-center text-center">
          <div>
            <span className="text-secondary text-xs uppercase tracking-[0.25em] font-medium">Alta Moda Blog</span>
            <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-4 text-white" style={{ fontFamily: "'Noto Serif', serif" }}>Saveti, Trendovi & Inspiracija</h1>
            <p className="text-white/60 max-w-lg mx-auto">Najnoviji članci o nezi kose, trendovima farbanja, styling tehnikama i poslovnim savetima za profesionalce.</p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-secondary">Pocetna</Link><ChevronRight className="w-3 h-3" /><span className="text-black">Blog</span>
        </nav>

        {/* Category filter pills */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {categories.map((c) => (
            <button key={c} onClick={() => setActiveCategory(c)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === c ? "bg-black text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-black"}`}>{c}</button>
          ))}
        </div>

        <div className="flex gap-8">
          {/* Blog cards grid */}
          <div className="flex-1">
            <div className="grid md:grid-cols-2 gap-6">
              {filtered.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="group bg-white rounded-sm overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <div className="aspect-video overflow-hidden">
                    <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs text-secondary font-medium uppercase tracking-wider">{post.category}</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readTime}</span>
                    </div>
                    <h2 className="text-lg font-bold text-black group-hover:text-secondary transition-colors mb-2">{post.title}</h2>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">{post.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{post.date}</span>
                      <span className="text-sm text-secondary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">Procitaj vise <ArrowRight className="w-3 h-3" /></span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0 space-y-6">
            <div className="bg-white rounded-sm shadow-sm p-6">
              <h3 className="font-semibold text-black mb-4">Popularni Clanci</h3>
              <div className="space-y-4">
                {popularPosts.map((p, i) => (
                  <Link key={p.id} href={`/blog/${p.slug}`} className="flex gap-3 group">
                    <span className="text-2xl font-bold text-secondary/30">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <h4 className="text-sm font-medium text-black group-hover:text-secondary transition-colors line-clamp-2">{p.title}</h4>
                      <span className="text-xs text-gray-400">{p.date}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-sm shadow-sm p-6">
              <h3 className="font-semibold text-black mb-4">Tagovi</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-stone-50 text-secondary rounded-full text-xs font-medium hover:bg-black hover:text-white transition-colors cursor-pointer">{tag}</span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

    </div>
  );
}
