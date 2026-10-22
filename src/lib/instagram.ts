/**
 * Normalise an Instagram post/reel link to `https://www.instagram.com/<type>/<id>/`.
 * Returns null for anything that isn't an instagram.com post, reel or IGTV link,
 * so only safe, known URLs ever end up in an href on the storefront.
 */
export function normalizeInstagramPostUrl(raw: string | null | undefined): string | null {
  if (!raw) return null
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  if (!/^(www\.)?instagram\.com$/i.test(url.hostname)) return null
  // Accept both /p/<id>/ and /<username>/p/<id>/ forms.
  const match = url.pathname.match(/\/(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/)
  if (!match) return null
  const type = match[1] === 'reels' ? 'reel' : match[1]
  return `https://www.instagram.com/${type}/${match[2]}/`
}
