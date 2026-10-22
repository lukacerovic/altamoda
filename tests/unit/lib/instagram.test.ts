import { describe, it, expect } from 'vitest'
import { normalizeInstagramPostUrl } from '@/lib/instagram'

describe('normalizeInstagramPostUrl', () => {
  it('normalises post, reel and IGTV links', () => {
    expect(normalizeInstagramPostUrl('https://www.instagram.com/p/DAbc123_-x/?igsh=xyz')).toBe('https://www.instagram.com/p/DAbc123_-x/')
    expect(normalizeInstagramPostUrl('instagram.com/p/abc')).toBeNull() // no scheme → not a URL
    expect(normalizeInstagramPostUrl('https://instagram.com/reel/C9xyz')).toBe('https://www.instagram.com/reel/C9xyz/')
    expect(normalizeInstagramPostUrl('https://www.instagram.com/reels/C9xyz/')).toBe('https://www.instagram.com/reel/C9xyz/')
    expect(normalizeInstagramPostUrl('https://www.instagram.com/altamoda.rs/p/C9xyz/')).toBe('https://www.instagram.com/p/C9xyz/')
    expect(normalizeInstagramPostUrl(' https://www.instagram.com/tv/AbC/ ')).toBe('https://www.instagram.com/tv/AbC/')
  })

  it('rejects non-Instagram, profile and unsafe URLs', () => {
    expect(normalizeInstagramPostUrl('https://www.instagram.com/altamoda.rs/')).toBeNull()
    expect(normalizeInstagramPostUrl('https://evil.com/p/abc/')).toBeNull()
    expect(normalizeInstagramPostUrl('https://instagram.com.evil.com/p/abc/')).toBeNull()
    expect(normalizeInstagramPostUrl('javascript:alert(1)//instagram.com/p/abc')).toBeNull()
    expect(normalizeInstagramPostUrl('https://scontent.cdninstagram.com/v/t51/abc.jpg')).toBeNull()
    expect(normalizeInstagramPostUrl('')).toBeNull()
    expect(normalizeInstagramPostUrl(null)).toBeNull()
  })
})
