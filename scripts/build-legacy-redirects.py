#!/usr/bin/env python3
"""Build src/lib/legacy-redirects.json: old altamoda.rs (CodeIgniter) URLs -> new site.

Google still lists the old site's URLs (/sr/proizvod/<uri>, /sr/proizvodi/<cat>,
/sr/brend/<brand>, /sr/clanak/<slug>, /sr/<page>). This script turns the old
MySQL dump into a lookup table that src/app/sr/[[...path]]/route.ts serves as 301s.

Products are mapped to a SKU (resolved to the current slug at request time, so
slug changes don't break the map). The SKU is the old `code` when it still
exists in the catalog; otherwise the closest same-brand product by name
(token overlap, pack size must match). Products with no close match fall back
to their brand page.

Usage:
  psql $DATABASE_URL -AtF$'\\t' -c "select p.sku,p.slug,p.is_active,p.name_lat,coalesce(b.slug,''),p.product_type \
      from products p left join brands b on b.id=p.brand_id where p.sku<>'VPOS-TEST-1RSD'" > new_products.tsv
  python3 -I scripts/build-legacy-redirects.py <legacy.sql> new_products.tsv [archived_paths.txt]

archived_paths.txt (optional): old URL paths seen in the Wayback Machine, one per
line. Product URIs that are no longer in the dump are mapped by slug tokens.
"""
import json
import os
import re
import sys
import unicodedata
from urllib.parse import quote

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from legacy_dump import load  # noqa: E402

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'lib', 'legacy-redirects.json')

# Old brand id -> new brand slug (old `brands` table has 9 rows; Framesi was added
# later on the old site under the misspelled uri "frasmesi").
BRAND_URI = {
    'redken': 'redken', 'redken-brews': 'redken-brews', 'matrix': 'matrix',
    'elchim': 'elchim', 'matrix-biolage': 'biolage', 'biolage-raw': 'biolage',
    'limage': 'limage', 'olivia-garden': 'olivia-garden', 'frasmesi': 'framesi',
    'framesi': 'framesi', 'mizutani': None,
}

# Old category uri -> new listing URL. The new site has 5 top-level categories
# (nega, stajling, kolor, pribor, minival); finer old categories use the
# productType filter, which matches by substring.
P = '/products'
CATEGORY = {
    'nega': f'{P}?category=nega',
    'sampon': f'{P}?category=nega&productType=%C5%A0ampon',
    'samponi-bez-sulfata': f'{P}?category=nega&productType=%C5%A0ampon',
    'regenerator': f'{P}?category=nega&productType=Regenerator',
    'maska': f'{P}?category=nega&productType=Maska',
    'tretman': f'{P}?category=nega&productType=Tretman',
    'ulja-serumi-i-kreme': f'{P}?category=nega',
    'nega-za-muskarce': f'{P}?category=nega&gender=man',
    'stajling': f'{P}?category=stajling',
    'lakovi': f'{P}?category=stajling&productType=Lak',
    'volumen': f'{P}?category=stajling',
    'pena': f'{P}?category=stajling&productType=Pena',
    'tekstura': f'{P}?category=stajling',
    'zastita-od-toplote-prajmeri': f'{P}?category=stajling',
    'kreme-i-losioni': f'{P}?category=stajling',
    'gelovi-pomade-paste-voskovi': f'{P}?category=stajling',
    'suvi-sampon-i-puder': f'{P}?category=stajling',
    'sjaj': f'{P}?category=stajling',
    'stajling-za-muskarce': f'{P}?category=stajling&gender=man',
    'kolor': f'{P}?category=kolor',
    'boje': f'{P}?category=kolor',
    'permanentne-boje': f'{P}?category=kolor&productType=Permanentna',
    'demi-permanentne-boje': f'{P}?category=kolor&productType=Demi-permanentna',
    'semi-permanentne-boje': f'{P}?category=kolor',
    'ph-bonder': f'{P}?category=kolor',
    'oksidanti': f'{P}?category=kolor&productType=Oksidant',
    'dekoloranti': f'{P}?category=kolor&productType=Dekolorant',
    'boja-za-muskarce': f'{P}?category=kolor',
    'color-camo': f'{P}?category=kolor',
    'chromatics': f'{P}?category=kolor&search=chromatics',
    'blonde-idol': f'{P}?category=kolor&search=blonde%20idol',
    'shades-eq': f'{P}?category=kolor&search=shades%20eq',
    'shades-eq-bonder-inside': f'{P}?category=kolor&search=shades%20eq',
    'so-color': f'{P}?category=kolor&search=so%20color',
    'so-color-sync': f'{P}?category=kolor&search=sync',
    'so-color-cult-1': f'{P}?category=kolor',
    'so-solor-cult': f'{P}?category=kolor',
    'city-beats': f'{P}?category=kolor',
    'tonal-control': f'{P}?category=kolor&search=tonal%20control',
    'color-gels-lacquers': f'{P}?category=kolor&search=color%20gels%20lacquers',
    'color-gels-lacquers-10': f'{P}?category=kolor&search=color%20gels%20lacquers',
    'color-gels-oils': f'{P}?category=kolor&search=color%20gels%20oils',
    'lutke': f'{P}?category=pribor&productType=lutka',
    'trening-lutke': f'{P}?category=pribor&productType=Trening%20lutka',
    'takmicarske-lutke': f'{P}?category=pribor&productType=Takmi%C4%8Darska%20lutka',
    'frizerski-pribor': f'{P}?category=pribor',
    'pribor-za-sisanje': f'{P}?category=pribor',
    'pribor-za-farbanje': f'{P}?category=pribor',
    'salonski-pribor': f'{P}?category=pribor',
    'cesljevi': f'{P}?category=pribor',
    'fenovi': f'{P}?category=pribor',
    'difuzeri': f'{P}?category=pribor',
    'bosce': f'{P}?category=pribor',
    'bosce-1': f'{P}?category=pribor',
    'cinije': f'{P}?category=pribor',
    'cetkice': f'{P}?category=pribor',
    'podloge-za-satiranje': f'{P}?category=pribor',
    'aplikatori': f'{P}?category=pribor',
    'mutilice': f'{P}?category=pribor',
    'spatule': f'{P}?category=pribor',
    'kecelje': f'{P}?category=pribor',
    'peskiri': f'{P}?category=pribor',
    'pumpice': f'{P}?category=pribor',
    'nijanseri': f'{P}?category=pribor',
    'separator-za-heacture-presu': f'{P}?category=pribor',
    'makaze-1': f'{P}?category=pribor&productType=Makaze',
    'salonski-tretmani': f'{P}?category=nega',
    'chemistry': f'{P}?category=nega',
    'heatcure': f'{P}?category=nega',
    'abc-salonski-tretmani': f'{P}?category=nega',
    'minival': f'{P}?category=minival',
    'vector-plus': f'{P}?category=minival',
    'opti-wave': f'{P}?category=minival',
}

# Old CMS pages (/sr/<uri>) -> new pages. Unlisted pages fall back to "/".
PAGE = {
    '': '/', 'kontakt': '/contact', 'dostava': '/uslovi-placanja',
    'informacije-o-dostavi': '/uslovi-placanja', 'informacije-o-transportu': '/uslovi-placanja',
    'uputstva-za-placanje': '/uslovi-placanja', 'uslovi-koriscenja': '/uslovi-placanja',
    'povracaj-robe-i-reklamacija': '/uslovi-placanja', 'politika-privatnosti': '/politika-kolacica',
    'cesto-postavljanja-pitanja': '/faq', 'registracija': '/account/register',
    'uloguj-se': '/account/login', 'moj-nalog': '/account', 'moje-porudzbine': '/account',
    'potvrda-reseta-sifre': '/account/login', 'moja-lista-zelja': '/wishlist', 'moja-korpa': '/cart',
    'svi-proizvodi': '/products', 'lista-proizvoda': '/products', 'pretraga-proizvoda': '/products',
    'novi-proizvodi': '/products?tag=new', 'proizvodi-na-akciji': '/products',
    'preporuceni-proizvodi': '/products', 'svi-brendovi': '/brands',
    'vesti': '/education', 'blog': '/education', 'edukativni-centar': '/education',
}
# Old education course / event pages -> /education
EDUCATION_PAGES = {
    'id-hair-academy-cetvoromesecna-obuka', 'id-hair-academy-petomesecna-obuka',
    'osnovni-kurs-kolora', 'intenzivni-kurs-kolora', '12-osnovnih-tehnika-sisanja-po-principu-tonyguy',
    'kurs-sisanja-po-principu-tonyguy', 'matrix-craft-color', 'odgonetni-matrix-kolor', 'izazovna-plavusa',
    'seda-se-pokriva-bez-dileme', 'vatrena-zahteva-vazne-korake', 'kolor-korekcija', 'balayage-tehnike1',
    'balayage-tehnike2', 'heeelp-pundja', 'udaj-se-za-mene', 'avangarda-je-ludilo', 'craft-cut',
    'cut-master', 'kurs-muskog-sisanja', 'test-edukacija',
}

BRAND_WORDS = {'redken', 'matrix', 'biolage', 'framesi', 'elchim', 'limage', 'olivia', 'garden', 'brews'}
STOP = {'za', 'i', 'sa', 'od', 'kosu', 'kose', 'kosa', 'the', 'new', 'novo'}
ABBREV = {'rk': 'redken', 'mx': 'matrix', 'reg': 'regenerator', 'sam': 'sampon', 'shampoo': 'sampon',
          'shmp': 'sampon', 'conditioner': 'regenerator', 'condi': 'regenerator', 'mask': 'maska'}
# A match must agree on these: a shampoo URL must never land on a conditioner.
KIND = {'sampon', 'regenerator', 'maska', 'sprej', 'ulje', 'serum', 'tretman', 'gel', 'pena', 'lak',
        'krema', 'pasta', 'vosak', 'pomada', 'oksidant', 'developer', 'dekolorant', 'puder'}
SIZE_RE = re.compile(r'\d+(ml|g|gr|l)')
SHADE_RE = re.compile(r'\d{1,3}[a-z]{0,3}')


def shades(tokens):
    """Color shade codes such as 7gb, 08vg, 10 (leading zeros dropped)."""
    return {t.lstrip('0') or '0' for t in tokens if SHADE_RE.fullmatch(t) and not SIZE_RE.fullmatch(t)}


def norm_tokens(text):
    text = unicodedata.normalize('NFKD', (text or '').lower().replace('đ', 'dj'))
    text = ''.join(c for c in text if not unicodedata.combining(c))
    text = re.sub(r'(\d+)\s*(ml|g|gr|l|kom)\b', r'\1\2', text)
    toks = re.findall(r'[a-z0-9]+', text)
    return [ABBREV.get(t, t) for t in toks if t not in STOP]


def size_of(tokens):
    for t in tokens:
        if re.fullmatch(r'\d+(ml|g|gr|l)', t):
            return t
    return None


def main():
    dump, new_tsv = sys.argv[1], sys.argv[2]
    archived = sys.argv[3] if len(sys.argv) > 3 else None
    d = load(dump, ['products', 'brands', 'categories', 'news_articles'])

    new = []
    sku_set = set()
    for line in open(new_tsv, encoding='utf-8'):
        sku, slug, active, name, brand, ptype = (line.rstrip('\n').split('\t') + [''] * 6)[:6]
        if active != 't':
            continue
        toks = norm_tokens(name)
        new.append({'sku': sku, 'brand': brand, 'toks': set(toks), 'size': size_of(toks)})
        sku_set.add(sku)

    old_brand = {b['id']: BRAND_URI.get(b['uri']) for b in d['brands']}

    def guess_brand(tokens):
        s = set(tokens)
        if 'brews' in s:
            return 'redken-brews'
        for b in ('redken', 'biolage', 'matrix', 'elchim', 'framesi', 'limage'):
            if b in s:
                return b
        if 'olivia' in s:
            return 'olivia-garden'
        return None

    def best_match(tokens, brand):
        toks = set(tokens)
        size = size_of(tokens)
        kind = toks & KIND
        shade = shades(tokens)
        line_words = {t for t in toks if t not in BRAND_WORDS and t not in KIND and not SIZE_RE.fullmatch(t)}
        best, best_score = None, 0.0
        for p in new:
            if brand and p['brand'] and p['brand'] != brand:
                continue
            if size and p['size'] and size != p['size']:
                continue
            if kind and not kind <= p['toks']:
                continue
            if shade and shade != shades(p['toks']):
                continue
            # Shade products: same line too. Every word of the new name must be in
            # the old one, so "Color Gels Lacquers 7GB" never lands on "Color Gels Oils 7GB".
            if shade and not {t.lstrip('0') for t in p['toks']} <= {t.lstrip('0') for t in toks}:
                continue
            # Must share a product-line word, not just brand + type + size
            # ("Curvaceous šampon 300ml" is not "Extreme šampon 300ml").
            if not (line_words & p['toks']):
                continue
            inter = len(toks & p['toks'])
            score = inter / len(toks | p['toks']) if toks else 0
            if score > best_score:
                best, best_score = p, score
        return best['sku'] if best and best_score >= 0.6 else None

    def line_search(tokens, brand):
        """For a discontinued color shade: search for its product line
        (e.g. "shades eq"), if the catalog still carries that line."""
        if not brand or not shades(tokens):
            return None
        words = [t for t in tokens if t not in shades(tokens) and not SHADE_RE.fullmatch(t)
                 and not SIZE_RE.fullmatch(t) and t != brand and t not in BRAND_WORDS]
        for n in range(min(3, len(words)), 1, -1):
            cand = words[:n]
            if any(set(cand) <= p['toks'] for p in new if p['brand'] == brand):
                return ' '.join(cand)
        return None

    stats = {'sku': 0, 'fuzzy': 0, 'line': 0, 'brand': 0, 'none': 0}

    def map_product(code, name, brand):
        code = (code or '').strip()
        if code in sku_set:
            stats['sku'] += 1
            return {'sku': code, 'fallback': f'/brands/{brand}' if brand else '/products'}
        toks = norm_tokens(name)
        brand = brand or guess_brand(toks)
        sku = best_match(toks, brand)
        if sku:
            stats['fuzzy'] += 1
            return {'sku': sku, 'fallback': f'/brands/{brand}' if brand else '/products'}
        line = line_search(toks, brand)
        if line:
            stats['line'] += 1
            return {'path': '/products?search=' + quote(line)}
        if brand:
            stats['brand'] += 1
            return {'path': f'/brands/{brand}'}
        stats['none'] += 1
        return {'path': '/products'}

    products = {}
    for p in d['products']:
        brand = old_brand.get(p['manufacturer_id'])
        target = map_product(p['code'], p['name_sr'] or p['uri_sr'], brand)
        for key in ('uri_sr', 'uri_en'):
            if p.get(key):
                products.setdefault(p[key], target)

    if archived:
        for line in open(archived, encoding='utf-8'):
            m = re.match(r'^/(?:sr|en)/proizvod/([^/?#]+)', line.strip())
            if m and m.group(1) not in products:
                uri = m.group(1)
                products[uri] = map_product('', re.sub(r'-\d+$', '', uri).replace('-', ' '), None)

    brands = {k: (f'/brands/{v}' if v else '/brands') for k, v in BRAND_URI.items()}
    categories = dict(CATEGORY)
    for c in d['categories']:
        for key in ('uri_sr', 'uri_en'):
            if c.get(key) and c[key] not in categories:
                categories[c[key]] = '/products'

    pages = dict(PAGE)
    for uri in EDUCATION_PAGES:
        pages[uri] = '/education'

    out = {
        '_comment': 'Generated by scripts/build-legacy-redirects.py from the old site dump. Do not edit by hand.',
        'products': dict(sorted(products.items())),
        'categories': dict(sorted(categories.items())),
        'brands': brands,
        'pages': dict(sorted(pages.items())),
    }
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
        f.write('\n')
    print('products:', len(products), stats)
    print('categories:', len(categories), 'pages:', len(pages), '->', os.path.normpath(OUT))


if __name__ == '__main__':
    main()
