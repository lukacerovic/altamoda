# Fuzzy Search (pg_trgm)

Typo-tolerant product search using PostgreSQL's `pg_trgm` extension. Replaces the previous pure substring (`ILIKE '%term%'`) match so `"shrit"` now finds `"shirt"`.

## What changed

| File | Change |
| --- | --- |
| `prisma/migrations/20260423120000_add_pg_trgm_search/migration.sql` | Enables `pg_trgm` extension; adds GIN trigram indexes on `products.name_lat`, `products.sku`, `brands.name`. |
| `src/lib/fuzzy-search.ts` | New shared helper. Exports `findFuzzyProductIds(query)` + `expandDiacritics(term)`. |
| `src/app/api/products/search/route.ts` | Autocomplete endpoint now uses the helper and returns results in similarity-ranked order. |
| `src/app/api/products/route.ts` | Main listing search branch replaced with `findFuzzyProductIds`; all other filters/sorts/pagination untouched. |

## How matching works

For a given query, the helper runs one `$queryRaw` that OR's two strategies together:

1. **Diacritic-aware substring** — the original query is expanded into every Serbian-diacritic variant (`sampon` → `sampon`, `šampon`, `šampoñ`, …) and each variant is matched with `ILIKE ANY(...)`. Preserves the prior behavior for exact substring hits.
2. **Trigram similarity** — `similarity(column, query) > 0.25` (tunable). Catches single-letter typos, transpositions, and missing characters on ~5+ letter words.

Candidates are returned ranked by `GREATEST(similarity(name_lat, q), similarity(sku, q), similarity(brand_name, q))` DESC. The autocomplete endpoint preserves that ranking; the main listing re-applies its own sort (stock + price/name/date) on top of the candidate set.

## Running the migration

```bash
npx prisma migrate dev        # local
npx prisma migrate deploy     # prod / staging
```

The migration requires permission to run `CREATE EXTENSION`. This is available by default on Supabase, Neon, and RDS Postgres. If your role is restricted, run once as a superuser:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

…then re-run `migrate deploy` to apply the indexes.

## Tuning

Two constants in `src/lib/fuzzy-search.ts`:

- `SIMILARITY_THRESHOLD` (default `0.25`) — lower = more typo-tolerant, more noise. Range `0..1`.
- `CANDIDATE_LIMIT` (default `2000`) — max candidates returned before downstream filters (category/price/etc.) intersect. Raise only if a filtered search starts dropping legitimate results on a big catalog.

## Rollback

Revert the two route files to the previous `contains` / `expandDiacritics` logic (see git history). The migration itself is safe to leave in place — the indexes also accelerate the old `ILIKE` queries. If you truly want to undo it:

```sql
DROP INDEX IF EXISTS "products_name_lat_trgm_idx";
DROP INDEX IF EXISTS "products_sku_trgm_idx";
DROP INDEX IF EXISTS "brands_name_trgm_idx";
-- extension left in place; harmless
```

## Known trade-offs

- Short queries (< 4 characters) may have low trigram similarity. Autocomplete still falls back to ILIKE substring so this is usually invisible to users.
- Trigram GIN indexes are larger than B-tree indexes (~3–5× the column bytes) and slow down product writes slightly. Negligible for a product catalog.
- Ranking blends substring hits and fuzzy hits by `similarity()` only. A perfect substring hit on a long name may not outrank a near-perfect similarity on a short name. Tune the threshold if this surfaces in QA.
