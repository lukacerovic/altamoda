import { getUnsubscribeUrl } from './email'

const BRAND_BG = '#fef9f1'
const BRAND_PRIMARY = '#8c4a5a'
const BRAND_TEXT = '#1d1c17'

function baseLayout(content: string, email: string) {
  const unsubscribeUrl = getUnsubscribeUrl(email)

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
          <!-- Header -->
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
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f5f0e8; border-top: 1px solid #e8e0d4;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #8a8578; text-align: center;">
                &copy; ${new Date().getFullYear()} Altamoda Heritage. Sva prava zadrzana.
              </p>
              <p style="margin: 0; font-size: 12px; color: #8a8578; text-align: center;">
                <a href="${unsubscribeUrl}" style="color: ${BRAND_PRIMARY}; text-decoration: underline;">Odjavi se</a> sa newsletter liste.
              </p>
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
  `
  return baseLayout(content, email)
}

export function campaignTemplate(subject: string, content: string, email: string): string {
  const wrappedContent = `
    <h2 style="margin: 0 0 24px; font-size: 22px; color: ${BRAND_PRIMARY};">${subject}</h2>
    <div style="font-size: 16px; line-height: 1.6; color: ${BRAND_TEXT};">
      ${content}
    </div>
  `
  return baseLayout(wrappedContent, email)
}

export function promoTemplate(
  title: string,
  description: string,
  ctaUrl: string,
  ctaText: string,
  email: string
): string {
  const content = `
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
  `
  return baseLayout(content, email)
}
