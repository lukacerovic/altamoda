"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight, Clock, Share2, Facebook as FacebookIcon,
  Star, MessageCircle, ThumbsUp,
  Mail,
} from "lucide-react";

const article = {
  title: "Trendovi boja za kosu - Prolece 2026",
  category: "Trendovi",
  author: "Ana Petrovic",
  date: "12. mart 2026",
  readTime: "5 min",
  content: [
    "Prolecna sezona 2026 donosi osvezavajuce promene u svetu boja za kosu. Od nežnih pastelnih tonova do odvaznih bakarnih nijansi, ovogodisnji trendovi su raznovrsni i uzbudljivi.",
    "Jedan od najzapazenijih trendova je takozvani \"Liquid Gold\" efekat - topla, zlatna nijansa koja savrseno reflektuje svetlost i daje kosi neodoljivu sjaj. Ovaj trend posebno lepo izgleda u kombinaciji sa balayage tehnikom.",
    "Za one koji preferiraju hladnije tonove, pepeljasto plava ostaje jedan od najtrazenijih zahteva u salonima. Kljuc za savrseni pepeljasti ton je kvalitetna priprema kose i koriscenje pravih proizvoda za odrzavanje boje.",
    "Bakar je jos jedan veliki trend za ovu sezonu. Od svetlog bakarnog do dubokog mahagoni tona, crveni spektar nudi mnogo mogucnosti za kreativno izrazavanje. Preporucujemo L'Oreal Majirel seriju za postizanje najtacnijih bakarnih tonova.",
    "Ne zaboravite na odrzavanje! Bez obzira koju boju odaberete, kvalitetna nega je kljuc za dugotrajnu i sjajnu boju. Preporucujemo Kerastase Chroma Absolu liniju za kompletnu zastitu farbane kose.",
  ],
};

const inlineProducts = [
  { id: 1, brand: "L'Oreal", name: "Majirel 7.43 Zlatno Bakar", price: 890, rating: 5, image: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=200&h=200&fit=crop" },
  { id: 2, brand: "Kerastase", name: "Chroma Absolu Sampon 250ml", price: 3200, rating: 5, image: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=200&h=200&fit=crop" },
];

const relatedPosts = [
  { slug: "nega-farbane-kose", title: "Kako pravilno negovati farbanu kosu", category: "Nega", date: "8. mar 2026", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400&fit=crop" },
  { slug: "balayage-tehnika", title: "Balayage tehnika - korak po korak", category: "Tehnika", date: "15. feb 2026", image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=600&h=400&fit=crop" },
  { slug: "olaplex-vodic", title: "Olaplex sistem - Kompletni vodič", category: "Tehnika", date: "28. feb 2026", image: "https://images.unsplash.com/photo-1519735777090-ec97162dc266?w=600&h=400&fit=crop" },
];

const comments = [
  { id: 1, name: "Milica R.", date: "13. mar 2026", text: "Odlican clanak! Bas sam razmisljala o bakarnoj boji za ovu sezonu. Hvala na inspiraciji!", likes: 12 },
  { id: 2, name: "Stefan D.", date: "14. mar 2026", text: "Liquid Gold trend je fantasticam. Vec imam nekoliko klijentkinja koje su se odlucile za ovu nijansu.", likes: 8 },
];

export default function BlogPostPage() {
  const [commentText, setCommentText] = useState("");

  return (
    <div className="min-h-screen bg-stone-100">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-secondary">Pocetna</Link><ChevronRight className="w-3 h-3" />
          <Link href="/blog" className="hover:text-secondary">Blog</Link><ChevronRight className="w-3 h-3" />
          <span className="text-black">{article.title}</span>
        </nav>

        {/* Article header */}
        <article>
          <span className="inline-block px-3 py-1 bg-black/10 text-secondary rounded-full text-xs font-medium uppercase tracking-wider mb-4">{article.category}</span>
          <h1 className="text-3xl md:text-4xl font-bold text-black mb-4" style={{ fontFamily: "'Noto Serif', serif" }}>{article.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#735b28] to-[#594312] flex items-center justify-center text-white text-xs font-bold">AP</div>
              <span>{article.author}</span>
            </div>
            <span>{article.date}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {article.readTime}</span>
          </div>

          {/* Hero image */}
          <div className="aspect-video rounded-sm overflow-hidden mb-8">
            <img src="https://images.unsplash.com/photo-1560869713-7d0a29430803?w=1200&h=600&fit=crop" alt={article.title} className="w-full h-full object-cover" />
          </div>

          {/* Body */}
          <div className="prose max-w-none">
            {article.content.map((p, i) => (
              <p key={i} className="text-gray-600 leading-relaxed mb-6 text-base">{p}</p>
            ))}
          </div>

          {/* Inline product recommendations */}
          <div className="bg-stone-50 rounded-sm p-6 my-8">
            <h3 className="font-semibold text-black mb-4">Preporuceni proizvodi iz clanka</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {inlineProducts.map((p) => (
                <Link key={p.id} href={`/products/${p.id}`} className="flex gap-4 bg-white rounded-sm p-4 hover:shadow-md transition-all">
                  <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="text-xs text-secondary font-medium">{p.brand}</span>
                    <h4 className="text-sm font-medium text-black">{p.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < p.rating ? "fill-[#735b28] text-secondary" : "text-gray-200"}`} />)}</div>
                      <span className="text-sm font-bold">{p.price} RSD</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Share buttons */}
          <div className="flex items-center gap-4 py-6 border-t border-b border-gray-100 mb-8">
            <span className="text-sm font-medium text-gray-500">Podelite:</span>
            <button className="w-9 h-9 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:opacity-80 transition-opacity"><FacebookIcon className="w-4 h-4" /></button>
            <button className="w-9 h-9 rounded-full bg-[#1DA1F2] text-white flex items-center justify-center hover:opacity-80 transition-opacity"><Share2 className="w-4 h-4" /></button>
            <button className="w-9 h-9 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:opacity-80 transition-opacity"><Mail className="w-4 h-4" /></button>
            <button className="w-9 h-9 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center hover:opacity-80 transition-opacity"><Share2 className="w-4 h-4" /></button>
          </div>

          {/* Related posts */}
          <div className="mb-12">
            <h3 className="text-xl font-bold text-black mb-6" style={{ fontFamily: "'Noto Serif', serif" }}>Povezani Clanci</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {relatedPosts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="group bg-white rounded-sm overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <div className="aspect-video overflow-hidden">
                    <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-4">
                    <span className="text-xs text-secondary font-medium uppercase tracking-wider">{post.category}</span>
                    <h4 className="text-sm font-semibold text-black mt-1 group-hover:text-secondary transition-colors">{post.title}</h4>
                    <span className="text-xs text-gray-400 mt-2 block">{post.date}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Comments section */}
          <div className="mb-12">
            <h3 className="text-xl font-bold text-black mb-6" style={{ fontFamily: "'Noto Serif', serif" }}>Komentari ({comments.length})</h3>
            <div className="space-y-4 mb-8">
              {comments.map((c) => (
                <div key={c.id} className="bg-white rounded-sm p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">{c.name[0]}</div>
                      <div>
                        <span className="text-sm font-semibold text-black">{c.name}</span>
                        <span className="text-xs text-gray-400 ml-2">{c.date}</span>
                      </div>
                    </div>
                    <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-secondary"><ThumbsUp className="w-3 h-3" /> {c.likes}</button>
                  </div>
                  <p className="text-sm text-gray-600">{c.text}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-sm p-6 shadow-sm">
              <h4 className="font-semibold text-black mb-4">Ostavite komentar</h4>
              <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} rows={4} placeholder="Vas komentar..." className="w-full border border-gray-200 rounded-sm px-4 py-3 text-sm mb-3 resize-none" />
              <button className="bg-black hover:bg-stone-800 text-white px-6 py-2.5 rounded font-medium text-sm transition-colors flex items-center gap-2">
                <MessageCircle className="w-4 h-4" /> Posaljite Komentar
              </button>
            </div>
          </div>
        </article>
      </div>

    </div>
  );
}
