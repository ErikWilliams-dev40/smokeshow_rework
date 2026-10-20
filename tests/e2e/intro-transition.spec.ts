import { expect, test, type Page } from '@playwright/test'

test.use({ reducedMotion: 'no-preference' })
test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: 'ss_gate', value: '1', url: baseURL! }])
})

async function observeFade(page: Page, threshold = 0.95) {
  return page.locator('dialog').evaluate(
    (element: HTMLDialogElement, opacityThreshold) =>
      new Promise<{
        opacity: number
        open: boolean
        inert: boolean
        backdrop: string
        locked: boolean
      }>((resolve, reject) => {
        const deadline = performance.now() + 1500
        const sample = () => {
          const opacity = Number(getComputedStyle(element).opacity)
          if (opacity > 0 && opacity < opacityThreshold) {
            resolve({
              opacity,
              open: element.open,
              inert: !!document.querySelector('[inert]'),
              backdrop: getComputedStyle(element, '::backdrop').backgroundColor,
              locked: getComputedStyle(document.documentElement).overflow === 'hidden',
            })
          } else if (!element.open || performance.now() > deadline) {
            reject(new Error('Intro closed without an observable fade'))
          } else requestAnimationFrame(sample)
        }
        sample()
      }),
    threshold,
  )
}

for (const viewport of [
  { width: 1280, height: 800 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
]) {
  test(`intro reveals homepage at ${viewport.width}x${viewport.height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport)
    await page.goto('/')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toHaveAttribute('data-phase', 'showing')
    const smoke = dialog.locator('[data-renderer]')
    await expect(smoke).toHaveAttribute('data-renderer', 'webgl')
    await expect(smoke.locator('canvas')).toHaveCSS('opacity', '1')
    await expect(dialog.getByRole('button', { name: 'Skip intro' })).toBeInViewport({
      ratio: 1,
    })
    await expect(dialog.getByRole('heading')).toBeInViewport({ ratio: 1 })
    expect(
      await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth),
    ).toBe(true)
    await page.screenshot({ path: testInfo.outputPath('intro.png') })
    await expect(dialog).toHaveAttribute('data-phase', 'exiting')
    expect(await observeFade(page, 0.6)).toMatchObject({
      open: true,
      inert: true,
      backdrop: 'rgba(0, 0, 0, 0)',
      locked: true,
    })
    // Inert content must still paint beneath the transparent overlay.
    for (const selector of ['#home-title > span', '#menu-signup', 'header']) {
      await expect(page.locator(selector).first()).toHaveCSS('opacity', '1')
    }
    await page.screenshot({ path: testInfo.outputPath('mid-fade.png') })
    await expect(dialog).toBeHidden()
    await expect(page.locator('[inert]')).toHaveCount(0)
    await expect(page.locator('dialog canvas')).toHaveCount(0)
    await expect(page.locator('main [data-renderer]')).toHaveAttribute(
      'data-renderer',
      'webgl',
    )
    await expect(
      page.getByRole('textbox', { name: 'Email', exact: true }),
    ).toBeEnabled()
    await page.screenshot({ path: testInfo.outputPath('homepage.png') })
  })
}

for (const method of ['skip', 'escape'] as const) {
  test(`${method} fades quickly and repeated dismissal does not extend it`, async ({
    page,
  }) => {
    await page.goto('/wholesale')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toHaveAttribute('data-phase', 'showing')
    const started = Date.now()
    if (method === 'skip')
      await dialog.getByRole('button', { name: 'Skip intro' }).click()
    else await page.keyboard.press('Escape')
    expect(await observeFade(page)).toMatchObject({
      open: true,
      inert: true,
      locked: true,
    })
    await page.keyboard.press('Escape')
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    expect(Date.now() - started).toBeLessThan(650)
    await expect(page.locator('[inert]')).toHaveCount(0)
    await expect(
      page.getByRole('textbox', { name: 'Email', exact: true }),
    ).toBeEnabled()
  })
}

test('Escape shortens an automatic fade from its current opacity', async ({ page }) => {
  await page.goto('/')
  const dialog = page.getByRole('dialog')
  await expect(dialog).toHaveAttribute('data-phase', 'exiting')
  const before = (await observeFade(page)).opacity
  const started = Date.now()
  await page.keyboard.press('Escape')
  const after = await page
    .locator('dialog')
    .evaluate((element) => Number(getComputedStyle(element).opacity))
  expect(after).toBeLessThanOrEqual(before)
  await expect(dialog).toBeHidden()
  expect(Date.now() - started).toBeLessThan(500)
})

test('reduced motion during the fade closes immediately', async ({ page }) => {
  await page.goto('/')
  const dialog = page.getByRole('dialog')
  await expect(dialog).toHaveAttribute('data-phase', 'exiting')
  await observeFade(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(dialog).toBeHidden({ timeout: 300 })
  await expect(page.locator('[inert]')).toHaveCount(0)
})

test('fallback timer releases the page if transitionend is lost', async ({ page }) => {
  await page.goto('/')
  const dialog = page.getByRole('dialog')
  await expect(dialog).toHaveAttribute('data-phase', 'showing')
  await dialog.evaluate((element) => {
    element.addEventListener('transitionend', (event) =>
      event.stopImmediatePropagation(),
    )
  })
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden({ timeout: 1000 })
  await expect(page.locator('[inert]')).toHaveCount(0)
})

test('unavailable storage and WebGL retain the haze and usable destination', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'sessionStorage', {
      get() {
        throw new DOMException('Blocked', 'SecurityError')
      },
    })
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: Parameters<typeof original>
    ) {
      if (String(args[0]).startsWith('webgl')) return null
      return original.apply(this, args)
    } as typeof original
  })
  await page.goto('/')
  const dialog = page.getByRole('dialog')
  await expect(dialog).toHaveAttribute('data-phase', 'showing')
  const smoke = dialog.locator('[data-renderer]')
  await expect(smoke).toHaveAttribute('data-renderer', 'fallback')
  expect(
    await smoke.evaluate(
      (element) => getComputedStyle(element, '::before').backgroundImage,
    ),
  ).toContain('radial-gradient')
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await page
    .getByRole('textbox', { name: 'Email', exact: true })
    .fill('buyer@example.com')
  await page.getByRole('button', { name: 'Go', exact: true }).click()
  await expect(
    page.getByRole('textbox', { name: 'Your name', exact: true }),
  ).toBeFocused()
})
