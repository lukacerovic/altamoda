/**
 * Default newsletter templates — stored as TipTap-compatible body HTML.
 * The email wrapper (header, footer, responsive layout) is added by email-preview.ts.
 *
 * 3 distinct styles:
 *  1. Akcije — bold promotional, sale-focused
 *  2. Novo — elegant product showcase
 *  3. Info — clean editorial / news style
 */

// ── 1. AKCIJE — Bold promotional template (visual sale style) ──
const akcijeBody = `<div style="padding: 20px 40px 40px;">
<h1 style="text-align: center; font-size: 64px; font-family: 'Georgia', 'Times New Roman', serif; font-weight: 400; line-height: 1.1; margin: 40px 0 0; color: #11120D;">Velika Akcija!</h1>
<hr style="border: none; border-top: 2px solid #11120D; width: 80px; margin: 24px auto;">
<h2 style="text-align: center; font-size: 72px; font-family: 'Georgia', 'Times New Roman', serif; font-weight: 400; line-height: 1; margin: 0; color: #11120D;">DO -50%</h2>
<p style="text-align: center; font-size: 14px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #11120D; margin: 24px 0 8px;">Na odabrane proizvode</p>
<p style="text-align: center; font-size: 16px; line-height: 1.6; color: #6b6b6b; margin: 16px auto 32px; max-width: 420px;">Iskoristite ekskluzivne popuste na premium proizvode za negu kose i lepotu. Ponuda je vremenski ogranicena i vazi do isteka zaliha.</p>
<p style="text-align: center;"><a href="#" style="display: inline-block; padding: 16px 40px; background-color: #11120D; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 30px; letter-spacing: 2px; text-transform: uppercase;">Pogledaj Ponudu &rarr;</a></p>
<hr style="border: none; border-top: 1px solid #e8e0d4; margin: 40px 0 16px;">
<p style="text-align: center; font-size: 13px; color: #999;"><em>Ponuda vazi do isteka zaliha. Pozurite i iskoristite popust pre nego sto bude kasno!</em></p>
</div>`

// ── 2. NOVO — Elegant product showcase ──
const novoBody = `<div style="padding: 40px;"><h1 style="text-align: center">Novo U Ponudi</h1>
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
<p style="text-align: center">Imate pitanja? Nas tim strucnjaka je tu za vas — javite nam se!</p></div>`

// ── 3. INFO — Editorial with background image ──
const infoBody = `<div style="background-image: url('/newsletter-info-bg.png'); background-size: cover; background-position: center; position: relative;">
<div style="background-color: rgba(29,28,23,0.7); padding: 48px 40px;">
<h1 style="color: #ffffff; text-align: center; font-family: 'Georgia', 'Times New Roman', serif; font-size: 36px; font-weight: 400; letter-spacing: 2px; margin: 0 0 8px;">Altamoda Vesti</h1>
<p style="color: rgba(255,255,255,0.7); text-align: center; font-size: 14px; letter-spacing: 1px; margin: 0 0 32px;"><em>Mesecni pregled novosti, saveta i inspiracije iz sveta lepote</em></p>
<hr style="border: none; border-top: 1px solid rgba(255,255,255,0.2); margin: 0 0 32px;">
<h2 style="color: #ffffff; font-family: 'Georgia', 'Times New Roman', serif; font-size: 22px; font-weight: 400; margin: 0 0 12px;">Saveti strucnjaka</h2>
<p style="color: rgba(255,255,255,0.85); font-size: 15px; line-height: 1.7; margin: 0 0 16px;">Svaki mesec, nas tim profesionalnih kozmeticara i stilista deli najnovije trendove i proverene savete za vasu svakodnevnu rutinu lepote.</p>
<p style="color: rgba(255,255,255,0.85); font-size: 15px; line-height: 1.7; margin: 0 0 12px;">Ovog meseca smo pripremili vodic o tome kako da:</p>
<ul style="margin: 0 0 24px; padding-left: 24px;">
<li style="color: rgba(255,255,255,0.85); font-size: 15px; line-height: 1.8; margin: 0 0 4px;">Odaberete pravi proizvod za vas tip koze</li>
<li style="color: rgba(255,255,255,0.85); font-size: 15px; line-height: 1.8; margin: 0 0 4px;">Napravite jutarnju i vecernju rutinu nege u samo 5 minuta</li>
<li style="color: rgba(255,255,255,0.85); font-size: 15px; line-height: 1.8; margin: 0 0 4px;">Prepoznate kvalitetne sastojke na etiketama proizvoda</li>
</ul>
<h2 style="color: #ffffff; font-family: 'Georgia', 'Times New Roman', serif; font-size: 22px; font-weight: 400; margin: 0 0 12px;">Aktuelno u prodavnici</h2>
<p style="color: rgba(255,255,255,0.85); font-size: 15px; line-height: 1.7; margin: 0 0 28px;">Posetite nas i uzivo — u nasem salonu mozete dobiti besplatnu konsultaciju sa nasim strucnjacima. Zakazite termin vec danas.</p>
<p style="text-align: center;"><a href="#" style="display: inline-block; padding: 14px 36px; background-color: #ffffff; color: #11120D; font-size: 13px; font-weight: 700; text-decoration: none; border-radius: 30px; letter-spacing: 2px; text-transform: uppercase;">Saznaj Vise &rarr;</a></p>
<hr style="border: none; border-top: 1px solid rgba(255,255,255,0.15); margin: 32px 0 16px;">
<p style="text-align: center; color: rgba(255,255,255,0.5); font-size: 13px; margin: 0;"><em>Pratite nas za jos saveta i inspiracije. Do sledeceg puta!</em></p>
</div>
</div>`

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
