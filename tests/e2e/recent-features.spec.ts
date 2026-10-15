import { expect, test as base, type Locator, type Page } from '@playwright/test'

const test = base.extend<{ runtimeErrors: string[] }>({
  runtimeErrors: [
    async ({ page }, use) => {
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      await use(errors)
      expect(errors).toEqual([])
    },
    { auto: true },
  ],
})

async function fillContact(form: Locator) {
  await form
    .getByRole('textbox', { name: 'Your name', exact: true })
    .fill('Jordan Reyes')
  await form
    .getByRole('textbox', { name: 'Phone', exact: true })
    .fill('+1 (213) 555-0123')
}

async function noOverflow(page: Page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true)
}

test.describe('server consent and no-JavaScript fallback', () => {
  test.use({ javaScriptEnabled: false })
  for (const route of ['/', '/wholesale']) {
    test(`refusal and acceptance preserve ${route}`, async ({
      page,
      context,
      baseURL,
    }) => {
      await page.goto(route)
      await expect(
        page.getByRole('heading', { name: 'Are you 21 or older?' }),
      ).toBeVisible()
      await page.getByRole('link', { name: 'No', exact: true }).click()
      await expect(page.getByRole('status')).toContainText('aged 21 and over')
      expect(
        (await context.cookies()).some((cookie) => cookie.name === 'ss_gate'),
      ).toBe(false)
      await page.getByRole('button', { name: 'Yes, I’m 21+' }).click()
      await expect(page).toHaveURL(new URL(route, baseURL).href)
      const cookie = (await context.cookies()).find((item) => item.name === 'ss_gate')
      expect(cookie?.httpOnly).toBe(true)
      expect(cookie?.sameSite).toBe('Lax')
      await expect(page.locator('[inert]')).toHaveCount(0)
      await expect(page.getByRole('link', { name: 'email our team' })).toHaveAttribute(
        'href',
        /^mailto:/,
      )
      await expect(
        page.getByRole('textbox', { name: 'Email', exact: true }),
      ).toBeDisabled()
      await expect(page.locator('form button[type="submit"]:visible')).toBeDisabled()
    })
  }
})

test.describe('consented frontend', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await context.addCookies([{ name: 'ss_gate', value: '1', url: baseURL! }])
  })

  test('reduced motion bypasses the intro for the rest of the session', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(
      page.getByRole('textbox', { name: 'Email', exact: true }),
    ).toBeEnabled()
    await expect(page.getByRole('dialog')).toBeHidden()
    expect(await page.evaluate(() => sessionStorage.getItem('ss_intro_seen'))).toBe('1')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/wholesale')
    await expect(
      page.getByRole('textbox', { name: 'Email', exact: true }),
    ).toBeEnabled()
    await expect(page.getByRole('dialog')).toBeHidden()
  })

  for (const route of ['/', '/wholesale']) {
    test(`${route}: validation, retained details and truthful verification previews`, async ({
      page,
    }) => {
      const submissions: string[] = []
      page.on('request', (request) => {
        if (request.method() === 'POST') submissions.push(request.url())
      })
      await page.goto(route)
      const scope = route === '/' ? page.locator('#menu-signup') : page.locator('main')
      const email = scope.getByRole('textbox', { name: 'Email', exact: true })
      const submit = scope.getByRole('button', { name: 'Preview email verification' })
      if (route === '/') {
        await scope.getByRole('button', { name: 'Go', exact: true }).click()
        await expect(scope.getByRole('alert')).toBeFocused()
        await email.fill('buyer@example.com')
        await expect(scope.getByRole('alert')).toHaveCount(0)
        await scope.getByRole('button', { name: 'Go', exact: true }).click()
        await expect(
          scope.getByRole('textbox', { name: 'Your name', exact: true }),
        ).toBeFocused()
        await expect(scope.getByRole('textbox')).toHaveCount(2)
      } else {
        await expect(scope.getByRole('textbox')).toHaveCount(3)
        await email.fill('buyer@example.com')
      }
      await submit.click()
      await expect(scope.getByRole('alert')).toBeFocused()
      await expect(scope.getByRole('alert')).toContainText('Enter your name.')
      await fillContact(scope)
      await expect(scope.getByRole('alert')).toHaveCount(0)
      if (route === '/') {
        await scope.getByRole('button', { name: 'Change email' }).click()
        await expect(email).toBeFocused()
        await scope.getByRole('button', { name: 'Go', exact: true }).click()
        await expect(
          scope.getByRole('textbox', { name: 'Phone', exact: true }),
        ).toHaveValue('+1 (213) 555-0123')
      }
      await submit.click()
      await expect(
        scope.getByRole('heading', { name: 'Check your inbox — preview' }),
      ).toBeVisible()
      await expect(
        scope.getByText('No email has been sent in this preview.'),
      ).toBeVisible()
      await expect(
        scope.getByRole('link', { name: 'contact our team' }),
      ).toHaveAttribute('href', /^mailto:/)
      await scope.getByRole('button', { name: 'Preview resend', exact: true }).click()
      await expect(
        scope.getByRole('status').filter({ hasText: 'Resend preview only' }),
      ).toBeVisible()
      await scope.getByRole('button', { name: 'Preview verified state' }).click()
      await expect(
        scope.getByRole('heading', { name: 'Verification complete — preview' }),
      ).toBeVisible()
      await expect(
        scope.getByText('No address has actually been verified', { exact: false }),
      ).toBeVisible()
      await scope.getByRole('button', { name: 'Edit details' }).click()
      await expect(
        scope.getByRole('textbox', { name: 'Your name', exact: true }),
      ).toHaveValue('Jordan Reyes')
      await submit.click()
      await expect(
        scope.getByRole('heading', { name: 'Check your inbox — preview' }),
      ).toBeVisible()
      await scope.getByRole('button', { name: 'Start again' }).click()
      await expect(email).toHaveValue('')
      expect(
        await page.evaluate(() => sessionStorage.getItem('ss_wholesale_draft')),
      ).toBeNull()
      expect(page.url()).not.toContain('buyer')
      expect(submissions).toEqual([])
    })
  }

  test('category intent is visible, removable and cleared after start again', async ({
    page,
  }) => {
    await page.goto('/')
    await page.getByRole('link', { name: '01 / Flower' }).click()
    await expect(page.getByText('Interested in Flower', { exact: true })).toBeVisible()
    expect(
      await page.evaluate(() => sessionStorage.getItem('ss_wholesale_draft')),
    ).toBeNull()
    await page
      .getByRole('textbox', { name: 'Email', exact: true })
      .fill('buyer@example.com')
    await fillContact(page.locator('main'))
    await page.getByRole('button', { name: 'Preview email verification' }).click()
    await expect(page.locator('dd').filter({ hasText: /^Flower$/ })).toBeVisible()
    await page.getByRole('button', { name: 'Edit details' }).click()
    await expect(page.getByText('Interested in Flower', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Preview email verification' }).click()
    await page.getByRole('button', { name: 'Start again' }).click()
    await expect(page.getByRole('button', { name: 'Remove interest' })).toHaveCount(0)
    await page.getByRole('link', { name: 'Back to Smoke Show' }).click()
    await page.getByRole('link', { name: 'Ask about Helix' }).click()
    await expect(
      page.getByText('Interested in HOUSE OF HELIX Peptide Strips', { exact: true }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Remove interest' }).click()
    await expect(
      page.getByRole('textbox', { name: 'Email', exact: true }),
    ).toBeFocused()
    await page.reload()
    await expect(page.getByRole('button', { name: 'Remove interest' })).toHaveCount(0)
  })

  test('mobile navigation closes on Escape, section selection and desktop resize', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    const toggle = page.locator('#menu-toggle')
    const menu = page.getByRole('navigation', { name: 'Mobile navigation' })
    await toggle.click()
    await page.keyboard.press('Escape')
    await expect(toggle).toBeFocused()
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await toggle.click()
    await menu.getByRole('link', { name: 'Products', exact: true }).click()
    await expect(menu).toBeHidden()
    await expect(page.locator('#products')).toBeFocused()
    await toggle.click()
    await page.setViewportSize({ width: 1280, height: 800 })
    await expect(menu).toBeHidden()
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await toggle.click()
    await page
      .getByText('For retailers. For distributors. For your next move.', {
        exact: true,
      })
      .click()
    await expect(menu).toBeHidden()
  })

  test('desktop signup is above the fold; forms and previews fit narrow screens', async ({
    page,
  }, testInfo) => {
    await page.goto('/')
    for (const [width, height] of [
      [1280, 800],
      [1366, 768],
      [1280, 600],
    ] as const) {
      await page.setViewportSize({ width, height })
      await noOverflow(page)
      const box = await page
        .getByRole('button', { name: 'Go', exact: true })
        .boundingBox()
      expect(box).not.toBeNull()
      expect(box!.y + box!.height).toBeLessThanOrEqual(height)
    }
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.screenshot({
      path: testInfo.outputPath('homepage-1280.png'),
      fullPage: true,
    })
    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 844 })
      for (const route of ['/', '/wholesale']) {
        await page.goto(route)
        await noOverflow(page)
        if (width === 390)
          await page.screenshot({
            path: testInfo.outputPath(
              `${route === '/' ? 'home' : 'wholesale'}-390.png`,
            ),
            fullPage: true,
          })
        await page
          .getByRole('textbox', { name: 'Email', exact: true })
          .fill('buyer@example.com')
        if (route === '/')
          await page.getByRole('button', { name: 'Go', exact: true }).click()
        await fillContact(page.locator('main'))
        await page.getByRole('button', { name: 'Preview email verification' }).click()
        await expect(
          page.getByRole('heading', { name: 'Check your inbox — preview' }),
        ).toBeVisible()
        await noOverflow(page)
      }
    }
  })

  test('storage restrictions still allow the inquiry preview', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'sessionStorage', {
        get() {
          throw new DOMException('Blocked', 'SecurityError')
        },
      })
    })
    await page.goto('/')
    await page.getByRole('link', { name: 'Ask about Helix' }).click()
    await page
      .getByRole('textbox', { name: 'Email', exact: true })
      .fill('buyer@example.com')
    await fillContact(page.locator('main'))
    await page.getByRole('button', { name: 'Preview email verification' }).click()
    await expect(
      page.getByRole('heading', { name: 'Check your inbox — preview' }),
    ).toBeVisible()
  })

  test.describe('intro and motion', () => {
    test.use({ reducedMotion: 'no-preference' })

    test('skipping cancels the timer and never steals focus from the signup', async ({
      page,
    }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      await expect(page.locator('[inert]')).toHaveCount(1)
      await page.getByRole('button', { name: 'Skip intro' }).click()
      await expect(dialog).toBeHidden()
      const email = page.getByRole('textbox', { name: 'Email', exact: true })
      await email.fill('buyer@example.com')
      // Wait beyond the original intro deadline to catch a leftover timer.
      await page.waitForTimeout(3200)
      await expect(email).toBeFocused()
    })

    test('intro completes after three seconds and stays dismissed this session', async ({
      page,
    }) => {
      const started = Date.now()
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 6000 })
      expect(Date.now() - started).toBeGreaterThanOrEqual(2900)
      expect(await page.evaluate(() => sessionStorage.getItem('ss_intro_seen'))).toBe(
        '1',
      )
      await page.reload()
      await expect(
        page.getByRole('textbox', { name: 'Email', exact: true }),
      ).toBeEnabled()
      await expect(page.getByRole('dialog')).toBeHidden()
    })

    test('Escape and live reduced motion dismiss the intro', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).toBeHidden()
      await page.evaluate(() => sessionStorage.removeItem('ss_intro_seen'))
      await page.reload({ waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await expect(page.getByRole('dialog')).toBeHidden()
      await expect(page.locator('[inert]')).toHaveCount(0)
    })

    test('smoke freezes, resumes, pauses offscreen and honors reduced motion', async ({
      page,
    }) => {
      await page.addInitScript(() => sessionStorage.setItem('ss_intro_seen', '1'))
      await page.goto('/')
      const smoke = page.locator('main [data-renderer]')
      await expect(smoke).toHaveAttribute('data-renderer', 'webgl')
      await page.locator('summary:visible').filter({ hasText: 'Tweaks' }).click()
      const motion = page.getByRole('switch', { name: 'Motion', exact: true })
      await motion.uncheck()
      await expect(smoke).toHaveAttribute('data-motion', 'paused')
      const frozen = await smoke.locator('canvas').screenshot()
      await page.waitForTimeout(150)
      expect(await smoke.locator('canvas').screenshot()).toEqual(frozen)
      await motion.check()
      await expect(smoke).toHaveAttribute('data-motion', 'running')
      await page.waitForTimeout(500)
      expect(await smoke.locator('canvas').screenshot()).not.toEqual(frozen)
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await expect(smoke).toHaveAttribute('data-motion', 'paused')
      await expect(motion).toBeDisabled()
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      await page.locator('#contact').scrollIntoViewIfNeeded()
      await expect(smoke).toHaveAttribute('data-motion', 'paused')
      await page.locator('#home-title').scrollIntoViewIfNeeded()
      await expect(smoke).toHaveAttribute('data-motion', 'running')
      const loss = await smoke
        .locator('canvas')
        .evaluateHandle((canvas: HTMLCanvasElement) =>
          canvas.getContext('webgl2')?.getExtension('WEBGL_lose_context'),
        )
      expect(await loss.evaluate((extension) => !!extension)).toBe(true)
      await loss.evaluate((extension) => extension?.loseContext())
      await expect(smoke).toHaveAttribute('data-renderer', 'fallback')
      await expect(smoke).toHaveAttribute('data-motion', 'paused')
      await loss.evaluate((extension) => extension?.restoreContext())
      await expect(smoke).toHaveAttribute('data-renderer', 'webgl')
      await expect(smoke).toHaveAttribute('data-motion', 'running')
      await loss.dispose()
    })

    test('WebGL failure keeps a static background and a usable form', async ({
      page,
    }) => {
      await page.addInitScript(() => {
        sessionStorage.setItem('ss_intro_seen', '1')
        // Force only the WebGL renderer to fail, leaving normal canvas APIs intact.
        // Called with the actual canvas as `this` via apply below.
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
      await expect(page.locator('main [data-renderer]')).toHaveAttribute(
        'data-renderer',
        'fallback',
      )
      await page
        .getByRole('textbox', { name: 'Email', exact: true })
        .fill('buyer@example.com')
      await page.getByRole('button', { name: 'Go', exact: true }).click()
      await expect(
        page.getByRole('textbox', { name: 'Your name', exact: true }),
      ).toBeFocused()
    })
  })
})
