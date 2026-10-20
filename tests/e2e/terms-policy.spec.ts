import { readFileSync } from 'node:fs'

import { expect, test } from '@playwright/test'

const suppliedPolicy = readFileSync(
  new URL('../../src/content/termsOfWebsite.txt', import.meta.url),
  'utf8',
)
  .replace(/\r\n/g, '\n')
  .replace(/^#{1,3} /gm, '')
  .replace(/^- /gm, '')
  .replace(/^---$/gm, '')
  .replace(/\*/g, '')

function normalize(text: string) {
  return text.replace(/\s+/g, ' ').trim()
}

test.describe('public terms policy', () => {
  test.use({ javaScriptEnabled: false })

  test('preserves the complete supplied policy without requiring consent', async ({
    page,
    context,
  }) => {
    const response = await page.goto('/terms')
    expect(response?.status()).toBe(200)
    const main = page.getByRole('main')
    expect(normalize(await main.innerText())).toBe(
      normalize(`SMOKE SHOW LABS ${suppliedPolicy}`),
    )
    await expect(main.getByRole('heading', { level: 1 })).toHaveText(
      'TERMS OF WEBSITE USE',
    )
    await expect(main.getByRole('heading', { level: 2 })).toHaveCount(16)
    await expect(main.locator('time')).toHaveAttribute('datetime', '2026-10-19')
    await expect(main.locator('em')).toHaveCount(6)
    await expect(main.getByRole('list')).toHaveCount(1)
    await expect(main.getByRole('listitem')).toHaveCount(7)
    const emailLinks = main.getByRole('link', { name: 'info@smokeshowlabs.com' })
    await expect(emailLinks).toHaveCount(1)
    for (const link of await emailLinks.all()) {
      await expect(link).toHaveAttribute('href', 'mailto:info@smokeshowlabs.com')
    }
    await expect(
      main.getByRole('link', { name: 'https://smokeshowlabs.com' }),
    ).toHaveAttribute('href', 'https://smokeshowlabs.com')
    await expect(page).toHaveTitle('Terms of Website Use · Smoke Show Labs')
    expect(
      await page.locator('meta[name="robots"]').getAttribute('content'),
    ).not.toContain('noindex')
    await expect(main.getByRole('note')).toHaveCount(0)
    await expect(
      page.getByRole('heading', { name: 'Are you 21 or older?' }),
    ).toHaveCount(0)
    expect((await context.cookies()).some((cookie) => cookie.name === 'ss_gate')).toBe(
      false,
    )
    await page.keyboard.press('Tab')
    await expect(
      main.getByRole('link', { name: 'Smoke Show Labs', exact: true }),
    ).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(
      main.getByRole('link', { name: 'https://smokeshowlabs.com' }),
    ).toBeFocused()
  })
})

for (const width of [320, 390, 1440]) {
  test(`terms footer link and page fit at ${width}px`, async ({
    page,
    context,
    baseURL,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await context.addCookies([{ name: 'ss_gate', value: '1', url: baseURL! }])
    await page.addInitScript(() => sessionStorage.setItem('ss_intro_seen', '1'))
    await page.goto('/')
    const link = page
      .getByRole('navigation', { name: 'Legal', exact: true })
      .getByRole('link', { name: 'Terms', exact: true })
    await link.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/terms$/)
    await page.evaluate(() => document.fonts.ready)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true)
    await page.screenshot({
      path: testInfo.outputPath('terms-policy.png'),
      fullPage: true,
    })
  })
}
