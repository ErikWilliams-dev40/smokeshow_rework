import { expect, test, type Page } from '@playwright/test'

import { compliance } from '@/content/compliance'

const routes = ['/', '/wholesale', '/privacy', '/terms']

async function expectNotice(page: Page) {
  const notice = page.getByRole('contentinfo', { name: 'Hemp product notice' })
  await expect(notice).toHaveCount(1)
  await expect(notice.getByRole('heading', { level: 2 })).toHaveText(
    compliance.hempNoticeHeading,
  )
  await expect(notice.locator('p')).toHaveText(compliance.hempNotice)
  await expect(notice).toHaveCSS('position', 'static')
  await page.evaluate(() => document.fonts.ready)

  // Check all route content, including the separate contact footer on the home page.
  const placement = await notice.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const preceding = [...document.querySelectorAll('main, footer')].filter(
      (candidate) => candidate !== element,
    )
    return {
      top: rect.top + scrollY,
      left: rect.left,
      width: rect.width,
      viewportWidth: document.documentElement.clientWidth,
      precedingBottom: Math.max(
        ...preceding.map(
          (candidate) => candidate.getBoundingClientRect().bottom + scrollY,
        ),
      ),
    }
  })
  expect(placement.top).toBeGreaterThanOrEqual(placement.precedingBottom)
  expect(placement.left).toBe(0)
  expect(placement.width).toBe(placement.viewportWidth)

  // Visibility alone permits content below the viewport or in a locked page.
  await page.evaluate(() =>
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'instant',
    }),
  )
  await expect(notice.getByRole('heading')).toBeInViewport({ ratio: 1 })
  await expect(notice.locator('p')).toBeInViewport({ ratio: 1 })
  return notice
}

test.beforeEach(async ({ context, baseURL, page }) => {
  await context.addCookies([{ name: 'ss_gate', value: '1', url: baseURL! }])
  await page.addInitScript(() => sessionStorage.setItem('ss_intro_seen', '1'))
})

for (const route of routes) {
  test(`${route} ends with the hemp compliance notice`, async ({ page }) => {
    await page.goto(route)
    await expectNotice(page)
  })
}

test.describe('age gate without JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })

  for (const route of ['/', '/wholesale']) {
    test(`${route} keeps the notice readable before and after age refusal`, async ({
      page,
      context,
    }) => {
      await context.clearCookies()
      await page.goto(route)
      await expect(
        page.getByRole('heading', { name: 'Are you 21 or older?' }),
      ).toBeVisible()
      await expectNotice(page)
      await page.getByRole('link', { name: 'No', exact: true }).click()
      await expect(page.getByRole('status')).toContainText('aged 21 and over')
      await expectNotice(page)
    })
  }
})

for (const width of [320, 390, 560, 561, 768, 1024, 1440]) {
  test(`notice fits at ${width}px and clears the motion control`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 })
    await page.goto('/')
    const notice = await expectNotice(page)
    await expect(notice).toHaveCSS('background-color', 'rgb(0, 0, 0)')
    await expect(notice.locator(':scope > div')).toHaveCSS(
      'background-color',
      'rgb(24, 24, 24)',
    )
    await expect(notice).toHaveCSS('text-align', 'center')
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true)

    const control = page.locator('summary:visible').filter({ hasText: 'Tweaks' })
    await expect(control).toBeVisible()
    const [body, button] = await Promise.all([
      notice.locator('p').boundingBox(),
      control.boundingBox(),
    ])
    expect(body).not.toBeNull()
    expect(button).not.toBeNull()
    expect(body!.y + body!.height).toBeLessThanOrEqual(button!.y)

    if (width === 390 || width === 1440) {
      // Capture the control as well as the notice so overlap is visible in review.
      await page.screenshot({ path: testInfo.outputPath('hemp-notice.png') })
      await notice.screenshot({ path: testInfo.outputPath('hemp-notice-element.png') })
    }
  })
}
