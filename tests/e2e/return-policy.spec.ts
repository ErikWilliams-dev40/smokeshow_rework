import { readFileSync } from 'node:fs'

import { expect, test } from '@playwright/test'

import { salesContact } from '@/content/splash'

const { phone } = salesContact
const suppliedPolicy = readFileSync(
  new URL('../../src/content/return_policy.txt', import.meta.url),
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

test('complete final policy is publicly readable without JavaScript or consent', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL })
  const page = await context.newPage()
  try {
    const response = await page.goto('/returns')
    expect(response?.status()).toBe(200)
    const main = page.getByRole('main')
    expect(normalize(await main.innerText())).toBe(
      normalize(`SMOKE SHOW LABS ${suppliedPolicy}`),
    )
    await expect(main.getByRole('heading', { level: 1 })).toHaveText(
      'RETURN & EXCHANGE POLICY',
    )
    await expect(main.getByRole('heading', { level: 2 })).toHaveCount(10)
    await expect(main.getByRole('list')).toHaveCount(2)
    await expect(main.getByRole('listitem')).toHaveCount(8)
    await expect(main.locator('em')).toHaveCount(6)
    for (const emphasis of await main.locator('em').all()) {
      await expect(emphasis).toHaveCSS('font-weight', '600')
    }
    await expect(main.locator('time')).toHaveAttribute('datetime', '2026-10-19')
    await expect(
      main.getByRole('link', { name: 'info@smokeshowlabs.com' }),
    ).toHaveCount(2)
    for (const link of await main
      .getByRole('link', { name: 'info@smokeshowlabs.com' })
      .all()) {
      await expect(link).toHaveAttribute('href', 'mailto:info@smokeshowlabs.com')
    }
    await expect(
      main.getByRole('link', { name: 'https://smokeshowlabs.com' }),
    ).toHaveAttribute('href', 'https://smokeshowlabs.com')
    await expect(page).toHaveTitle('Return & Exchange Policy | Smoke Show Labs')
    expect(await page.locator('meta[name="robots"]').getAttribute('content')).toContain(
      'noindex',
    )
    await expect(
      page.getByRole('heading', { name: 'Are you 21 or older?' }),
    ).toHaveCount(0)
    await expect(main.getByRole('note')).toHaveCount(0)
    // The site-wide phone strip is body's first child, so it owns the first
    // Tab stop, followed by the public header and breadcrumb links.
    const call = page.getByRole('link', { name: `Call sales at ${phone.display}` })
    await page.keyboard.press('Tab')
    await expect(call).toBeFocused()
    for (const link of await page.getByRole('banner').getByRole('link').all()) {
      await page.keyboard.press('Tab')
      await expect(link).toBeFocused()
    }
    await page.keyboard.press('Tab')
    await expect(
      page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link'),
    ).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(
      main.getByRole('link', { name: 'Smoke Show Labs', exact: true }),
    ).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(
      main.getByRole('link', { name: 'info@smokeshowlabs.com' }).first(),
    ).toBeFocused()
    expect((await context.cookies()).some((cookie) => cookie.name === 'ss_gate')).toBe(
      false,
    )
  } finally {
    await context.close()
  }
})

for (const width of [320, 390, 1440]) {
  test(`footer navigation and return policy fit at ${width}px`, async ({
    page,
    context,
    baseURL,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await context.addCookies([{ name: 'ss_gate', value: '1', url: baseURL! }])
    await page.addInitScript(() => sessionStorage.setItem('ss_intro_seen', '1'))
    await page.goto('/')
    const legal = page.getByRole('navigation', { name: 'Legal', exact: true })
    await expect(legal.getByRole('link')).toHaveText([
      'Privacy',
      'Terms',
      'Shipping Policy',
      'Return Policy',
    ])
    await legal.scrollIntoViewIfNeeded()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true)
    const returnsLink = legal.getByRole('link', { name: 'Return Policy' })
    await returnsLink.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/returns$/)
    await page.evaluate(() => document.fonts.ready)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true)
    await page.screenshot({
      path: testInfo.outputPath('return-policy.png'),
      fullPage: true,
    })
  })
}
