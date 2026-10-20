import { existsSync, readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { privacy, returns, shipping, terms } from '@/content/policies'

const root = new URL('../../', import.meta.url)

/**
 * Public policy routes are reachable from the footer. Only terms remains a
 * placeholder until the client's final text replaces it.
 */
describe('policy pages', () => {
  it.each([['terms', terms]])(
    '/%s has a route and is marked as a placeholder',
    (slug, copy) => {
      expect(existsSync(new URL(`src/app/${slug}/page.tsx`, root))).toBe(true)
      expect(copy.placeholder).toBe(true)
      expect(copy.notice).toMatch(/^Placeholder\./)
      expect(copy.notice).toContain('Nothing here is in effect yet.')
    },
  )

  it('provides a final return policy with all ten sections', () => {
    expect(existsSync(new URL('src/app/returns/page.tsx', root))).toBe(true)
    expect(returns.placeholder).toBe(false)
    expect(returns.notice).toBeUndefined()
    expect(returns.effectiveDate?.dateTime).toBe('2026-10-19')
    expect(returns.sections).toHaveLength(10)
  })

  it('provides a final privacy policy with all eleven sections', () => {
    expect(existsSync(new URL('src/app/privacy/page.tsx', root))).toBe(true)
    expect(privacy.placeholder).toBe(false)
    expect(privacy.notice).toBeUndefined()
    expect(privacy.effectiveDate?.dateTime).toBe('2026-10-19')
    expect(privacy.sections).toHaveLength(11)
  })

  it('links all policy pages from the splash footer', () => {
    const splash = readFileSync(
      new URL('src/components/splash/Splash.tsx', root),
      'utf8',
    )
    expect(splash).toContain('href="/privacy"')
    expect(splash).toContain('href="/terms"')
    expect(splash).toContain('href="/returns"')
    expect(splash).toContain('href="/shipping"')
  })

  it('provides a final shipping policy with all eight sections', () => {
    expect(existsSync(new URL('src/app/shipping/page.tsx', root))).toBe(true)
    expect(shipping.placeholder).toBe(false)
    expect(shipping.notice).toBeUndefined()
    expect(shipping.effectiveDate?.dateTime).toBe('2026-10-19')
    expect(shipping.sections).toHaveLength(8)
  })
})
