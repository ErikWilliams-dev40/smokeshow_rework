import { expect, test } from '@playwright/test'

test('public fixture blog supports pagination, article rendering and real 404s', async ({
  page,
  baseURL,
}) => {
  const external: string[] = []
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== new URL(baseURL!).origin)
      external.push(request.url())
  })
  const response = await page.goto('/blog?view=all')
  expect(response?.status()).toBe(200)
  await expect(
    page.getByRole('heading', { name: 'All stories', exact: true }),
  ).toBeVisible()
  await expect(page.getByText('Are you 21')).toHaveCount(0)
  await expect(page.locator('main article')).toHaveCount(12)
  await page.getByRole('link', { name: 'Next page' }).click()
  await expect(page.locator('main article')).toHaveCount(12)
  await page.getByRole('link', { name: 'Previous page' }).click()
  await page.getByRole('link', { name: 'Planning a wholesale inquiry' }).click()
  await expect(
    page.getByRole('heading', { name: 'Planning a wholesale inquiry', exact: true }),
  ).toBeVisible()
  await expect(page).toHaveTitle('Planning a wholesale inquiry | Smoke Show Labs')
  await expect(page.locator('blockquote')).toHaveText(/Start with a clear brief/)
  for (const image of await page.locator('main img').all()) {
    await expect(image).toHaveJSProperty('naturalWidth', 2400)
  }
  expect(external).toEqual([])
  expect((await page.goto('/blog/missing'))?.status()).toBe(404)
})

for (const theme of ['brand', 'editorial']) {
  test(`blog ${theme} theme at desktop and mobile widths`, async ({
    page,
  }, testInfo) => {
    await page.goto('/blog/planning-a-wholesale-inquiry')
    await page.evaluate((name) => {
      document.documentElement.className = name === 'brand' ? 'brand' : ''
    }, theme)
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({ width, height: 900 })
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true)
      await page.screenshot({
        path: testInfo.outputPath(`blog-${theme}-${width}.png`),
        fullPage: true,
      })
    }
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await expect(
      page.getByRole('link', { name: 'Skip to content', exact: true }),
    ).toBeFocused()
  })
}

test('homepage exposes Blog in desktop and mobile navigation', async ({
  page,
  context,
  baseURL,
}) => {
  await context.addCookies([{ name: 'ss_gate', value: '1', url: baseURL! }])
  await page.goto('/')
  await expect(
    page
      .getByRole('navigation', { name: 'Main navigation', exact: true })
      .getByRole('link', { name: 'Smoke Signals', exact: true }),
  ).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: /Menu/ }).click()
  await page
    .getByRole('navigation', { name: 'Mobile navigation' })
    .getByRole('link', { name: 'Smoke Signals', exact: true })
    .click()
  await expect(page).toHaveURL(/\/blog$/)
})

test('normalizes invalid page parameters and handles empty pages', async ({ page }) => {
  for (const query of ['0', '-1', 'abc', '1.5', '9999999999999999999999']) {
    await page.goto(`/blog?page=${query}`)
    await expect(page.getByText('Page 1', { exact: true })).toBeVisible()
  }
  await page.goto('/blog?page=99')
  await expect(page.getByText('No articles yet on this page.')).toBeVisible()
})

test('built Worker consent response carries Secure and works without JavaScript', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL })
  const page = await context.newPage()
  await page.goto('/wholesale')
  const responsePromise = page.waitForResponse(
    (response) => response.request().method() === 'POST',
  )
  await page.getByRole('button', { name: 'Yes, I’m 21+' }).click()
  const response = await responsePromise
  const cookie = (await response.allHeaders())['set-cookie'] ?? ''
  expect(cookie).toMatch(/ss_gate=1/)
  expect(cookie).toMatch(/secure/i)
  expect(cookie).toMatch(/httponly/i)
  expect(cookie).toMatch(/samesite=lax/i)
  await expect(page).toHaveURL(/\/wholesale$/)
  await expect(page.getByText('Are you 21')).toHaveCount(0)
  await context.close()
})
