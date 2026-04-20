# Alta Moda — Design System

Blended from Airbnb (product card craft + shadow layering), Apple (section rhythm + pill CTAs + navigation glass), and Notion (whisper borders + warm neutrals).

## 1. Visual Theme

A "Modern Atelier" aesthetic — editorial, heritage-forward, restrained, crafted. Think high-end fashion magazine meets professional salon supplier. Photography is the hero; the chrome retreats until it becomes invisible.

## 2. Palette (locked — 4 tokens + 1 warm-tan)

| Token | Hex | Role |
|---|---|---|
| Smoky Black | `#11120D` | Primary text, dark sections, filled CTAs, footer |
| Soft Olive | `#7A7F6A` | Secondary/muted text, metadata, subtle accents |
| Bone | `#D8CFBC` | Dividers, thin borders, light accents, product-image fallback |
| Floral White | `#FFFBF4` | Page background, text on dark, surface |
| B2B Warm Tan | `#EFE7D5` | Single-purpose accent section only |

Product-image fallback: `#F2ECDE` (slightly darker than Floral White for visual weight).

No gradients. No additional brand colors.

## 3. Typography

| Face | Use |
|---|---|
| Cormorant Garamond | All headlines h1–h3 (font-light, 300) |
| Inter | Body, labels, UI |
| Noto Serif | Footer ALTAMODA brand mark only |

**Scale:**
- Hero: `text-5xl md:text-6xl lg:text-7xl` font-light, leading-[1.02], tracking-tight
- Section: `text-4xl md:text-5xl lg:text-6xl` font-light, leading-[1.05]
- Body: 14-15px, leading-[1.7] or [1.8]
- Metadata labels: `text-[10px] uppercase tracking-[0.28em] font-medium`
- Product brand label: `text-[10px] uppercase tracking-[0.22em] text-[#11120D]/60`

**Signature move:** italicize 1-2 accent words inside serif headlines.
```
Profesionalna nega, <em>sa poverenjem</em>.
Bestseleri, <em>izabrani</em> od profesionalaca.
```

## 4. Components

### Product Card (Airbnb-inspired)

```tsx
<Link href="..." className="group block">
  {/* Image wrap — NEW: rounded corners + 3-layer shadow */}
  <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-[#F2ECDE] mb-5
                  shadow-[0_0_0_1px_rgba(17,18,13,0.02),0_2px_6px_rgba(17,18,13,0.04),0_4px_8px_rgba(17,18,13,0.1)]
                  group-hover:shadow-[0_4px_16px_rgba(17,18,13,0.12)]
                  transition-shadow duration-300">
    <Image ... className="group-hover:scale-[1.03] duration-[1200ms] ease-out" />
    {/* Badge: frosted glass top-left */}
    <span className="absolute top-4 left-4 px-2.5 py-1 text-[9px] uppercase tracking-[0.2em]
                     bg-[#FFFBF4]/90 text-[#11120D] backdrop-blur-sm rounded-full">
      Novo
    </span>
    {/* Wishlist: appears on hover top-right */}
    <button className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FFFBF4]/70 backdrop-blur-sm
                       opacity-0 group-hover:opacity-100 transition-opacity">
      <Heart className="w-3.5 h-3.5" />
    </button>
  </div>
  {/* Details below */}
  <span className="text-[10px] uppercase tracking-[0.22em] text-[#11120D]/60">BRAND</span>
  <h3 className="text-base font-normal" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Product Name</h3>
  <div className="flex items-center gap-2 text-sm">
    <span className="text-[#11120D]/60 line-through text-xs">999 RSD</span>
    <span>499 RSD</span>
  </div>
  <div className="flex gap-0.5 mt-2">★★★★☆</div>
</Link>
```

### Pill CTA (Apple-inspired)

Primary filled — long pill shape, 980px radius. Replaces the old sharp-corner rectangle.

```tsx
<Link className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em]
                 font-medium text-[#FFFBF4] bg-[#11120D]
                 px-8 py-4 rounded-full
                 hover:bg-[#2b2c24] transition-colors">
  Prijavi se za veleprodaju <ArrowRight className="w-3.5 h-3.5" />
</Link>
```

Secondary — underline-only (unchanged):
```tsx
<Link className="text-[11px] uppercase tracking-[0.22em] font-medium text-[#11120D]
                 border-b border-[#11120D] pb-1 hover:opacity-60 transition-opacity">
  Pogledaj sve
</Link>
```

### Category Pill Bar (Airbnb signature)

Horizontal scrollable category row under hero, no visible scrollbar.

```tsx
<div className="overflow-x-auto hide-scrollbar border-b border-[rgba(17,18,13,0.08)]">
  <div className="flex gap-2 px-6 md:px-10 py-4 min-w-max">
    {["Nega kose", "Styling", "Boje", "Alati", "Oksidanti", "Muška kolekcija"].map(c => (
      <Link className="shrink-0 text-[11px] uppercase tracking-[0.2em] px-4 py-2 rounded-full
                       border border-[rgba(17,18,13,0.1)] hover:border-[#11120D]
                       text-[#11120D]/70 hover:text-[#11120D] transition-colors">
        {c}
      </Link>
    ))}
  </div>
</div>
```

### Header Glass (Apple signature)

Sticky top, translucent, always floats above content.

```tsx
<header className="sticky top-0 z-50 bg-[#FFFBF4]/80 backdrop-blur-[20px] backdrop-saturate-[180%]
                   border-b border-[rgba(17,18,13,0.08)]">
  ...
</header>
```

### Circular Nav (Airbnb — already correct)

```tsx
<button className="w-10 h-10 rounded-full bg-[#FFFBF4] border border-[#D8CFBC]
                   hover:border-[#11120D] transition-colors
                   shadow-[0_4px_12px_rgba(17,18,13,0.08)]">
  <ChevronLeft className="w-4 h-4" />
</button>
```

## 5. Layout

- **Container:** `max-w-[1400px]` (product sections), `max-w-[1200px]` (features/content)
- **Section padding:** `py-20 md:py-28` (light), `py-14 md:py-32` (dense features)
- **Horizontal padding:** `px-6 md:px-10`
- **Hero grid:** `grid-cols-1 md:grid-cols-[1.05fr_1fr]`
- **Product rows:** `grid-cols-2 md:grid-cols-4 gap-5 md:gap-8`
- **Features:** `grid-cols-2 md:grid-cols-3` with whisper internal borders

## 6. Section Rhythm (Apple-inspired cinematic pacing)

| # | Section | BG | Notes |
|---|---|---|---|
| 1 | Header | `#FFFBF4`/glass | Sticky, translucent, backdrop-blur |
| 2 | Hero | `#FFFBF4` | Editorial split, stats strip |
| 3 | Category pill bar | `#FFFBF4` | NEW — Airbnb-style horizontal scroll |
| 4 | Brand marquee | `#FFFBF4` | Borders top/bottom |
| 5 | Bestsellers carousel | `#FFFBF4` | Rounded cards with 3-layer shadow |
| 6 | B2B partners | `#EFE7D5` | Warm-tan accent section |
| 7 | Features grid | `#FFFBF4` | Whisper-bordered cells |
| 8 | New arrivals | `#FFFBF4` | |
| 9 | Id Hair Academy | `#11120D` | **DARK** break |
| 10 | Sale carousel | `#FFFBF4` | |
| 11 | Social / Instagram | `#FFFBF4` | Image grid |
| 12 | Newsletter | `#11120D` | **DARK** break |
| 13 | Footer | `#11120D` | |

## 7. Depth & Elevation

| Level | Treatment | Use |
|---|---|---|
| 0 Flat | No shadow | Sections, text |
| 1 Card | `0 0 0 1px rgba(17,18,13,0.02), 0 2px 6px rgba(17,18,13,0.04), 0 4px 8px rgba(17,18,13,0.1)` | Product cards (Airbnb 3-layer) |
| 2 Hover | `0 4px 16px rgba(17,18,13,0.12)` | Card/button hover |
| 3 Nav glass | `backdrop-filter: saturate(180%) blur(20px)` on `rgba(255,251,244,0.80)` | Sticky header (Apple) |
| 4 Circular button | `0 4px 12px rgba(17,18,13,0.08)` | Carousel arrows |

## 8. Borders & Radius

**Whisper borders (Notion):** use `rgba(17,18,13,0.08)` for ultra-subtle dividers. Keep `#D8CFBC/60` only where a visible warm line is intended (section dividers, stats separators).

**Radius scale:**
- 0 (sharp) — section edges, hero images
- 4-8px — small pills, form inputs
- `rounded-full` (pill) — CTAs, badges, nav buttons, category pills (NEW)
- `rounded-[20px]` — product card image wrappers (NEW)

## 9. Motion

- Product image zoom: `duration-[1200ms] ease-out`
- Card shadow transition: `duration-300`
- Brand marquee: 25s linear infinite
- Instagram hover overlay: `duration-700 ease-out`

## 10. Don'ts

- ✗ Tailwind built-in colors (`bg-white`, `bg-gray-*`, etc.) — always palette hex
- ✗ Gradients
- ✗ Heavy shadows (>0.12 opacity primary layer)
- ✗ Sharp-cornered product cards — use `rounded-[20px]`
- ✗ Sharp-cornered CTAs on a dark/warm background — use `rounded-full`
- ✗ Hard `border-[#D8CFBC]` solid — prefer whisper `rgba(17,18,13,0.08)`
- ✗ Sans-serif headlines — Cormorant Garamond only
- ✗ Pink / burgundy / gold (old palette: `#735b28`, `#8c4a5a`, `#b07a87`, `#e3c285` — banned)
