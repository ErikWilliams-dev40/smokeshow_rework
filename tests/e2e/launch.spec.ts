import { expect, test } from '@playwright/test'

for (const width of [320, 390, 1280]) {
  test(`public overview, navigation and JSON-LD at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    const response = await page.goto('/wholesale-products')
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Your source for bulk',
    )
    await expect(
      page.getByRole('heading', { name: 'Are you 21 or older?' }),
    ).toHaveCount(0)
    for (const theme of ['brand', 'editorial']) {
      await page.evaluate((value) => {
        document.documentElement.className = value === 'brand' ? 'brand' : ''
      }, theme)
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBe(true)
    }
    const schemas = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents()
    expect(
      schemas.map((text) => (JSON.parse(text) as { '@type': string })['@type']),
    ).toEqual(expect.arrayContaining(['Organization', 'WebSite', 'BreadcrumbList']))
    await expect(
      page.getByRole('navigation', { name: 'Public footer' }).getByRole('link'),
    ).toHaveCount(7)
    await page.getByRole('link', { name: 'Ask about flower' }).click()
    await expect(
      page.getByRole('heading', { name: 'Are you 21 or older?' }),
    ).toBeVisible()
  })
}
test('local indexing, robots, canonicals and search', async ({ page, request }) => {
  const response = await page.goto('/privacy')
  expect(response?.headers()['x-robots-tag']).toBe('noindex')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    /noindex/,
  )
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    /\/privacy$/,
  )
  const robots = await request.get('/robots.txt')
  expect(robots.ok()).toBe(true)
  expect(await robots.text()).not.toContain('/blog/media')
  expect(await robots.text()).not.toContain('Disallow: /\n')
  const sitemap = await request.get('/sitemap.xml')
  expect(sitemap.status()).toBe(200)
  expect(await sitemap.text()).not.toContain('<loc>')
  await page.goto('/blog?view=all&page=2&section=vapes')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    /\/blog\?view=all&section=vapes&page=2$/,
  )
  await page.goto('/blog?q=vapes')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    /noindex/,
  )
})
test('verification links require an explicit action', async ({ page }) => {
  let calls = 0
  await page.route('**/api/leads/verify', (route) => {
    calls++
    return route.fulfill({
      status: 200,
      json: { status: 'confirmed', delivery: 'sent' },
    })
  })
  await page.goto('/verify-email#test-credential')
  await expect(
    page.getByRole('button', { name: 'Confirm email', exact: true }),
  ).toBeVisible()
  expect(calls).toBe(0)
  expect(new URL(page.url()).hash).toBe('')
  await page.getByRole('button', { name: 'Confirm email', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Email confirmed' })).toBeVisible()
  expect(calls).toBe(1)
})
test('real local lead submission persists and can be queried without personal data', async ({
  request,
  baseURL,
}) => {
  const submissionId = crypto.randomUUID()
  const headers = {
    origin: baseURL!,
    'CF-Connecting-IP': `198.51.100.${Math.floor(Math.random() * 200) + 1}`,
  }
  const email = `test-${submissionId}@example.test`
  const data = {
    submissionId,
    email,
    name: 'Local Test',
    phone: '5551234567',
    website: '',
  }
  const first = await request.post('/api/leads', { headers, data })
  expect(first.status(), await first.text()).toBe(202)
  expect(await first.json()).toEqual({ status: 'pending', delivery: 'sent' })
  const retry = await request.post('/api/leads', { headers, data })
  expect(retry.status()).toBe(202)
  const status = await request.post('/api/leads/status', {
    headers,
    data: { submissionId },
  })
  expect(await status.json()).toEqual({ status: 'pending', delivery: 'sent' })
  expect(await status.text()).not.toContain(email)
  expect(
    (
      await request.post('/api/leads', {
        headers: { origin: 'https://attacker.invalid' },
        data,
      })
    ).status(),
  ).toBe(403)
})
