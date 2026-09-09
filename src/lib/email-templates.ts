import { getUnsubscribeUrl, getSiteUrl } from './email'

// Altamoda letterhead palette (matches the newsletter stationery).
const PAGE_BG = '#f6dfe1' // soft pink page behind the card
const CARD_BG = '#fbf6f2' // cream card
const HEADER_BG = '#f9e1e1' // pink header band
const BRAND_BG = '#fbf6f2' // cream (code boxes etc.)
const BRAND_PRIMARY = '#2c160b' // brown ink — headings, buttons, accents
const BRAND_TEXT = '#1a1c1e' // body text
const MUTED = '#9a8f88'
const TAGLINE = 'BEAUTY DISTRIBUTION &amp; EDUCATION'

interface BaseLayoutOptions {
  /** Recipient email — required when showUnsubscribe is true */
  email?: string
  /** Show "Odjavi se" link in footer (newsletter sends only, not transactional) */
  showUnsubscribe?: boolean
  /** Footer background colour. Defaults to the cream card colour. Set it to
   *  draw a distinct coloured bar under the footer, as in the letterhead
   *  "brand bar" variant used by the welcome email. */
  footerBg?: string
  /** Thin rule under the header tagline (welcome email variant). */
  headerDivider?: boolean
}

function baseLayout(content: string, opts: BaseLayoutOptions = {}) {
  const { email, showUnsubscribe = false, footerBg = CARD_BG, headerDivider = false } = opts
  const site = getSiteUrl().replace(/\/$/, '')
  const wordmark = `${site}/email/wordmark-brown.png`
  const watermark = `${site}/email/watermark-d-blush.png`
  const headerDividerRule = headerDivider
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px auto 0;"><tr><td style="width:32px;height:2px;background-color:${BRAND_PRIMARY};font-size:0;line-height:0;">&nbsp;</td></tr></table>`
    : ''
  const footerUnsub =
    showUnsubscribe && email
      ? `<p style="margin: 8px 0 0; font-size: 12px; color: ${MUTED}; text-align: center;">
                <a href="${getUnsubscribeUrl(email)}" style="color: ${MUTED}; text-decoration: underline;">Odjavi se</a> sa newsletter liste.
              </p>`
      : ''

  return `<!DOCTYPE html>
<html lang="sr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light only" />
  <title>Altamoda</title>
  <style>
    /* Force a single light appearance regardless of the client's dark mode. */
    :root{color-scheme:light only;supported-color-schemes:light only;}
    @media (prefers-color-scheme:dark){
      .al-page{background-color:${PAGE_BG}!important}
      .al-card,.al-body{background-color:${CARD_BG}!important}
      .al-footer{background-color:${footerBg}!important}
      .al-header{background-color:${HEADER_BG}!important}
    }
    [data-ogsc] .al-page{background-color:${PAGE_BG}!important}
    [data-ogsc] .al-card,[data-ogsc] .al-body{background-color:${CARD_BG}!important}
    [data-ogsc] .al-footer{background-color:${footerBg}!important}
    [data-ogsc] .al-header{background-color:${HEADER_BG}!important}
  </style>
</head>
<body bgcolor="${PAGE_BG}" style="margin: 0; padding: 0; background-color: ${PAGE_BG}; font-family: 'Georgia', 'Times New Roman', serif; color: ${BRAND_TEXT}; color-scheme: light only;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${PAGE_BG}" class="al-page" style="background-color: ${PAGE_BG};">
    <tr>
      <td align="center" bgcolor="${PAGE_BG}" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" bgcolor="${CARD_BG}" class="al-card" style="max-width: 600px; width: 100%; background-color: ${CARD_BG}; border-radius: 2px; overflow: hidden;">
          <tr>
            <td align="center" bgcolor="${HEADER_BG}" class="al-header" style="padding: 40px 40px 32px; background-color: ${HEADER_BG};">
              <img src="${wordmark}" alt="altamoda" style="display: block; margin: 0 auto; width: 200px; max-width: 62%; height: auto;" />
              ${headerDividerRule}
              <p style="margin: 14px 0 0; font-size: 11px; color: ${BRAND_PRIMARY}; letter-spacing: 4px; text-transform: uppercase;">
                ${TAGLINE}
              </p>
            </td>
          </tr>
          <tr>
            <td valign="top" bgcolor="${CARD_BG}" class="al-body" style="padding: 0; background-color: ${CARD_BG}; background-image: url('${watermark}'); background-repeat: no-repeat; background-position: bottom right; background-size: auto 50%;">${content}</td>
          </tr>
          <tr>
            <td bgcolor="${footerBg}" class="al-footer" style="padding: 24px 40px; background-color: ${footerBg};${footerBg === CARD_BG ? ' border-top: 1px solid rgba(44,22,11,0.12);' : ''}">
              <p style="margin: 0; font-size: 11px; color: ${MUTED}; text-align: center; letter-spacing: 1px; text-transform: uppercase;">
                ALTAMODA · ${TAGLINE}
              </p>
              <p style="margin: 6px 0 0; font-size: 11px; color: ${MUTED}; text-align: center;">
                &copy; ${new Date().getFullYear()} Altamoda. Sva prava zadržana.
              </p>
              ${footerUnsub}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function welcomeTemplate(email: string): string {
  const content = `
    <div style="padding: 40px;">
    <h2 style="margin: 0 0 16px; font-size: 22px; color: ${BRAND_PRIMARY};">Dobrodosli u Altamoda!</h2>
    <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: ${BRAND_TEXT};">
      Hvala vam sto ste se prijavili na nas newsletter. Od sada cete prvi saznati o novim proizvodima, ekskluzivnim ponudama i profesionalnim savetima za negu kose.
    </p>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${BRAND_TEXT};">
      Kao poklon dobrodoslice, koristite kod ispod za <strong>10% popusta</strong> na vasu prvu narudzbu:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding: 20px; background-color: ${BRAND_BG}; border-radius: 8px; border: 2px dashed ${BRAND_PRIMARY};">
          <p style="margin: 0; font-size: 28px; font-weight: 700; color: ${BRAND_PRIMARY}; letter-spacing: 4px;">
            WELCOME10
          </p>
        </td>
      </tr>
    </table>
    <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.5; color: #413d3a;">
      Kod vazi 30 dana od danas. Minimalna vrednost narudzbe: 3.000 RSD.
    </p>
    </div>
  `
  return baseLayout(content, { email, showUnsubscribe: true, footerBg: HEADER_BG, headerDivider: true })
}

export function campaignTemplate(_subject: string, content: string, email: string): string {
  const wrappedContent = `
    <div style="font-size: 16px; line-height: 1.6; color: ${BRAND_TEXT}; padding: 0;">
      ${content}
    </div>
  `
  return baseLayout(wrappedContent, { email, showUnsubscribe: true })
}

export interface B2bSignupUser {
  name: string
  email: string
  phone?: string | null
  salonName?: string | null
  pib?: string | null
  maticniBroj?: string | null
  address?: string | null
}

export function b2bSignupAdminTemplate(user: B2bSignupUser): string {
  const adminUrl = `${getSiteUrl()}/admin/users`
  const row = (label: string, value?: string | null) =>
    value
      ? `<tr><td style="padding: 8px 0; font-size: 14px; color: #413d3a; width: 140px;">${label}</td><td style="padding: 8px 0; font-size: 14px; color: ${BRAND_TEXT};"><strong>${value}</strong></td></tr>`
      : ''

  const content = `
    <div style="padding: 40px;">
      <h2 style="margin: 0 0 16px; font-size: 22px; color: ${BRAND_PRIMARY};">Nova B2B prijava ceka odobrenje</h2>
      <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${BRAND_TEXT};">
        Novi B2B korisnik se registrovao i ceka odobrenje administratora.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px; border-top: 1px solid #dddbd9;">
        ${row('Salon', user.salonName)}
        ${row('Ime', user.name)}
        ${row('Email', user.email)}
        ${row('Telefon', user.phone)}
        ${row('PIB', user.pib)}
        ${row('Maticni broj', user.maticniBroj)}
        ${row('Adresa', user.address)}
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <a href="${adminUrl}" style="display: inline-block; padding: 14px 36px; background-color: ${BRAND_PRIMARY}; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 6px; letter-spacing: 1px;">
              Otvori admin panel
            </a>
          </td>
        </tr>
      </table>
    </div>
  `
  return baseLayout(content)
}

export interface B2bApprovedUser {
  name: string
  salonName?: string | null
}

export function b2bApprovedUserTemplate(user: B2bApprovedUser): string {
  const loginUrl = `${getSiteUrl()}/account/login`
  const greeting = user.salonName ? `${user.salonName}` : user.name

  const content = `
    <div style="padding: 40px;">
      <h2 style="margin: 0 0 16px; font-size: 22px; color: ${BRAND_PRIMARY};">Vas B2B nalog je odobren</h2>
      <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: ${BRAND_TEXT};">
        Postovani <strong>${greeting}</strong>,
      </p>
      <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: ${BRAND_TEXT};">
        Sa zadovoljstvom vas obavestavamo da je vasa B2B prijava odobrena. Sada mozete da se prijavite na vas nalog i pristupite veleprodajnim cenama, ekskluzivnim ponudama i kompletnom Altamoda asortimanu.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
        <tr>
          <td align="center">
            <a href="${loginUrl}" style="display: inline-block; padding: 14px 36px; background-color: ${BRAND_PRIMARY}; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 6px; letter-spacing: 1px;">
              Prijavi se
            </a>
          </td>
        </tr>
      </table>
      <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #413d3a;">
        Ako imate bilo kakva pitanja, slobodno nas kontaktirajte na kontakt@altamoda.rs.
      </p>
    </div>
  `
  return baseLayout(content)
}

export function promoTemplate(
  title: string,
  description: string,
  ctaUrl: string,
  ctaText: string,
  email: string
): string {
  const content = `
    <div style="padding: 40px;">
    <h2 style="margin: 0 0 16px; font-size: 22px; color: ${BRAND_PRIMARY};">${title}</h2>
    <p style="margin: 0 0 28px; font-size: 16px; line-height: 1.6; color: ${BRAND_TEXT};">
      ${description}
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="${ctaUrl}" style="display: inline-block; padding: 14px 36px; background-color: ${BRAND_PRIMARY}; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 6px; letter-spacing: 1px;">
            ${ctaText}
          </a>
        </td>
      </tr>
    </table>
    </div>
  `
  return baseLayout(content, { email, showUnsubscribe: true })
}

// ──────────────────────────────────────────────────────────
// Transactional templates — registration & order lifecycle
// (copy per "zamena tekstova, nov sajt 2026" document)
// ──────────────────────────────────────────────────────────

const CONTACT_BLOCK = `
  <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.7; color: #413d3a;">
    Potrebna Vam je pomoć?<br />
    📧 <a href="mailto:kontakt@altamoda.rs" style="color: #413d3a;">kontakt@altamoda.rs</a><br />
    📞 <a href="tel:+381113088388" style="color: #413d3a;">+381 (0)11 3088388</a>
  </p>`

function ctaButton(url: string, label: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0 0;">
      <tr>
        <td align="center">
          <a href="${url}" style="display: inline-block; padding: 14px 36px; background-color: ${BRAND_PRIMARY}; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 6px; letter-spacing: 1px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>`
}

function detailRow(label: string, value?: string | null): string {
  return value
    ? `<tr><td style="padding: 8px 0; font-size: 14px; color: #413d3a; width: 180px; vertical-align: top;">${label}</td><td style="padding: 8px 0; font-size: 14px; color: ${BRAND_TEXT};"><strong>${value}</strong></td></tr>`
    : ''
}

export function registrationWelcomeTemplate(opts: { isB2bPending?: boolean } = {}): string {
  const site = getSiteUrl()
  const b2bNote = opts.isB2bPending
    ? `
      <p style="margin: 24px 0 0; font-size: 15px; line-height: 1.6; color: ${BRAND_TEXT};">
        <strong>Poslovni korisnici:</strong> Vaš poslovni nalog zahteva proveru podataka.
        Obavestićemo Vas čim nalog bude odobren.
      </p>`
    : ''

  const content = `
    <div style="padding: 40px;">
      <h2 style="margin: 0 0 16px; font-size: 22px; color: ${BRAND_PRIMARY};">Dobro došli u ALTA MODA</h2>
      <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: ${BRAND_TEXT};">Poštovani,</p>
      <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: ${BRAND_TEXT};">
        Hvala Vam što ste kreirali nalog na ALTA MODA webshopu. Vaš korisnički nalog je uspešno
        registrovan i sada možete jednostavno pregledati proizvode, kupovati, pratiti svoje
        porudžbine i upravljati svojim korisničkim podacima.
      </p>
      <p style="margin: 0 0 8px; font-size: 16px; line-height: 1.6; color: ${BRAND_TEXT};">Kao registrovani korisnik možete:</p>
      <p style="margin: 0; font-size: 15px; line-height: 1.9; color: ${BRAND_TEXT};">
        ✔ brže završiti kupovinu<br />
        ✔ pratiti status porudžbina<br />
        ✔ pregledati istoriju kupovina<br />
        ✔ sačuvati više adresa za dostavu<br />
        ✔ sačuvati omiljene proizvode<br />
        ✔ biti među prvima obavešteni o novim kolekcijama i posebnim ponudama
      </p>
      ${b2bNote}
      ${ctaButton(`${site}/account/login`, 'Prijavite se na svoj nalog')}
      ${ctaButton(`${site}/products`, 'Započnite kupovinu')}
      ${CONTACT_BLOCK}
      <p style="margin: 24px 0 0; font-size: 15px; line-height: 1.6; color: ${BRAND_TEXT};">
        Hvala što ste postali deo ALTA MODA zajednice.<br />
        Vaš ALTA MODA tim
      </p>
    </div>
  `
  return baseLayout(content)
}

export interface CardTransactionDetails {
  orderNumber: string
  transactionId?: string | null
  authNumber?: string | null
  amount: string
  dateTime: string
  paymentMethod?: string
}

export function cardTransactionTemplate(d: CardTransactionDetails): string {
  const site = getSiteUrl()
  const content = `
    <div style="padding: 40px;">
      <h2 style="margin: 0 0 16px; font-size: 22px; color: ${BRAND_PRIMARY};">Uspešno izvršena kartična transakcija</h2>
      <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: ${BRAND_TEXT};">Poštovani,</p>
      <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${BRAND_TEXT};">
        Obaveštavamo Vas da je Vaša kartična transakcija uspešno izvršena putem ALTA MODA webshopa.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #dddbd9;">
        ${detailRow('Internet prodajno mesto', 'ALTA MODA')}
        ${detailRow('Broj transakcije', d.transactionId)}
        ${detailRow('Broj porudžbine', d.orderNumber)}
        ${detailRow('Datum i vreme', d.dateTime)}
        ${detailRow('Način plaćanja', d.paymentMethod || 'Platna kartica')}
        ${detailRow('Broj autorizacije', d.authNumber)}
        ${detailRow('Ukupan iznos', d.amount)}
      </table>
      <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #413d3a;">
        Ovaj imejl predstavlja potvrdu uspešno izvršene kartične transakcije.
        Potvrdu o prijemu i obradi porudžbine dobićete u posebnom imejlu.
        Molimo Vas da sačuvate ovaj imejl kao potvrdu o izvršenoj transakciji.
      </p>
      ${ctaButton(`${site}`, 'Posetite ALTA MODA webshop')}
    </div>
  `
  return baseLayout(content)
}

export interface OrderEmailItem {
  name: string
  quantity: number
  totalPrice: string
  image?: string | null
}

export interface OrderConfirmationDetails {
  orderNumber: string
  items: OrderEmailItem[]
  total: string
  paymentMethod: string
  paymentConfirmed: boolean
  shippingAddress?: string | null
  notes?: string | null
}

export function orderConfirmationTemplate(d: OrderConfirmationDetails): string {
  const site = getSiteUrl()
  const itemRows = d.items
    .map(
      (i) => `
        <tr>
          <td style="padding: 10px 12px 10px 0; width: 56px; vertical-align: top;">
            ${i.image ? `<img src="${i.image}" alt="" width="48" height="48" style="display: block; width: 48px; height: 48px; object-fit: cover; border-radius: 4px; background: #eee;" />` : ''}
          </td>
          <td style="padding: 10px 0; font-size: 14px; color: ${BRAND_TEXT}; vertical-align: top;">
            ${i.name}
            <br /><span style="color: #413d3a; font-size: 13px;">Količina: ${i.quantity}</span>
          </td>
          <td align="right" style="padding: 10px 0; font-size: 14px; color: ${BRAND_TEXT}; white-space: nowrap; vertical-align: top;"><strong>${i.totalPrice}</strong></td>
        </tr>`
    )
    .join('')

  const content = `
    <div style="padding: 40px;">
      <h2 style="margin: 0 0 4px; font-size: 22px; color: ${BRAND_PRIMARY};">Hvala na kupovini!</h2>
      <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: ${BRAND_TEXT};">Poštovani,</p>
      <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${BRAND_TEXT};">
        Uspešno smo primili Vašu porudžbinu i započeli njenu obradu.
        Naš tim će je pažljivo pripremiti i poslati u najkraćem mogućem roku.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #dddbd9;">
        ${detailRow('Broj porudžbine', d.orderNumber)}
        ${detailRow('Status plaćanja', d.paymentConfirmed ? 'Plaćeno ✔' : 'U obradi')}
        ${detailRow('Status porudžbine', 'U obradi')}
        ${detailRow('Način plaćanja', d.paymentMethod)}
        ${detailRow('Adresa za isporuku', d.shippingAddress)}
        ${detailRow('Napomena', d.notes)}
      </table>
      <h3 style="margin: 28px 0 8px; font-size: 16px; color: ${BRAND_PRIMARY};">Naručeni proizvodi</h3>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #dddbd9;">
        ${itemRows}
        <tr>
          <td colspan="2" style="padding: 14px 0 0; font-size: 15px; color: ${BRAND_TEXT}; border-top: 1px solid #dddbd9;"><strong>Ukupan iznos</strong></td>
          <td align="right" style="padding: 14px 0 0; font-size: 15px; color: ${BRAND_TEXT}; border-top: 1px solid #dddbd9; white-space: nowrap;"><strong>${d.total}</strong></td>
        </tr>
      </table>
      <h3 style="margin: 28px 0 8px; font-size: 16px; color: ${BRAND_PRIMARY};">Šta dalje?</h3>
      <p style="margin: 0; font-size: 15px; line-height: 1.9; color: ${BRAND_TEXT};">
        📦 Obrada porudžbine<br />
        📦 Pakovanje<br />
        🚚 Predaja kuriru<br />
        📧 Obaveštenje o slanju
      </p>
      ${ctaButton(`${site}/account`, 'Pregledajte svoju porudžbinu')}
      ${ctaButton(`${site}/products`, 'Nastavite kupovinu')}
      <p style="margin: 24px 0 0; font-size: 15px; line-height: 1.6; color: ${BRAND_TEXT};">
        Hvala na ukazanom poverenju.<br />
        Vaš ALTA MODA tim
      </p>
    </div>
  `
  return baseLayout(content)
}

export interface NewOrderAdminDetails {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  items: OrderEmailItem[]
  total: string
  paymentMethod: string
  paymentConfirmed: boolean
  shippingAddress?: string | null
  notes?: string | null
}

export function newOrderAdminTemplate(d: NewOrderAdminDetails): string {
  const adminUrl = `${getSiteUrl()}/admin/orders`
  const itemRows = d.items
    .map(
      (i) => `
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: ${BRAND_TEXT};">
            ${i.name} <span style="color: #413d3a; font-size: 13px;">&times; ${i.quantity}</span>
          </td>
          <td align="right" style="padding: 8px 0; font-size: 14px; color: ${BRAND_TEXT}; white-space: nowrap;"><strong>${i.totalPrice}</strong></td>
        </tr>`
    )
    .join('')

  const content = `
    <div style="padding: 40px;">
      <h2 style="margin: 0 0 16px; font-size: 22px; color: ${BRAND_PRIMARY};">Nova porudžbina — ${d.orderNumber}</h2>
      <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${BRAND_TEXT};">
        Kupac je poslao novu porudžbinu. Pregledajte je i prihvatite ili odbijte u admin panelu.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px; border-top: 1px solid #dddbd9;">
        ${detailRow('Broj porudžbine', d.orderNumber)}
        ${detailRow('Kupac', d.customerName)}
        ${detailRow('Email', d.customerEmail)}
        ${detailRow('Telefon', d.customerPhone)}
        ${detailRow('Status plaćanja', d.paymentConfirmed ? 'Plaćeno ✔' : 'U obradi')}
        ${detailRow('Način plaćanja', d.paymentMethod)}
        ${detailRow('Adresa za isporuku', d.shippingAddress)}
        ${detailRow('Napomena', d.notes)}
      </table>
      <h3 style="margin: 0 0 8px; font-size: 16px; color: ${BRAND_PRIMARY};">Naručeni proizvodi</h3>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #dddbd9;">
        ${itemRows}
        <tr>
          <td style="padding: 12px 0 0; font-size: 15px; color: ${BRAND_TEXT}; border-top: 1px solid #dddbd9;"><strong>Ukupan iznos</strong></td>
          <td align="right" style="padding: 12px 0 0; font-size: 15px; color: ${BRAND_TEXT}; border-top: 1px solid #dddbd9; white-space: nowrap;"><strong>${d.total}</strong></td>
        </tr>
      </table>
      ${ctaButton(adminUrl, 'Prihvati ili odbij porudžbinu')}
    </div>
  `
  return baseLayout(content)
}

export interface OrderShippedDetails {
  orderNumber: string
  shippedDate: string
}

export function orderShippedTemplate(d: OrderShippedDetails): string {
  const content = `
    <div style="padding: 40px;">
      <h2 style="margin: 0 0 16px; font-size: 22px; color: ${BRAND_PRIMARY};">Vaša porudžbina je poslata</h2>
      <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: ${BRAND_TEXT};">Poštovani,</p>
      <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${BRAND_TEXT};">
        Vaša porudžbina je pripremljena i predata kurirskoj službi.
        U nastavku možete pronaći informacije o isporuci.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #dddbd9;">
        ${detailRow('Broj porudžbine', d.orderNumber)}
        ${detailRow('Kurirska služba', 'Ovlašćena kurirska služba')}
        ${detailRow('Datum slanja', d.shippedDate)}
        ${detailRow('Procenjeni rok isporuke', '1–3 radna dana')}
      </table>
      <h3 style="margin: 28px 0 8px; font-size: 16px; color: ${BRAND_PRIMARY};">Korisne informacije</h3>
      <p style="margin: 0; font-size: 15px; line-height: 1.9; color: ${BRAND_TEXT};">
        ✔ Pripremite se za preuzimanje pošiljke.<br />
        ✔ Proverite stanje paketa prilikom prijema.<br />
        ✔ Ukoliko Vam je potrebna pomoć, kontaktirajte naš tim.
      </p>
      ${CONTACT_BLOCK}
      <p style="margin: 24px 0 0; font-size: 15px; line-height: 1.6; color: ${BRAND_TEXT};">
        ALTA MODA tim
      </p>
    </div>
  `
  return baseLayout(content)
}
