/**
 * Static per-brand editorial texts live in the i18n JSONs under `brandTexts.<key>`
 * (title + p1..p3) so they are translatable in all three languages. The DB
 * `Brand.content` remains the fallback for brands without a curated text.
 *
 * Matching is intentionally fuzzy: DB slugs/names vary ("olivia-garden",
 * "OLIVIA GARDEN", future "kerastase"), so we normalize to a compact token
 * before looking up the i18n key.
 */

const BRAND_TEXT_KEYS: Record<string, string> = {
  matrix: "matrix",
  redken: "redken",
  biolage: "biolage",
  framesi: "framesi",
  oliviagarden: "oliviaGarden",
  kerastase: "kerastase",
  lorealprofessionnel: "loreal",
  lorealprofessionnelparis: "loreal",
  loreal: "loreal",
  marianila: "mariaNila",
  framar: "framar",
  mizutani: "mizutani",
  mizutaniscissors: "mizutani",
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/** Resolve a brand slug (and optionally name) to its `brandTexts.*` i18n key, or null. */
export function resolveBrandTextKey(slug: string, name?: string | null): string | null {
  return BRAND_TEXT_KEYS[normalize(slug)] ?? (name ? BRAND_TEXT_KEYS[normalize(name)] ?? null : null);
}

/**
 * Collect the translated paragraphs for a brand text key. `t` returns the key
 * itself when a translation is missing, which we treat as "no text".
 */
export function getBrandParagraphs(t: (key: string) => string, key: string): string[] {
  return ["p1", "p2", "p3"]
    .map((p) => {
      const path = `brandTexts.${key}.${p}`;
      const value = t(path);
      return value === path ? null : value;
    })
    .filter((v): v is string => Boolean(v));
}

/** Translated brand tagline (the "Matrix — Profesionalni proizvodi za kosu" part), or null. */
export function getBrandTitle(t: (key: string) => string, key: string): string | null {
  const path = `brandTexts.${key}.title`;
  const value = t(path);
  return value === path ? null : value;
}
