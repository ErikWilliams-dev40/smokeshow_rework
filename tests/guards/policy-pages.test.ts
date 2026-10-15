import { existsSync, readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { privacy, terms } from '@/content/policies'

const root = new URL('../../', import.meta.url)

/**
 * /privacy and /terms exist, are reachable from the footer, and say plainly
 * that they are placeholders until the client's text replaces them (issue #14).
 */
describe('policy pages', () => {
  it.each([
    ['privacy', privacy],
    ['terms', terms],
  ])('/%s has a route and is marked as a placeholder', (slug, copy) => {
    expect(existsSync(new URL(`src/app/${slug}/page.tsx`, root))).toBe(true)
    expect(copy.placeholder).toBe(true)
    expect(copy.notice).toMatch(/^Placeholder\./)
    expect(copy.notice).toContain('Nothing here is in effect yet.')
  })

  it('links both pages from the splash footer', () => {
    const splash = readFileSync(
      new URL('src/components/splash/Splash.tsx', root),
      'utf8',
    )
    expect(splash).toContain('href="/privacy"')
    expect(splash).toContain('href="/terms"')
  })
})
