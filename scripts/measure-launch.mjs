import { chromium } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
const base = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4187'
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] })
const results = []
for (const [name, path, consent] of [
  ['gate', '/', false],
  ['homepage', '/', true],
  ['blog', '/smokesignals', false],
  ['overview', '/wholesale-products', false],
  ['signup', '/wholesale', true],
]) {
  if (process.env.PERF_ROUTE && name !== process.env.PERF_ROUTE) continue
  for (let run = 1; run <= Number(process.env.PERF_RUNS ?? 3); run++) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      isMobile: true,
      reducedMotion: 'no-preference',
    })
    if (consent) await context.addCookies([{ name: 'ss_gate', value: '1', url: base }])
    await context.addInitScript(() => {
      sessionStorage.setItem('ss_intro_seen', '1')
      window.__lab = { lcp: 0, element: '', shifts: [] }
      new PerformanceObserver((list) => {
        for (const item of list.getEntries()) {
          window.__lab.lcp = item.startTime
          window.__lab.element =
            item.element?.tagName + ':' + (item.element?.className ?? '')
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true })
      new PerformanceObserver((list) => {
        for (const item of list.getEntries())
          if (!item.hadRecentInput)
            window.__lab.shifts.push({
              at: item.startTime,
              value: item.value,
              sources: item.sources.map((source) => ({
                element: source.node?.tagName + ':' + (source.node?.className ?? ''),
                before: source.previousRect.toJSON(),
                after: source.currentRect.toJSON(),
              })),
            })
      }).observe({ type: 'layout-shift', buffered: true })
    })
    const page = await context.newPage()
    const cdp = await context.newCDPSession(page)
    await cdp.send('Network.enable')
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150,
      downloadThroughput: 200000,
      uploadThroughput: 93750,
    })
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    const response = await page.goto(base + path, { waitUntil: 'load' })
    await page.waitForTimeout(5000)
    const measurement = await page.evaluate(() => {
      let max = 0,
        sum = 0,
        start = 0,
        previous = 0
      for (const shift of window.__lab.shifts) {
        if (shift.at - previous > 1000 || shift.at - start > 5000) {
          start = shift.at
          sum = 0
        }
        sum += shift.value
        previous = shift.at
        max = Math.max(max, sum)
      }
      const resources = performance.getEntriesByType('resource').map((r) => ({
        name: new URL(r.name).pathname,
        bytes: r.encodedBodySize,
        duration: Math.round(r.duration),
        kind: r.initiatorType,
      }))
      return {
        lcpMs: Math.round(window.__lab.lcp),
        lcpElement: window.__lab.element,
        shifts: window.__lab.shifts,
        cls: Number(max.toFixed(4)),
        jsBytes: resources
          .filter((r) => r.name.endsWith('.js'))
          .reduce((s, r) => s + r.bytes, 0),
        totalBytes: resources.reduce((s, r) => s + r.bytes, 0),
        largest: resources.sort((a, b) => b.bytes - a.bytes).slice(0, 5),
        overflow: document.documentElement.scrollWidth > innerWidth,
      }
    })
    results.push({ name, run, status: response.status(), ...measurement })
    console.log(name, run, measurement.lcpMs, measurement.cls, measurement.totalBytes)
    await context.close()
  }
}
await browser.close()
await writeFile(
  process.argv[2] ?? '/tmp/launch-performance.json',
  JSON.stringify(
    {
      measuredAt: new Date().toISOString(),
      profile: {
        viewport: '390x844',
        cpuSlowdown: 4,
        latencyMs: 150,
        downloadBytesPerSecond: 200000,
        cache: 'disabled',
        samplesPerRoute: Number(process.env.PERF_RUNS ?? 3),
        motion: 'normal',
        note: 'Local Worker laboratory measurement; not field Core Web Vitals.',
      },
      results,
    },
    null,
    2,
  ) + '\n',
)
