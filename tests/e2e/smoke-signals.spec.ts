import { expect, test } from '@playwright/test'

for (const width of [320, 390, 768, 1024, 1280, 1440]) {
  test(`magazine and drawer fit ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('/smokesignals')
    await expect(page).toHaveTitle('Smoke Signals | Smoke Show Labs')
    await expect(
      page.getByRole('heading', { name: 'Planning a wholesale inquiry', exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Featured', exact: true }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'On the shelf' })).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Compliance & Retail' }),
    ).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true)
    const lead = await page.locator('[class*="leadColumn"]').boundingBox()
    const latest = await page.locator('[class*="latestColumn"]').boundingBox()
    const rail = await page.locator('[class*="railColumn"]').boundingBox()
    if (width >= 1024) {
      expect(latest!.x).toBeLessThan(lead!.x)
      expect(lead!.x).toBeLessThan(rail!.x)
      expect(Math.abs(lead!.y - latest!.y)).toBeLessThan(2)
    } else expect(lead!.y).toBeLessThan(latest!.y)
    await page.screenshot({
      path: testInfo.outputPath(`magazine-${width}.png`),
      fullPage: true,
    })
    await page.evaluate(() => window.scrollTo(0, 300))
    await expect(page.locator('header[data-scrolled]')).toHaveAttribute(
      'data-scrolled',
      'true',
    )
    await expect(page.locator('header[data-scrolled]')).toBeInViewport()
    await page.getByRole('button', { name: 'Open sections' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.screenshot({ path: testInfo.outputPath(`drawer-${width}.png`) })
    expect(
      await page.getByRole('dialog').evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true)
    await expect(
      page.getByRole('complementary', { name: 'Wholesale menu signup' }),
    ).toHaveCount(0)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Open sections' })).toBeFocused()
    expect(errors).toEqual([])
  })
}

test('category URLs, archive, search and history work together', async ({ page }) => {
  await page.goto('/smokesignals')
  await page
    .getByRole('navigation', { name: 'Blog sections', exact: true })
    .getByRole('link', { name: 'Flower', exact: true })
    .click()
  await expect(page).toHaveURL(/section=flower/)
  await expect(page.getByRole('heading', { name: 'Flower', exact: true })).toBeVisible()
  await page
    .getByRole('link', { name: 'All Flower stories', exact: true })
    .first()
    .click()
  await expect(page.getByRole('heading', { name: 'Flower stories' })).toBeVisible()
  await expect(page.locator('main article')).toHaveCount(3)
  await page.locator('main').getByRole('searchbox').fill('example 10')
  await page
    .locator('main')
    .getByRole('button', { name: 'Search', exact: true })
    .click()
  await expect(page).toHaveURL(/section=flower&q=example\+10/)
  await expect(page.locator('main article')).toHaveCount(1)
  await page.goBack()
  await expect(page.getByRole('heading', { name: 'Flower stories' })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('heading', { name: 'Flower', exact: true })).toBeVisible()
  await page.goto('/smokesignals?q=not-a-real-story')
  await expect(page.getByText('No articles yet on this page.')).toBeVisible()
})

test('drawer traps focus, expands sections, searches and dismisses from the backdrop', async ({
  page,
}) => {
  await page.goto('/smokesignals')
  await page.getByRole('button', { name: 'Open search' }).click()
  const drawer = page.getByRole('dialog')
  await expect(drawer.getByRole('searchbox')).toBeFocused()
  await drawer.getByRole('link', { name: 'Get the Wholesale Menu' }).focus()
  await page.keyboard.press('Tab')
  await expect(drawer.getByRole('link', { name: 'Smoke Signals home' })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(
    drawer.getByRole('link', { name: 'Get the Wholesale Menu' }),
  ).toBeFocused()
  await drawer.locator('summary').filter({ hasText: 'Flower' }).click()
  await expect(
    drawer.getByRole('link', { name: 'Wholesale planning example 2', exact: true }),
  ).toBeVisible()
  await page.mouse.click(600, 200)
  await expect(drawer).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Open search' })).toBeFocused()
  await page.getByRole('button', { name: 'Open search' }).click()
  await drawer.getByRole('searchbox').fill('inquiry')
  await drawer.getByRole('button', { name: 'Search', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Search results for “inquiry”' }),
  ).toBeVisible()
})

test('mobile signup dismisses for the tab and every CTA uses the existing wholesale flow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/smokesignals')
  const bar = page.getByRole('complementary', { name: 'Wholesale menu signup' })
  await expect(bar).toBeVisible()
  await expect(bar.getByRole('link', { name: 'Sign up' })).toHaveAttribute(
    'href',
    '/wholesale',
  )
  for (const cta of await page
    .getByRole('link', { name: 'Get the Wholesale Menu', exact: true })
    .all())
    await expect(cta).toHaveAttribute('href', '/wholesale')
  await bar.getByRole('button', { name: 'Dismiss signup bar' }).click()
  await page.reload()
  await expect(bar).toHaveCount(0)
  await expect(page.locator('main input[type=email]')).toHaveCount(0)
})

test('article shell and navigation remain usable without JavaScript', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL })
  const page = await context.newPage()
  await page.goto('/smokesignals')
  await page
    .getByRole('navigation', { name: 'Blog sections', exact: true })
    .getByRole('link', { name: 'Flower', exact: true })
    .click()
  await page
    .getByRole('link', { name: 'All Flower stories', exact: true })
    .first()
    .click()
  await page.locator('main').getByRole('searchbox').fill('example 10')
  await page
    .locator('main')
    .getByRole('button', { name: 'Search', exact: true })
    .click()
  await page.locator('main article').getByRole('link').click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Wholesale planning example 10',
  )
  await expect(page.getByRole('link', { name: 'Smoke Signals home' })).toBeVisible()
  await expect(
    page.getByRole('contentinfo', { name: 'Hemp product notice' }),
  ).toBeVisible()
  await context.close()
})

test('reduced motion disables smoke and blog color stays editorial in either root theme', async ({
  page,
}) => {
  await page.goto('/smokesignals')
  const smoke = page.locator('[class*="topSmoke"] i').first()
  expect(await smoke.evaluate((el) => getComputedStyle(el).animationName)).toBe('none')
  const shell = page.locator('[data-motion]')
  expect(await shell.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
    'rgb(255, 255, 255)',
  )
  await page.evaluate(() => {
    document.documentElement.className = ''
  })
  expect(await shell.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
    'rgb(255, 255, 255)',
  )
})
