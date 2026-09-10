/**
 * Altamoda letterhead newsletter schemes.
 *
 * Single source of truth for the 6 default templates. Each scheme is a blank
 * "stationery" letterhead: the centred `altamoda` wordmark + tagline in the
 * header, and a colour palette. The body is intentionally near-empty — the
 * admin fills it per send.
 *
 * - The body HTML is stored on the template row (seeded via the seed route).
 * - The colours/assets travel as `EmailTemplateOptions` (keyed by template
 *   name) and are applied by the editor/preview/send pipeline, not stored on
 *   the template row — see `schemeOptionsByName` and the admin page.
 */
import type { EmailTemplateOptions } from './email-preview'

const TAGLINE = 'BEAUTY DISTRIBUTION & EDUCATION'

// Brand ink colours
const BROWN = '#2c160b'

// Wordmark assets (transparent PNGs in /public/email)
const WM = {
  brown: '/email/wordmark-brown.png',
  black: '/email/wordmark-black.png',
  pink: '/email/wordmark-pink.png',
  stackedBrown: '/email/wordmark-stacked-brown.png',
}

// Footer signoff assets
const FOOTER_ART = {
  mascot: '/email/mascot-wordmark.png',
}

const BRAND_PINK = '#ecb3bc'

/** Faint placeholder body — admin replaces this with real content per send. */
const blankBody =
  `<p style="text-align:center;color:#c9bcb4;font-size:13px;letter-spacing:0.5px;margin:0;"><em>Vaš sadržaj…</em></p>`

export interface LetterheadScheme {
  name: string
  subject: string
  description: string
  body: string
  options: EmailTemplateOptions
}

export const letterheadSchemes: LetterheadScheme[] = [
  {
    name: 'Roze zaglavlje',
    subject: 'Altamoda — novosti',
    description: 'Roze zaglavlje, krem telo, braon logo. Memorandum stil.',
    body: blankBody,
    options: {
      headerTitle: 'altamoda', tagline: TAGLINE,
      pageBg: '#f9e1e1', headerBg: '#f9e1e1', bodyBg: '#fbf6f2',
      wordmarkSrc: WM.brown, taglineColor: BROWN,
      textColor: BROWN, mutedColor: '#9a8f88', accentColor: '#cdbfb6',
      footerText: 'ALTAMODA · ' + TAGLINE,
    },
  },
  {
    name: 'Roze traka',
    subject: 'Altamoda — novosti',
    description: 'Belo telo, ilustrovani roze potpis (maskota + logo) u podnožju sa godinom, pravima i odjavom.',
    body: blankBody,
    options: {
      headerTitle: 'altamoda',
      hideHeader: true,
      pageBg: '#ffffff', bodyBg: '#ffffff',
      footerBg: BRAND_PINK, footerImage: FOOTER_ART.mascot,
      footerLayout: 'split', footerTaglineLines: ['Beauty', 'distribution', 'and education'],
      textColor: BROWN, mutedColor: '#a87f86', accentColor: '#d9aeb5',
    },
  },
  {
    name: 'Roze traka s linijom',
    subject: 'Altamoda — novosti',
    description: 'Roze zaglavlje sa uspravnim logom i linijom, bela pozadina, roze traka u podnožju sa pravima i odjavom.',
    body: blankBody,
    options: {
      headerTitle: 'alta moda', tagline: 'Beauty\ndistribution\nand education',
      headerLayout: 'split', headerDivider: true,
      pageBg: BRAND_PINK, headerBg: BRAND_PINK, bodyBg: '#ffffff',
      footerBg: BRAND_PINK,
      wordmarkSrc: WM.stackedBrown, taglineColor: BROWN,
      textColor: BROWN, mutedColor: '#a87f86', accentColor: '#d9aeb5',
      footerLayout: 'columns',
    },
  },
  {
    name: 'Krem & roze',
    subject: 'Altamoda — novosti',
    description: 'Jednobojni krem, roze logo. Memorandum stil.',
    body: blankBody,
    options: {
      headerTitle: 'altamoda', tagline: TAGLINE,
      pageBg: '#efe5dd', headerBg: '#fbf6f3', bodyBg: '#fbf6f3',
      wordmarkSrc: WM.pink, taglineColor: '#1a1c1e',
      textColor: '#1a1c1e', mutedColor: '#9a8f88', accentColor: '#cdbfb6',
      footerText: 'ALTAMODA · ' + TAGLINE,
    },
  },
  {
    name: 'Roze memorandum',
    subject: 'Altamoda — novosti',
    description: 'Belo telo, logo i podebljana linija u podnožju, tagline i pravni red uz odjavu. Memorandum stil.',
    body: blankBody,
    options: {
      headerTitle: 'altamoda',
      hideHeader: true,
      pageBg: '#ffffff', bodyBg: '#ffffff',
      footerBg: '#ffffff',
      footerWordmarkSrc: WM.brown, footerDivider: true,
      footerLayout: 'split', footerTaglineLines: ['Beauty', 'distribution', 'and education'],
      textColor: BROWN, mutedColor: '#a87f86', accentColor: '#d9aeb5',
    },
  },
  {
    name: 'Topli krem',
    subject: 'Altamoda — novosti',
    description: 'Topli krem ton, braon logo. Memorandum stil.',
    body: blankBody,
    options: {
      headerTitle: 'altamoda', tagline: TAGLINE,
      pageBg: '#e8ddd3', headerBg: '#f4ede7', bodyBg: '#fbf8f3',
      wordmarkSrc: WM.brown, taglineColor: BROWN,
      textColor: BROWN, mutedColor: '#9a8f88', accentColor: '#cdbfb6',
      footerText: 'ALTAMODA · ' + TAGLINE,
    },
  },
]

/** Per-template-name option lookup, used by the admin editor/preview. */
export const schemeOptionsByName: Record<string, EmailTemplateOptions> =
  Object.fromEntries(letterheadSchemes.map((s) => [s.name, s.options]))
