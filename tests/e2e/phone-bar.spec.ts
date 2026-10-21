import { expect, test } from '@playwright/test'

import { salesContact } from '@/content/splash'

const routes = [
  '/',
  '/wholesale',
  '/blog',
  '/privacy',
  '/terms',
  '/returns',
  '/shipping',
]
const { phone } = salesContact

test.beforeEach(async ({ context, baseURL, page }) => {
  await context.addCookies([{ name: 'ss_gate', value: '1', url: baseURL! }])
  await page.addInitScript(() => sessionStorage.setItem('ss_intro_seen', '1'))
})

for (const route of routes) {
  test(`${route} starts with the sales phone strip`, async ({ page }) => {
    await page.goto(route)
    const call = page.getByRole('link', { name: `Call sales at ${phone.display}` })
    await expect(call).toHaveCount(1)
    await expect(call).toHaveAttribute('href', 'tel:+18554367249')
    await expect(call).toHaveText(`${phone.vanity}${phone.display}`)
    await expect(call).toBeInViewport({ ratio: 1 })

    // Above every route's own content, not merely somewhere near the top.
    const first = await call.evaluate(
      (link) => document.body.firstElementChild === link.parentElement,
    )
    expect(first).toBe(true)
  })
}

test('the home contact section uses the same number', async ({ page }) => {
  await page.goto('/')
  const contact = page.locator('#contact')
  await expect(contact.getByRole('link', { name: phone.display })).toHaveAttribute(
    'href',
    phone.href,
  )
  await expect(page.locator('body')).not.toContainText('213 943')
})

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 375, height: 812 },
]) {
  test(`the strip fits a ${viewport.width}px viewport`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/')
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBe(0)
  })
}
