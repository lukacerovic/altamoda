/**
 * Default newsletter templates — stored as TipTap-compatible body HTML.
 * The email wrapper (header, footer, responsive layout) is added by email-preview.ts.
 *
 * 3 distinct styles:
 *  1. Akcije — bold promotional, sale-focused
 *  2. Novo — elegant product showcase
 *  3. Info — clean editorial / news style
 */

// ── 1. AKCIJE — Bold promotional template ──
const akcijeBody = `<h1>Specijalna Ponuda</h1>
<p style="text-align: center">Samo za kratko vreme — iskoristite ekskluzivne popuste na odabrane premium proizvode za negu kose i lepotu.</p>
<hr>
<h2 style="text-align: center">Do -40% na odabrane artikle</h2>
<p style="text-align: center">Ponuda je vremenski ogranicena i vazi do isteka zaliha. Otkrijte nase najprodavanije proizvode po specijalnim cenama koje se ne propustaju.</p>
<p>Zasto kupci biraju nas:</p>
<ul>
<li><strong>Premium kvalitet</strong> — samo provereni brendovi svetskog glasa</li>
<li><strong>Besplatna dostava</strong> — za porudzbine preko 5.000 RSD</li>
<li><strong>Strucni saveti</strong> — nas tim profesionalaca vam pomaze u izboru</li>
</ul>
<p style="text-align: center"><strong><a href="#">POGLEDAJ PONUDU →</a></strong></p>
<hr>
<p style="text-align: center"><em>Ponuda vazi do isteka zaliha. Pozurite i iskoristite popust pre nego sto bude kasno!</em></p>`

// ── 2. NOVO — Elegant product showcase ──
const novoBody = `<h1 style="text-align: center">Novo U Ponudi</h1>
<p style="text-align: center"><em>Otkrijte najnovije dodatke nasoj kolekciji — pazljivo odabrane proizvode za vas</em></p>
<hr>
<h2>Upravo stiglo</h2>
<p>Sa zadovoljstvom vam predstavljamo najnovije proizvode u nasoj ponudi. Svaki artikal je pazljivo odabran kako bismo vam pruzili vrhunski kvalitet i luksuzno iskustvo nege.</p>
<h3>Istaknuti proizvodi</h3>
<p>Ove sezone fokusirali smo se na proizvode koji kombinuju prirodne sastojke sa najnovijim inovacijama u svetu lepote. Rezultat? Nega koja se vidi i oseca.</p>
<p>Nasi novi favoriti:</p>
<ol>
<li><strong>Serum za blistavu kozu</strong> — sa vitaminom C i hijaluronskom kiselinom</li>
<li><strong>Hranliva maska za kosu</strong> — dubinska nega sa keratinom i arganovim uljem</li>
<li><strong>Micelarna voda</strong> — nezno ciscenje za osetljivu kozu</li>
</ol>
<p style="text-align: center"><strong><a href="#">ISTRAZI KOLEKCIJU →</a></strong></p>
<hr>
<p style="text-align: center">Imate pitanja? Nas tim strucnjaka je tu za vas — javite nam se!</p>`

// ── 3. INFO — Clean editorial / news style ──
const infoBody = `<h1>Altamoda Vesti</h1>
<p><em>Mesecni pregled najvaznijih novosti, saveta i inspiracije iz sveta lepote i nege</em></p>
<hr>
<h2>Saveti strucnjaka</h2>
<p>Svaki mesec, nas tim profesionalnih kozmeticara i stilista deli najnovije trendove i proverene savete za vashu svakodnevnu rutinu lepote.</p>
<p>Ovog meseca smo pripremili vodic o tome kako da:</p>
<ul>
<li>Odaberete pravi proizvod za vas tip koze</li>
<li>Napravite jutarnju i vecernju rutinu nege u samo 5 minuta</li>
<li>Prepoznate kvalitetne sastojke na etiketama proizvoda</li>
</ul>
<h2>Da li ste znali?</h2>
<blockquote><p>Redovna hidratacija koze nije samo estetsko pitanje — ona je kljuc za zdravlje i zastitu od spoljasnih faktora. Koristite hidratantnu kremu svaki dan, cak i kada vam se cini da vam koza nije suva.</p></blockquote>
<h2>Aktuelno u prodavnici</h2>
<p>Posetite nas i uzivo — u nasem salonu mozete dobiti besplatnu konsultaciju sa nasim strucnjacima. Zakazzite termin vec danas.</p>
<p style="text-align: center"><strong><a href="#">SAZNAJ VISE →</a></strong></p>
<hr>
<p style="text-align: center">Pratite nas za jos saveta i inspiracije. Do sledeceg puta!</p>`

export const defaultTemplates: {
  name: string
  description: string
  subject: string
  htmlContent: string
}[] = [
  {
    name: 'Akcije',
    description: 'Promotivni sablon za popuste i specijalne ponude — boldni stil sa CTA dugmetom.',
    subject: 'Specijalna ponuda - Ne propustite!',
    htmlContent: akcijeBody,
  },
  {
    name: 'Novo',
    description: 'Elegantan sablon za predstavljanje novih proizvoda i kolekcija.',
    subject: 'Novi proizvodi u ponudi!',
    htmlContent: novoBody,
  },
  {
    name: 'Info',
    description: 'Editorijalni sablon za vesti, savete i mesecne preglede.',
    subject: 'Altamoda Vesti — Mesecni pregled',
    htmlContent: infoBody,
  },
]
