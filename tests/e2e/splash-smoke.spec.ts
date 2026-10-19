import { expect, test } from '@playwright/test'

declare global {
  interface Window {
    smokeProbe: { draws: number; time: number; shifts: number }
  }
}

test.beforeEach(async ({ context, baseURL, page }) => {
  await context.addCookies([{ name: 'ss_gate', value: '1', url: baseURL! }])
  await page.addInitScript(() => {
    sessionStorage.setItem('ss_intro_seen', '1')
    window.smokeProbe = { draws: 0, time: -1, shifts: 0 }
    // Observe actual GPU submissions, including an accidental background loop.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const draw = WebGLRenderingContext.prototype.drawArrays
    WebGLRenderingContext.prototype.drawArrays = function (...args) {
      if ((this.canvas as HTMLCanvasElement).closest('main')) window.smokeProbe.draws++
      return draw.apply(this, args)
    }
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const uniform = WebGLRenderingContext.prototype.uniform1f
    WebGLRenderingContext.prototype.uniform1f = function (...args) {
      if ((this.canvas as HTMLCanvasElement).closest('main'))
        window.smokeProbe.time = args[1]
      return uniform.apply(this, args)
    }
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & {
          value: number
          hadRecentInput: boolean
        }
        if (!shift.hadRecentInput) window.smokeProbe.shifts += shift.value
      }
    }).observe({ type: 'layout-shift', buffered: true })
  })
})

for (const viewport of [
  { width: 1280, height: 800 },
  { width: 390, height: 844 },
]) {
  test.describe(`${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport, deviceScaleFactor: 3 })

    test('reduced motion stays static at t=8, fits the hero, and adds no shifts', async ({
      page,
    }, testInfo) => {
      await page.goto('/')
      const canvas = page.locator('main canvas')
      await expect(canvas).toHaveAttribute('data-ready', 'true')
      await expect(page.locator('#home-title')).toHaveAccessibleName(
        'STOCK UP. STAND OUT.',
      )
      // Font loading can resize the hero; each new size needs a fresh still frame.
      await page.evaluate(async () => {
        await document.fonts.ready
        await new Promise((resolve) => requestAnimationFrame(resolve))
        await new Promise((resolve) => requestAnimationFrame(resolve))
      })
      const initial = await page.evaluate(() => window.smokeProbe)
      expect(initial.time).toBe(8)
      expect(initial.draws).toBeGreaterThan(0)
      await page.waitForTimeout(400)
      expect(await page.evaluate(() => window.smokeProbe.draws)).toBe(initial.draws)
      expect(await page.evaluate(() => window.smokeProbe.shifts)).toBe(initial.shifts)
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBe(true)
      const dimensions = await canvas.evaluate((element: HTMLCanvasElement) => {
        const rect = element.getBoundingClientRect()
        return {
          width: element.width,
          height: element.height,
          cssWidth: rect.width,
          cssHeight: rect.height,
          animations: element.getAnimations().length,
          attributes: element.getContext('webgl')?.getContextAttributes(),
        }
      })
      expect(dimensions.width).toBeLessThanOrEqual(
        Math.round(dimensions.cssWidth * 1.5),
      )
      expect(dimensions.height).toBeLessThanOrEqual(
        Math.round(dimensions.cssHeight * 1.5),
      )
      expect(dimensions.width).toBeGreaterThanOrEqual(Math.round(dimensions.cssWidth))
      expect(dimensions.height).toBeGreaterThanOrEqual(Math.round(dimensions.cssHeight))
      expect(dimensions.animations).toBe(0)
      expect(dimensions.attributes).toMatchObject({
        alpha: true,
        premultipliedAlpha: true,
        antialias: false,
      })
      await page.screenshot({ path: testInfo.outputPath('reduced-motion.png') })
    })
  })
}

test('hidden tabs stop GPU work; returning resumes, and unmount releases the context', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  const smoke = page.locator('main [data-renderer]')
  await expect(smoke).toHaveAttribute('data-motion', 'running')
  await expect
    .poll(() => page.evaluate(() => window.smokeProbe.draws))
    .toBeGreaterThan(2)
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(smoke).toHaveAttribute('data-motion', 'paused')
  const paused = await page.evaluate(() => window.smokeProbe.draws)
  await page.waitForTimeout(200)
  expect(await page.evaluate(() => window.smokeProbe.draws)).toBe(paused)
  await page.evaluate(() => {
    Reflect.deleteProperty(document, 'hidden')
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect
    .poll(() => page.evaluate(() => window.smokeProbe.draws))
    .toBeGreaterThan(paused)
  const gl = await smoke
    .locator('canvas')
    .evaluateHandle((canvas: HTMLCanvasElement) => canvas.getContext('webgl'))
  await page.getByRole('link', { name: '01 / Flower' }).click()
  await expect(page).toHaveURL(/\/wholesale$/)
  await expect.poll(() => gl.evaluate((context) => context?.isContextLost())).toBe(true)
  await gl.dispose()
})
