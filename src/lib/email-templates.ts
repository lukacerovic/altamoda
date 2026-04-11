import { getUnsubscribeUrl } from './email'

const BRAND_BG = '#fef9f1'
const BRAND_PRIMARY = '#8c4a5a'
const BRAND_TEXT = '#1d1c17'

interface BaseLayoutOptions {
  /** Recipient email — required when showUnsubscribe is true */
  email?: string
  /** Show "Odjavi se" link in footer (newsletter sends only, not transactional) */
  showUnsubscribe?: boolean
}

function baseLayout(content: string, opts: BaseLayoutOptions = {}) {
  const { email, showUnsubscribe = false } = opts
  const footerUnsub =
    showUnsubscribe && email
      ? `<p style="margin: 0; font-size: 12px; color: #8a8578; text-align: center;">
                <a href="${getUnsubscribeUrl(email)}" style="color: ${BRAND_PRIMARY}; text-decoration: underline;">Odjavi se</a> sa newsletter liste.
              </p>`
      : ''

  return `<!DOCTYPE html>
<html lang="sr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Altamoda</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND_BG}; font-family: 'Georgia', 'Times New Roman', serif; color: ${BRAND_TEXT};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${BRAND_BG};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);">
          <tr>
            <td align="center" style="padding: 32px 40px 24px; background-color: ${BRAND_PRIMARY};">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: 3px; text-transform: uppercase;">
                ALTAMODA
              </h1>
              <p style="margin: 4px 0 0; font-size: 12px; color: rgba(255, 255, 255, 0.8); letter-spacing: 2px; text-transform: uppercase;">
                Heritage
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0;">${content}</td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #f5f0e8; border-top: 1px solid #e8e0d4;">
              <p style="margin: 0 0 ${footerUnsub ? '8px' : '0'}; font-size: 12px; color: #8a8578; text-align: center;">
                &copy; ${new Date().getFullYear()} Altamoda Heritage. Sva prava zadrzana.
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
    <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.5; color: #8a8578;">
      Kod vazi 30 dana od danas. Minimalna vrednost narudzbe: 3.000 RSD.
    </p>
    </div>
  `
  return baseLayout(content, { email, showUnsubscribe: true })
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
  const adminUrl = `${process.env.SITE_URL || 'http://localhost:3000'}/admin/users`
  const row = (label: string, value?: string | null) =>
    value
      ? `<tr><td style="padding: 8px 0; font-size: 14px; color: #8a8578; width: 140px;">${label}</td><td style="padding: 8px 0; font-size: 14px; color: ${BRAND_TEXT};"><strong>${value}</strong></td></tr>`
      : ''

  const content = `
    <div style="padding: 40px;">
      <h2 style="margin: 0 0 16px; font-size: 22px; color: ${BRAND_PRIMARY};">Nova B2B prijava ceka odobrenje</h2>
      <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${BRAND_TEXT};">
        Novi B2B korisnik se registrovao i ceka odobrenje administratora.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px; border-top: 1px solid #e8e0d4;">
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
  const loginUrl = `${process.env.SITE_URL || 'http://localhost:3000'}/login`
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
      <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #8a8578;">
        Ako imate bilo kakva pitanja, slobodno nas kontaktirajte na info@altamoda.rs.
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
