/**
 * Altamoda letterhead newsletter schemes.
 *
 * Single source of truth for the 6 default templates. Each scheme is a blank
 * "stationery" letterhead: the centred `altamoda` wordmark + tagline in the
 * header, a faint `d` watermark in the bottom-right of the body, and a colour
 * palette. The body is intentionally near-empty — the admin fills it per send.
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
const BLACK = '#141414'
const PINK = '#edb4bd'

// Wordmark + watermark assets (transparent PNGs in /public/email)
const WM = {
  brown: '/email/wordmark-brown.png',
  black: '/email/wordmark-black.png',
  pink: '/email/wordmark-pink.png',
}
const MARK = {
  blush: '/email/watermark-d-blush.png', // for cream bodies
  rose: '/email/watermark-d-rose.png', // for pink bodies
}

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
      wordmarkSrc: WM.brown, taglineColor: BROWN, watermarkSrc: MARK.blush,
      textColor: BROWN, mutedColor: '#9a8f88', accentColor: '#cdbfb6',
      footerText: 'ALTAMODA · ' + TAGLINE,
    },
  },
  {
    name: 'Nežno roze',
    subject: 'Altamoda — novosti',
    description: 'Jednobojno nežno roze, crni logo. Memorandum stil.',
    body: blankBody,
    options: {
      headerTitle: 'altamoda', tagline: TAGLINE,
      pageBg: '#f1c7ce', headerBg: '#f8e2e4', bodyBg: '#f8e2e4',
      wordmarkSrc: WM.black, taglineColor: BLACK, watermarkSrc: MARK.rose,
      textColor: '#2a1a1c', mutedColor: '#a87f86', accentColor: '#d9aeb5',
      footerText: 'ALTAMODA · ' + TAGLINE,
    },
  },
  {
    name: 'Crno zaglavlje',
    subject: 'Altamoda — novosti',
    description: 'Crno zaglavlje sa roze logom, krem telo. Memorandum stil.',
    body: blankBody,
    options: {
      headerTitle: 'altamoda', tagline: TAGLINE,
      pageBg: '#101010', headerBg: '#101010', bodyBg: '#f8f3ef',
      wordmarkSrc: WM.pink, taglineColor: PINK, watermarkSrc: MARK.blush,
      textColor: '#1a1c1e', mutedColor: '#9a8f88', accentColor: '#cdbfb6',
      footerText: 'ALTAMODA · ' + TAGLINE,
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
      wordmarkSrc: WM.pink, taglineColor: '#1a1c1e', watermarkSrc: MARK.blush,
      textColor: '#1a1c1e', mutedColor: '#9a8f88', accentColor: '#cdbfb6',
      footerText: 'ALTAMODA · ' + TAGLINE,
    },
  },
  {
    name: 'Roze & braon',
    subject: 'Altamoda — novosti',
    description: 'Jednobojno roze, braon logo. Memorandum stil.',
    body: blankBody,
    options: {
      headerTitle: 'altamoda', tagline: TAGLINE,
      pageBg: '#f1c7ce', headerBg: '#fee1e3', bodyBg: '#fee1e3',
      wordmarkSrc: WM.brown, taglineColor: BROWN, watermarkSrc: MARK.rose,
      textColor: BROWN, mutedColor: '#a87f86', accentColor: '#d9aeb5',
      footerText: 'ALTAMODA · ' + TAGLINE,
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
      wordmarkSrc: WM.brown, taglineColor: BROWN, watermarkSrc: MARK.blush,
      textColor: BROWN, mutedColor: '#9a8f88', accentColor: '#cdbfb6',
      footerText: 'ALTAMODA · ' + TAGLINE,
    },
  },
]

/** Per-template-name option lookup, used by the admin editor/preview. */
export const schemeOptionsByName: Record<string, EmailTemplateOptions> =
  Object.fromEntries(letterheadSchemes.map((s) => [s.name, s.options]))
