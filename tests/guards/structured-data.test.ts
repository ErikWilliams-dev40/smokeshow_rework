import { describe, expect, it } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  articleSchema,
  breadcrumbSchema,
  organizationSchema,
  serializeJsonLd,
  websiteSchema,
} from '@/domain/structured-data'
import { JsonLd } from '@/components/seo/JsonLd'
import { publicRoutes } from '@/content/seo/routes'
import { PublicLinks } from '@/components/public/PublicLinks'
import { articles } from '@/server/blog/fixtures'
const origin = 'https://smokeshowlabs.com'
describe('public content and structured data', () => {
  it('escapes script termination and round-trips untrusted content', () => {
    const data = { headline: '</script><script>alert(1)</script> & \u2028' }
    expect(JSON.parse(serializeJsonLd(data))).toEqual(data)
    const markup = renderToStaticMarkup(createElement(JsonLd, { data }))
    expect(markup.match(/<script/g)).toHaveLength(1)
    expect(markup).not.toContain('<script>alert')
  })
  it('builds only explicit public fields without price or offer properties', () => {
    const output = [
      organizationSchema(origin),
      websiteSchema(origin),
      articleSchema(origin, articles[0]!),
      breadcrumbSchema(origin, [{ label: 'Blog', path: '/smokesignals' }]),
    ]
    const keys: string[] = []
    function walk(value: unknown) {
      if (Array.isArray(value)) {
        value.forEach(walk)
        return
      }
      if (value && typeof value === 'object')
        for (const [key, child] of Object.entries(value)) {
          keys.push(key)
          walk(child)
        }
    }
    walk(output)
    expect(keys.some((key) => /price|offers?|discount/i.test(key))).toBe(false)
    expect(organizationSchema(origin)['@id']).toBe(`${origin}/#organization`)
  })
  it('links every public route and resolves every shared navigation href', () => {
    const markup = renderToStaticMarkup(createElement(PublicLinks, { policies: true }))
    for (const route of publicRoutes) {
      expect(markup).toContain(`href="${route.path}"`)
      expect(existsSync(`src/app${route.path}/page.tsx`)).toBe(true)
    }
    for (const match of markup.matchAll(/href="(\/[^"]*)"/g))
      expect(existsSync(`src/app${match[1]}/page.tsx`)).toBe(true)
  })
  it('reuses approved wholesale modules and leaves the landing page ungated', () => {
    const page = readFileSync('src/app/wholesale-products/page.tsx', 'utf8')
    expect(page).toContain('@/content/wholesale')
    expect(page).not.toMatch(/hasPassedGate|AgeGate|server\/pricing/)
  })
})
