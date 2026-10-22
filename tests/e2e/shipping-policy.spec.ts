import { readFileSync } from 'node:fs'

import { expect, test } from '@playwright/test'

import { salesContact } from '@/content/splash'

const { phone } = salesContact

// The supplied file starts with an editorial label before the Markdown title.
const suppliedPolicy = readFileSync(
  new URL('../../src/content/shipping_policy.txt', import.meta.url),
  'utf8',
)
  .replace(/^revised shipping policy:\s*/, '')
  .replace(/\r\n/g, '\n')
  .replace(/^#{1,3} /gm, '')
  .replace(/^---$/gm, '')
  .replace(/\*/g, '')

function normalize(text: string) {
  return text.replace(/\s+/g, ' ').trim()
}

test.describe('public shipping policy', () => {
  test.use({ javaScriptEnabled: false })

  test('preserves the complete supplied policy without requiring consent', async ({
    page,
    context,
  }) => {
    const response = await page.goto('/shipping')
    expect(response?.status()).toBe(200)
    const main = page.getByRole('main')
    expect(normalize(await main.innerText())).toBe(
      normalize(`SMOKE SHOW LABS ${suppliedPolicy}`),
    )
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('SHIPPING POLICY')
    await expect(main.getByRole('heading', { level: 2 })).toHaveCount(8)
    await expect(main.locator('time')).toHaveAttribute('datetime', '2026-10-19')
    await expect(main.locator('em')).toHaveCount(4)
    await expect(
      main.getByRole('link', { name: 'info@smokeshowlabs.com' }),
    ).toHaveAttribute('href', 'mailto:info@smokeshowlabs.com')
    await expect(
      main.getByRole('link', { name: 'https://smokeshowlabs.com' }),
    ).toHaveAttribute('href', 'https://smokeshowlabs.com')
    await expect(page).toHaveTitle('Shipping Policy · Smoke Show Labs')
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
    // The site-wide phone strip is body's first child, so it owns the first
    // Tab stop; the policy's own links start on the second.
    const call = page.getByRole('link', { name: `Call sales at ${phone.display}` })
    await page.keyboard.press('Tab')
    await expect(call).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(
      main.getByRole('link', { name: 'Smoke Show Labs', exact: true }),
    ).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(
      main.getByRole('link', { name: 'info@smokeshowlabs.com' }),
    ).toBeFocused()
  })
})

for (const width of [320, 390, 1440]) {
  test(`shipping footer link and page fit at ${width}px`, async ({
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
      .getByRole('link', { name: 'Shipping Policy' })
    await link.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/shipping$/)
    await page.evaluate(() => document.fonts.ready)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true)
    await expect(page.locator('main')).toHaveCSS(
      'padding-left',
      width <= 560 ? '20px' : '56px',
    )
    await page.screenshot({
      path: testInfo.outputPath('shipping-policy.png'),
      fullPage: true,
    })
  })
}
