/**
 * Local brand logo fallbacks.
 *
 * The legacy CMS (altamoda.rs) serves some logo URLs that return HTML instead of
 * image/webp (broken on their end). For every brand we have a known-good logo
 * under /public/brands/, we override the DB `logoUrl` with the local asset.
 *
 * Add new brand slugs here when onboarding — one source of truth shared by the
 * public Header and the admin Brands page.
 */
export const LOCAL_BRAND_LOGOS: Record<string, string> = {
  "matrix-biolage": "/brands/biolage.webp",
  "biolage": "/brands/biolage.webp",
  "biolage-raw": "/brands/biolage.webp",
  "elchim": "/brands/elchim.png",
  "framesi": "/brands/framesi.webp",
  "kerastase": "/brands/kerastase.png",
  "limage": "/brands/limage.png",
  "loreal": "/brands/loreal.svg",
  "matrix": "/brands/matrix.png",
  "mizutani": "/brands/mizutani.png",
  "olaplex": "/brands/olaplex.svg",
  "olivia-garden": "/brands/olivia-garden.png",
  "redken": "/brands/redken.webp",
  "redken-brews": "/brands/redken-brews.png",
};

/** Returns the best logo URL for a brand: local override if we have one, else the DB value. */
export function resolveBrandLogo(slug: string, logoUrl: string | null): string | null {
  return LOCAL_BRAND_LOGOS[slug] || logoUrl;
}
