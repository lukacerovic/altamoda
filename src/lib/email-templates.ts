import { getUnsubscribeUrl, getSiteUrl } from './email'
import { BANK_TRANSFER_PAYEE, BANK_TRANSFER_DEADLINE_HOURS, formatSlipAmount } from './payments/bank-transfer'

// Altamoda letterhead palette (matches the newsletter stationery).
const PAGE_BG = '#f6dfe1' // soft pink page behind the card
const CARD_BG = '#fbf6f2' // cream card
const HEADER_BG = '#f9e1e1' // pink header band
const BRAND_BG = '#fbf6f2' // cream (code boxes etc.)
const BRAND_PRIMARY = '#2c160b' // brown ink — headings, buttons, accents
const BRAND_TEXT = '#1a1c1e' // body text
const MUTED = '#9a8f88'
const TAGLINE = 'BEAUTY DISTRIBUTION &amp; EDUCATION'

/** Order-lifecycle emails are sent in whatever language the customer had
 *  selected at checkout (captured on `Order.language`). Every other
 *  transactional/marketing email stays Serbian-only, unchanged. */
export type EmailLang = 'sr' | 'en' | 'ru'

const COPYRIGHT: Record<EmailLang, string> = {
  sr: 'Sva prava zadržana.',
  en: 'All rights reserved.',
  ru: 'Все права защищены.',
}

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
  /** Defaults to Serbian — only order-lifecycle emails pass a customer language. */
  lang?: EmailLang
}

function baseLayout(content: string, opts: BaseLayoutOptions = {}) {
  const { email, showUnsubscribe = false, footerBg = CARD_BG, headerDivider = false, lang = 'sr' } = opts
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
<html lang="${lang}">
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
                &copy; ${new Date().getFullYear()} Altamoda. ${COPYRIGHT[lang]}
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
    <p style="margin: 0; font-size: 16px; line-height: 1.6; color: ${BRAND_TEXT};">
      Hvala vam sto ste se prijavili na nas newsletter. Od sada cete prvi saznati o novim proizvodima, ekskluzivnim ponudama i profesionalnim savetima za negu kose.
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

const NEED_HELP: Record<EmailLang, string> = {
  sr: 'Potrebna Vam je pomoć?',
  en: 'Need help?',
  ru: 'Нужна помощь?',
}

const CONTACT_BLOCK = `
  <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.7; color: #413d3a;">
    Potrebna Vam je pomoć?<br />
    📧 <a href="mailto:kontakt@altamoda.rs" style="color: #413d3a;">kontakt@altamoda.rs</a><br />
    📞 <a href="tel:+381113088388" style="color: #413d3a;">011 308 8388</a> | <a href="tel:+381646473145" style="color: #413d3a;">064 647 3145</a>
  </p>`

function contactBlock(lang: EmailLang): string {
  return `
  <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.7; color: #413d3a;">
    ${NEED_HELP[lang]}<br />
    📧 <a href="mailto:kontakt@altamoda.rs" style="color: #413d3a;">kontakt@altamoda.rs</a><br />
    📞 <a href="tel:+381113088388" style="color: #413d3a;">011 308 8388</a> | <a href="tel:+381646473145" style="color: #413d3a;">064 647 3145</a>
  </p>`
}

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
  language?: EmailLang
}

const CARD_TX_TEXT: Record<EmailLang, {
  title: string; greeting: string; intro: string
  merchant: string; txId: string; orderNo: string; dateTime: string
  paymentMethod: string; paymentMethodDefault: string; authNumber: string; amount: string
  footerNote: string; cta: string
}> = {
  sr: {
    title: 'Uspešno izvršena kartična transakcija',
    greeting: 'Poštovani,',
    intro: 'Obaveštavamo Vas da je Vaša kartična transakcija uspešno izvršena putem ALTA MODA webshopa.',
    merchant: 'Internet prodajno mesto', txId: 'Broj transakcije', orderNo: 'Broj porudžbine',
    dateTime: 'Datum i vreme', paymentMethod: 'Način plaćanja', paymentMethodDefault: 'Platna kartica',
    authNumber: 'Broj autorizacije', amount: 'Ukupan iznos',
    footerNote: 'Ovaj imejl predstavlja potvrdu uspešno izvršene kartične transakcije. Potvrdu o prijemu i obradi porudžbine dobićete u posebnom imejlu. Molimo Vas da sačuvate ovaj imejl kao potvrdu o izvršenoj transakciji.',
    cta: 'Posetite ALTA MODA webshop',
  },
  en: {
    title: 'Card transaction completed successfully',
    greeting: 'Dear Customer,',
    intro: 'We are informing you that your card transaction was successfully completed via the ALTA MODA webshop.',
    merchant: 'Merchant', txId: 'Transaction number', orderNo: 'Order number',
    dateTime: 'Date and time', paymentMethod: 'Payment method', paymentMethodDefault: 'Payment card',
    authNumber: 'Authorization number', amount: 'Total amount',
    footerNote: 'This email confirms a successfully completed card transaction. You will receive the order confirmation in a separate email. Please keep this email as proof of the completed transaction.',
    cta: 'Visit the ALTA MODA webshop',
  },
  ru: {
    title: 'Транзакция по карте успешно выполнена',
    greeting: 'Уважаемый клиент,',
    intro: 'Сообщаем вам, что ваша транзакция по карте была успешно выполнена через интернет-магазин ALTA MODA.',
    merchant: 'Интернет-магазин', txId: 'Номер транзакции', orderNo: 'Номер заказа',
    dateTime: 'Дата и время', paymentMethod: 'Способ оплаты', paymentMethodDefault: 'Банковская карта',
    authNumber: 'Номер авторизации', amount: 'Общая сумма',
    footerNote: 'Это письмо подтверждает успешно выполненную транзакцию по карте. Подтверждение получения и обработки заказа вы получите отдельным письмом. Пожалуйста, сохраните это письмо как подтверждение совершенной транзакции.',
    cta: 'Посетить интернет-магазин ALTA MODA',
  },
}

export function cardTransactionTemplate(d: CardTransactionDetails): string {
  const lang = d.language ?? 'sr'
  const T = CARD_TX_TEXT[lang]
  const site = getSiteUrl()
  const content = `
    <div style="padding: 40px;">
      <h2 style="margin: 0 0 16px; font-size: 22px; color: ${BRAND_PRIMARY};">${T.title}</h2>
      <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: ${BRAND_TEXT};">${T.greeting}</p>
      <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${BRAND_TEXT};">
        ${T.intro}
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #dddbd9;">
        ${detailRow(T.merchant, 'ALTA MODA')}
        ${detailRow(T.txId, d.transactionId)}
        ${detailRow(T.orderNo, d.orderNumber)}
        ${detailRow(T.dateTime, d.dateTime)}
        ${detailRow(T.paymentMethod, d.paymentMethod || T.paymentMethodDefault)}
        ${detailRow(T.authNumber, d.authNumber)}
        ${detailRow(T.amount, d.amount)}
      </table>
      <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #413d3a;">
        ${T.footerNote}
      </p>
      ${ctaButton(`${site}`, T.cta)}
    </div>
  `
  return baseLayout(content, { lang })
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
  language?: EmailLang
  /** Set for "Uplatnicom" orders: the email then carries the filled-in payment
   *  slip and says the order ships only once the payment is recorded.
   *  payerName/payerAddress must already be HTML-escaped. */
  bankTransfer?: { payerName: string; payerAddress: string; amount: number } | null
}

const BANK_TRANSFER_TEXT: Record<EmailLang, {
  intro: string; awaiting: string; instructions: string; referenceWarning: string
  slipTitle: string; payer: string; purpose: string; purposeValue: string; payee: string
  paymentCode: string; currency: string; amount: string; account: string
  model: string; reference: string; signature: string; placeDate: string; valueDate: string
  sellerHeading: string; sellerName: string; address: string; accountNo: string
  pib: string; mb: string; whatsNextList: string
}> = {
  sr: {
    intro: 'Uspešno smo primili Vašu porudžbinu. Proizvode šaljemo čim uplata bude evidentirana na našem računu.',
    awaiting: 'Čeka se uplata',
    instructions: `U nastavku ovog mejla nalazi se popunjena uplatnica sa iznosom koji je potrebno da uplatite u narednih ${BANK_TRANSFER_DEADLINE_HOURS} časa kako bi Vaša porudžbina bila realizovana.`,
    referenceWarning: 'Molimo Vas da prilikom uplate obavezno popunite polje <strong>poziv na broj</strong>, u suprotnom nećemo biti u mogućnosti da uplatu povežemo sa Vašom porudžbinom.',
    slipTitle: 'NALOG ZA UPLATU', payer: 'Uplatilac', purpose: 'Svrha uplate', purposeValue: 'Online porudžbina',
    payee: 'Primalac', paymentCode: 'Šifra plaćanja', currency: 'Valuta', amount: 'Iznos',
    account: 'Račun primaoca', model: 'Broj modela', reference: 'Poziv na broj (odobrenje)',
    signature: 'Pečat i potpis uplatioca', placeDate: 'Mesto i datum prijema', valueDate: 'Datum valute',
    sellerHeading: 'Podaci o prodavcu', sellerName: 'Naziv', address: 'Adresa', accountNo: 'Broj računa',
    pib: 'PIB', mb: 'Matični broj',
    whatsNextList: '💳 Evidentiranje uplate<br />📦 Obrada i pakovanje<br />🚚 Predaja kuriru<br />📧 Obaveštenje o slanju',
  },
  en: {
    intro: 'We have successfully received your order. We will ship your products as soon as the payment is recorded on our account.',
    awaiting: 'Awaiting payment',
    instructions: `Below you will find a filled-in payment slip with the amount to be paid within the next ${BANK_TRANSFER_DEADLINE_HOURS} hours for your order to be processed.`,
    referenceWarning: 'When paying, please be sure to fill in the <strong>reference number</strong> (poziv na broj) field, otherwise we will not be able to match the payment to your order.',
    slipTitle: 'PAYMENT SLIP', payer: 'Payer', purpose: 'Purpose of payment', purposeValue: 'Online porudžbina',
    payee: 'Payee', paymentCode: 'Payment code', currency: 'Currency', amount: 'Amount',
    account: 'Payee account', model: 'Model', reference: 'Reference number',
    signature: 'Payer stamp and signature', placeDate: 'Place and date of receipt', valueDate: 'Value date',
    sellerHeading: 'Seller details', sellerName: 'Name', address: 'Address', accountNo: 'Account number',
    pib: 'Tax ID (PIB)', mb: 'Company ID (MB)',
    whatsNextList: '💳 Payment recorded<br />📦 Processing and packing<br />🚚 Handover to courier<br />📧 Shipping notification',
  },
  ru: {
    intro: 'Мы успешно получили ваш заказ. Мы отправим товары, как только оплата поступит на наш счет.',
    awaiting: 'Ожидается оплата',
    instructions: `Ниже вы найдете заполненную платежную квитанцию с суммой, которую необходимо оплатить в течение ${BANK_TRANSFER_DEADLINE_HOURS} часов, чтобы ваш заказ был выполнен.`,
    referenceWarning: 'При оплате обязательно заполните поле <strong>номер ссылки</strong> (poziv na broj), иначе мы не сможем связать платеж с вашим заказом.',
    slipTitle: 'ПЛАТЕЖНОЕ ПОРУЧЕНИЕ', payer: 'Плательщик', purpose: 'Назначение платежа', purposeValue: 'Online porudžbina',
    payee: 'Получатель', paymentCode: 'Код платежа', currency: 'Валюта', amount: 'Сумма',
    account: 'Счет получателя', model: 'Модель', reference: 'Номер ссылки',
    signature: 'Печать и подпись плательщика', placeDate: 'Место и дата приема', valueDate: 'Дата валютирования',
    sellerHeading: 'Данные продавца', sellerName: 'Название', address: 'Адрес', accountNo: 'Номер счета',
    pib: 'ИНН (PIB)', mb: 'Рег. номер (MB)',
    whatsNextList: '💳 Поступление оплаты<br />📦 Обработка и упаковка<br />🚚 Передача курьеру<br />📧 Уведомление об отправке',
  },
}

/** HTML replica of the Serbian "nalog za uplatu", filled in as on the legacy site. */
function paymentSlip(T: (typeof BANK_TRANSFER_TEXT)[EmailLang], orderNumber: string, bt: NonNullable<OrderConfirmationDetails['bankTransfer']>): string {
  const P = BANK_TRANSFER_PAYEE
  const label = (text: string) =>
    `<div style="font-size: 11px; color: #413d3a; margin: 10px 0 3px;">${text}</div>`
  const box = (value: string, opts: { align?: 'left' | 'right'; minHeight?: number } = {}) =>
    `<div style="border: 1px solid #413d3a; padding: 6px 8px; font-size: 12px; line-height: 1.4; color: ${BRAND_TEXT}; background: #ffffff; text-align: ${opts.align ?? 'left'}; min-height: ${opts.minHeight ?? 16}px;"><strong>${value || '&nbsp;'}</strong></div>`
  const signLine = (text: string) =>
    `<div style="border-top: 1px solid #413d3a; margin-top: 26px; padding-top: 3px; font-size: 10px; color: #413d3a;">${text}</div>`

  return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0 0; border: 1px solid #413d3a; background: #ffffff;">
        <tr>
          <td colspan="2" align="right" style="padding: 10px 12px 0; font-size: 13px; font-weight: 700; color: ${BRAND_TEXT}; letter-spacing: 0.5px;">${T.slipTitle}</td>
        </tr>
        <tr>
          <td width="50%" style="padding: 0 10px 14px 12px; vertical-align: top; border-right: 1px solid #413d3a;">
            ${label(T.payer)}${box(`${bt.payerName}<br />${bt.payerAddress}`, { minHeight: 34 })}
            ${label(T.purpose)}${box(T.purposeValue, { minHeight: 34 })}
            ${label(T.payee)}${box(`${P.name}<br />${P.street}, ${P.city}, ${P.country}`, { minHeight: 34 })}
            ${signLine(T.signature)}
            ${signLine(T.placeDate)}
          </td>
          <td width="50%" style="padding: 0 12px 14px 10px; vertical-align: top;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="24%" style="vertical-align: bottom; padding-right: 4px;">${label(T.paymentCode)}${box('')}</td>
                <td width="20%" style="vertical-align: bottom; padding-right: 4px;">${label(T.currency)}${box('')}</td>
                <td style="vertical-align: bottom;">${label(T.amount)}${box(`=${formatSlipAmount(bt.amount)}`, { align: 'right' })}</td>
              </tr>
            </table>
            ${label(T.account)}${box(P.account)}
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="24%" style="vertical-align: bottom; padding-right: 4px;">${label(T.model)}${box('')}</td>
                <td style="vertical-align: bottom;">${label(T.reference)}${box(orderNumber)}</td>
              </tr>
            </table>
            ${signLine(T.valueDate)}
          </td>
        </tr>
      </table>`
}

const ORDER_CONFIRM_TEXT: Record<EmailLang, {
  title: string; greeting: string; intro: string
  orderNo: string; paymentStatus: string; orderStatus: string; paymentMethod: string
  shippingAddress: string; notes: string; paid: string; processing: string
  itemsHeading: string; qty: string; total: string
  whatsNextHeading: string; whatsNextList: string
  cta1: string; cta2: string; closing: string
}> = {
  sr: {
    title: 'Hvala na kupovini!', greeting: 'Poštovani,',
    intro: 'Uspešno smo primili Vašu porudžbinu i započeli njenu obradu. Naš tim će je pažljivo pripremiti i poslati u najkraćem mogućem roku.',
    orderNo: 'Broj porudžbine', paymentStatus: 'Status plaćanja', orderStatus: 'Status porudžbine',
    paymentMethod: 'Način plaćanja', shippingAddress: 'Adresa za isporuku', notes: 'Napomena',
    paid: 'Plaćeno ✔', processing: 'U obradi',
    itemsHeading: 'Naručeni proizvodi', qty: 'Količina', total: 'Ukupan iznos',
    whatsNextHeading: 'Šta dalje?',
    whatsNextList: '📦 Obrada porudžbine<br />📦 Pakovanje<br />🚚 Predaja kuriru<br />📧 Obaveštenje o slanju',
    cta1: 'Pregledajte svoju porudžbinu', cta2: 'Nastavite kupovinu',
    closing: 'Hvala na ukazanom poverenju.<br />Vaš ALTA MODA tim',
  },
  en: {
    title: 'Thank you for your order!', greeting: 'Dear Customer,',
    intro: 'We have successfully received your order and started processing it. Our team will carefully prepare it and ship it as soon as possible.',
    orderNo: 'Order number', paymentStatus: 'Payment status', orderStatus: 'Order status',
    paymentMethod: 'Payment method', shippingAddress: 'Delivery address', notes: 'Note',
    paid: 'Paid ✔', processing: 'Processing',
    itemsHeading: 'Ordered products', qty: 'Quantity', total: 'Total amount',
    whatsNextHeading: "What's next?",
    whatsNextList: '📦 Order processing<br />📦 Packing<br />🚚 Handover to courier<br />📧 Shipping notification',
    cta1: 'View your order', cta2: 'Continue shopping',
    closing: 'Thank you for your trust.<br />Your ALTA MODA team',
  },
  ru: {
    title: 'Спасибо за покупку!', greeting: 'Уважаемый клиент,',
    intro: 'Мы успешно получили ваш заказ и начали его обработку. Наша команда тщательно подготовит его и отправит в кратчайшие сроки.',
    orderNo: 'Номер заказа', paymentStatus: 'Статус оплаты', orderStatus: 'Статус заказа',
    paymentMethod: 'Способ оплаты', shippingAddress: 'Адрес доставки', notes: 'Примечание',
    paid: 'Оплачено ✔', processing: 'В обработке',
    itemsHeading: 'Заказанные товары', qty: 'Количество', total: 'Общая сумма',
    whatsNextHeading: 'Что дальше?',
    whatsNextList: '📦 Обработка заказа<br />📦 Упаковка<br />🚚 Передача курьеру<br />📧 Уведомление об отправке',
    cta1: 'Просмотреть заказ', cta2: 'Продолжить покупки',
    closing: 'Благодарим за доверие.<br />Ваша команда ALTA MODA',
  },
}

const ORDER_PAYMENT_METHOD_LABELS: Record<EmailLang, Record<string, string>> = {
  sr: { card: 'Platna kartica', bank_transfer: 'Uplatnica / E-banking', cash_on_delivery: 'Plaćanje pouzećem', invoice: 'Plaćanje po fakturi' },
  en: { card: 'Payment card', bank_transfer: 'Payment slip / E-banking', cash_on_delivery: 'Cash on delivery', invoice: 'Invoice payment' },
  ru: { card: 'Банковская карта', bank_transfer: 'Платежная квитанция / E-banking', cash_on_delivery: 'Оплата при получении', invoice: 'Оплата по счету' },
}

/** `paymentMethod` on the details is the raw code ('card' | 'bank_transfer' |
 *  'cash_on_delivery' | 'invoice') so this template can render it in the
 *  customer's language — never a pre-localized label from the caller. */
export function orderPaymentMethodLabel(code: string, language?: EmailLang): string {
  const lang = language ?? 'sr'
  return ORDER_PAYMENT_METHOD_LABELS[lang][code] ?? code
}

export function orderConfirmationTemplate(d: OrderConfirmationDetails): string {
  const lang = d.language ?? 'sr'
  const T = ORDER_CONFIRM_TEXT[lang]
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
            <br /><span style="color: #413d3a; font-size: 13px;">${T.qty}: ${i.quantity}</span>
          </td>
          <td align="right" style="padding: 10px 0; font-size: 14px; color: ${BRAND_TEXT}; white-space: nowrap; vertical-align: top;"><strong>${i.totalPrice}</strong></td>
        </tr>`
    )
    .join('')

  const bt = d.bankTransfer ?? null
  const BT = BANK_TRANSFER_TEXT[lang]
  const P = BANK_TRANSFER_PAYEE
  const bankTransferSection = bt
    ? `
      <p style="margin: 28px 0 12px; font-size: 15px; line-height: 1.6; color: ${BRAND_TEXT};">${BT.instructions}</p>
      <p style="margin: 0; font-size: 15px; line-height: 1.6; color: ${BRAND_TEXT};">${BT.referenceWarning}</p>
      ${paymentSlip(BT, d.orderNumber, bt)}
      <h3 style="margin: 28px 0 8px; font-size: 16px; color: ${BRAND_PRIMARY};">${BT.sellerHeading}</h3>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #dddbd9;">
        ${detailRow(BT.sellerName, P.name)}
        ${detailRow(BT.address, `${P.street}, ${P.city}`)}
        ${detailRow(BT.accountNo, `${P.account}, ${P.bank}`)}
        ${detailRow(BT.pib, P.pib)}
        ${detailRow(BT.mb, P.maticniBroj)}
      </table>`
    : ''

  const content = `
    <div style="padding: 40px;">
      <h2 style="margin: 0 0 4px; font-size: 22px; color: ${BRAND_PRIMARY};">${T.title}</h2>
      <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: ${BRAND_TEXT};">${T.greeting}</p>
      <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${BRAND_TEXT};">
        ${bt ? BT.intro : T.intro}
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #dddbd9;">
        ${detailRow(T.orderNo, d.orderNumber)}
        ${detailRow(T.paymentStatus, d.paymentConfirmed ? T.paid : bt ? BT.awaiting : T.processing)}
        ${detailRow(T.orderStatus, T.processing)}
        ${detailRow(T.paymentMethod, d.paymentMethod)}
        ${detailRow(T.shippingAddress, d.shippingAddress)}
        ${detailRow(T.notes, d.notes)}
      </table>
      ${bankTransferSection}
      <h3 style="margin: 28px 0 8px; font-size: 16px; color: ${BRAND_PRIMARY};">${T.itemsHeading}</h3>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #dddbd9;">
        ${itemRows}
        <tr>
          <td colspan="2" style="padding: 14px 0 0; font-size: 15px; color: ${BRAND_TEXT}; border-top: 1px solid #dddbd9;"><strong>${T.total}</strong></td>
          <td align="right" style="padding: 14px 0 0; font-size: 15px; color: ${BRAND_TEXT}; border-top: 1px solid #dddbd9; white-space: nowrap;"><strong>${d.total}</strong></td>
        </tr>
      </table>
      <h3 style="margin: 28px 0 8px; font-size: 16px; color: ${BRAND_PRIMARY};">${T.whatsNextHeading}</h3>
      <p style="margin: 0; font-size: 15px; line-height: 1.9; color: ${BRAND_TEXT};">
        ${bt ? BT.whatsNextList : T.whatsNextList}
      </p>
      ${ctaButton(`${site}/account`, T.cta1)}
      ${ctaButton(`${site}/products`, T.cta2)}
      <p style="margin: 24px 0 0; font-size: 15px; line-height: 1.6; color: ${BRAND_TEXT};">
        ${T.closing}
      </p>
    </div>
  `
  return baseLayout(content, { lang })
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
  /** "Uplatnicom" order: must not ship until the payment shows on the statement. */
  awaitingBankTransfer?: boolean
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
        ${detailRow('Status plaćanja', d.paymentConfirmed ? 'Plaćeno ✔' : d.awaitingBankTransfer ? 'Čeka se uplata — poslati tek kada uplata legne na račun' : 'U obradi')}
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
  language?: EmailLang
}

const ORDER_SHIPPED_TEXT: Record<EmailLang, {
  title: string; greeting: string; intro: string
  orderNo: string; courier: string; courierValue: string; shippedDate: string; eta: string; etaValue: string
  infoHeading: string; infoList: string; closing: string
}> = {
  sr: {
    title: 'Vaša porudžbina je poslata', greeting: 'Poštovani,',
    intro: 'Vaša porudžbina je pripremljena i predata kurirskoj službi. U nastavku možete pronaći informacije o isporuci.',
    orderNo: 'Broj porudžbine', courier: 'Kurirska služba', courierValue: 'Ovlašćena kurirska služba',
    shippedDate: 'Datum slanja', eta: 'Procenjeni rok isporuke', etaValue: '1–3 radna dana',
    infoHeading: 'Korisne informacije',
    infoList: '✔ Pripremite se za preuzimanje pošiljke.<br />✔ Proverite stanje paketa prilikom prijema.<br />✔ Ukoliko Vam je potrebna pomoć, kontaktirajte naš tim.',
    closing: 'ALTA MODA tim',
  },
  en: {
    title: 'Your order has shipped', greeting: 'Dear Customer,',
    intro: 'Your order has been prepared and handed over to the courier service. You can find the delivery details below.',
    orderNo: 'Order number', courier: 'Courier service', courierValue: 'Authorized courier service',
    shippedDate: 'Shipping date', eta: 'Estimated delivery time', etaValue: '1–3 business days',
    infoHeading: 'Useful information',
    infoList: '✔ Please be ready to receive the parcel.<br />✔ Check the condition of the package upon receipt.<br />✔ If you need help, contact our team.',
    closing: 'The ALTA MODA team',
  },
  ru: {
    title: 'Ваш заказ отправлен', greeting: 'Уважаемый клиент,',
    intro: 'Ваш заказ подготовлен и передан курьерской службе. Ниже вы найдете информацию о доставке.',
    orderNo: 'Номер заказа', courier: 'Курьерская служба', courierValue: 'Авторизованная курьерская служба',
    shippedDate: 'Дата отправки', eta: 'Ориентировочный срок доставки', etaValue: '1–3 рабочих дня',
    infoHeading: 'Полезная информация',
    infoList: '✔ Приготовьтесь к получению посылки.<br />✔ Проверьте состояние упаковки при получении.<br />✔ Если вам нужна помощь, свяжитесь с нашей командой.',
    closing: 'Команда ALTA MODA',
  },
}

export function orderShippedTemplate(d: OrderShippedDetails): string {
  const lang = d.language ?? 'sr'
  const T = ORDER_SHIPPED_TEXT[lang]
  const content = `
    <div style="padding: 40px;">
      <h2 style="margin: 0 0 16px; font-size: 22px; color: ${BRAND_PRIMARY};">${T.title}</h2>
      <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: ${BRAND_TEXT};">${T.greeting}</p>
      <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${BRAND_TEXT};">
        ${T.intro}
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #dddbd9;">
        ${detailRow(T.orderNo, d.orderNumber)}
        ${detailRow(T.courier, T.courierValue)}
        ${detailRow(T.shippedDate, d.shippedDate)}
        ${detailRow(T.eta, T.etaValue)}
      </table>
      <h3 style="margin: 28px 0 8px; font-size: 16px; color: ${BRAND_PRIMARY};">${T.infoHeading}</h3>
      <p style="margin: 0; font-size: 15px; line-height: 1.9; color: ${BRAND_TEXT};">
        ${T.infoList}
      </p>
      ${contactBlock(lang)}
      <p style="margin: 24px 0 0; font-size: 15px; line-height: 1.6; color: ${BRAND_TEXT};">
        ${T.closing}
      </p>
    </div>
  `
  return baseLayout(content, { lang })
}
