import { describe, expect, it } from 'vitest'
import { indexingResponse, seoConfig } from '@/domain/seo'

describe('deployment indexing', () => {
  it.each(['local', 'staging', 'production'])(
    'uses explicit %s deployment mode',
    (mode) => {
      expect(seoConfig('https://smokeshowlabs.com', mode).indexable).toBe(
        mode === 'production',
      )
    },
  )
  it.each([
    'https://example.com/path',
    'https://user:pass@example.com',
    'javascript:alert(1)',
    'https://example.com/?q=1',
  ])('rejects invalid origins: %s', (url) => {
    expect(() => seoConfig(url, 'production')).toThrow()
  })
  it('fails closed for missing modes and insecure production URLs', () => {
    expect(() => seoConfig('https://example.com', undefined)).toThrow()
    expect(() => seoConfig('http://example.com', 'production')).toThrow()
  })
  it('preserves streaming HTML errors, cache and retry headers', async () => {
    const original = new Response('unavailable', {
      status: 503,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Retry-After': '60',
        'Cache-Control': 'no-store',
      },
    })
    const response = indexingResponse(original, false)
    expect(response.status).toBe(503)
    expect(response.headers.get('Retry-After')).toBe('60')
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex')
    expect(await response.text()).toBe('unavailable')
  })
  it('leaves assets and production responses unchanged', () => {
    const asset = new Response('image', { headers: { 'Content-Type': 'image/png' } })
    expect(indexingResponse(asset, false)).toBe(asset)
    const html = new Response('page', { headers: { 'Content-Type': 'text/html' } })
    expect(indexingResponse(html, true)).toBe(html)
  })
})
