# Luka — pending follow-ups from the QA punch list

The QA punch-list fixes are landing as small commits on `develop`. Most items
are done; the items below either need a product/UX decision from you or
depend on data/work outside this pass.

## Decisions needed from you

### 1. Real contact info on /contact

`/contact` still ships placeholder data:
- Phone: `+39 02 123 4567`
- Address: `Via Montenapoleone, 27 / 20121 Milano MI / Italy`

I left `TODO(altamoda-contact)` comments at both lines in
`src/app/contact/page.tsx`. Send me the real Altamoda phone + address and
I'll replace them. Decide too whether the phone/address should localize
(SR/EN/RU) — if yes, I'll move them into `src/lib/i18n/translations/*.json`
under `contact.*`.

### 2. "Svaki ritual, svi proizvodi." default heading

Per your request I replaced "okupljeno" → "svi proizvodi" on the products
listing. The brand-filtered heading reads naturally
("Redken, svi proizvodi."), but the default heading
"Svaki ritual, svi proizvodi." is grammatically awkward. Pick one:

- `Svi proizvodi.` (drop "Svaki ritual,")
- `Naša kompletna ponuda.`
- something you prefer — tell me the copy and I'll swap it in.

## Section 4 — Brands & Filters (still open)

Pagination is done (see this commit). The rest of Section 4 still needs:

- **Hover tooltips** showing the full brand name on brand cards, and the
  full line name on product-line cards. Useful when names get truncated.
- **Brand filter logic** — your QA note says "Filter brendova ne radi
  kako treba" (Brand filter doesn't work properly). I need a concrete
  reproduction case: which brand, what filter combination, what result
  did you see vs. expect. Without that I'll just be guessing.
- **Casing fixes** — "new matrix line" should be lowercase; "All Soft"
  needs its casing checked. Where are these surfaced? (Hero copy?
  Filter labels? Product card subtitle?) Point me at the screen.
- **Price-range filter** not cleared by the "Reset all filters" /
  "Clear filters" button. Confirmed in code; fix is straightforward
  once I'm working on the filter sweep.

## Backlog (tracked, not blocking)

### Cart page placeholder recommendations

`src/app/cart/page.tsx` still renders a hardcoded `recommended` array
with fake IDs (5–8) and Unsplash URLs. Clicking goes to 404; quick-buy
isn't wired because it would push junk into the cart.

To fix properly, we'd want a new `/api/products/recommended` endpoint
(top-selling, recently-viewed, or related to current cart contents),
then swap the static array for its output and add the quick-buy action.
Estimated ~half a day. I left a `TODO(cart-recs)` comment in the file.

---

Ping me when you have answers and I'll keep ticking through the list.
