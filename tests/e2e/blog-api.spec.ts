import { expect, test } from '@playwright/test'
import { z } from 'zod'
const stub = process.env.BLOG_STUB_URL
const token = process.env.BLOG_STUB_TOKEN

test.skip(!stub || !token, 'Run with pnpm test:blog-api')
test.describe.configure({ mode: 'serial' })

async function control(mode: string) {
  const response = await fetch(`${stub}/__control?mode=${mode}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  expect(response.ok).toBe(true)
}

test.beforeEach(async () => {
  await control('healthy')
})

test('optional homepage failure does not hide a healthy article', async ({ page }) => {
  await control('homepage-error')
  const response = await page.goto('/smokesignals/healthy-without-homepage')
  expect(response?.status()).toBe(200)
  await expect(
    page.getByRole('heading', { name: 'API test article', exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open search' })).toBeVisible()
})

test('API auth, approval filtering, literal text, metadata and media', async ({
  page,
  request,
  baseURL,
}) => {
  const external: string[] = []
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== new URL(baseURL!).origin)
      external.push(request.url())
  })
  expect((await fetch(`${stub}/articles`)).status).toBe(401)
  await page.goto('/smokesignals')
  await expect(page.locator('main img')).toHaveAttribute('data-loaded', 'true')
  await expect(page.getByText('Unapproved test copy')).toHaveCount(0)
  await page.getByRole('link', { name: 'API test article' }).click()
  await expect(page).toHaveTitle('API test article | Smoke Show Labs')
  await expect(
    page.getByText('<script>window.untrusted = true</script>', { exact: true }),
  ).toBeVisible()
  expect(await page.evaluate(() => 'untrusted' in window)).toBe(false)
  expect((await page.goto('/smokesignals/unapproved-example'))?.status()).toBe(404)
  await expect(page.getByText('Unapproved test copy')).toHaveCount(0)
  expect((await page.goto('/smokesignals/missing'))?.status()).toBe(404)
  expect((await page.goto('/smokesignals/malformed-approved'))?.status()).toBe(503)
  const media = await request.get('/smokesignals/media/logo')
  expect(media.status()).toBe(200)
  expect(media.headers()['cache-control']).toContain('immutable')
  expect(media.headers()['set-cookie']).toBeUndefined()
  expect(external).toEqual([])
  expect(await page.content()).not.toContain(token!)
  const health = await request.get('/api/health')
  expect(health.status()).toBe(200)
  expect(health.headers()['cache-control']).toBe('no-store')
})

test('API outages produce actual 503 responses including navigation', async ({
  page,
}) => {
  await control('navigation')
  await page.goto('/smokesignals?page=2')
  await expect(page.getByRole('link', { name: 'API test article' })).toBeVisible()
  await control('error')
  await page.getByRole('link', { name: 'API test article' }).click()
  await expect(
    page.getByRole('heading', { name: 'Articles are unavailable' }),
  ).toBeVisible()
  const response = await page.goto('/smokesignals/uncached-outage')
  expect(response?.status()).toBe(503)
  expect(response?.headers()['cache-control']).toBe('no-store')
  await expect(
    page.getByRole('heading', { name: 'Articles are unavailable' }),
  ).toBeVisible()
  await expect(page).toHaveTitle('Smoke Signals | Smoke Show Labs')
  await page.goto('/smokesignals?page=99')
  await expect(
    page.getByRole('heading', { name: 'Articles are unavailable' }),
  ).toBeVisible()
})

test('deadline covers a slow API and stalled image body', async ({ page, request }) => {
  await control('timeout')
  expect((await page.goto('/smokesignals/uncached-timeout'))?.status()).toBe(503)
  await control('healthy')
  expect((await request.get('/smokesignals/media/stall')).status()).toBe(503)
})

test('rejects redirected, oversized, unsupported and missing media', async ({
  request,
}) => {
  for (const id of ['redirect', 'oversize', 'svg'])
    expect((await request.get(`/smokesignals/media/${id}`)).status()).toBe(503)
  expect((await request.get('/smokesignals/media/missing')).status()).toBe(404)
})

test('valid articles reuse cache without a second upstream request', async ({
  request,
}) => {
  const path = `/smokesignals/cache-example-${Date.now()}`
  expect((await request.get(path)).status()).toBe(200)
  const first = await fetch(`${stub}/__status`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const initial = z.object({ requests: z.number() }).parse(await first.json())
  expect((await request.get(path)).status()).toBe(200)
  const response = await fetch(`${stub}/__status`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const result = z.object({ requests: z.number() }).parse(await response.json())
  expect(result.requests).toBe(initial.requests)
  expect(initial.requests).toBeGreaterThanOrEqual(1)
})

test('API archive filters and search propagate without exposing drafts', async ({
  page,
}) => {
  await page.goto('/smokesignals?view=all&section=wholesale&q=API')
  await expect(page.locator('main article')).toHaveCount(1)
  await expect(page.getByText('Unapproved test copy')).toHaveCount(0)
  await page.goto('/smokesignals?view=all&section=flower&q=API')
  await expect(page.getByText('No articles yet on this page.')).toBeVisible()
})

test('failed cover media keeps the story readable with a neutral placeholder', async ({
  page,
}) => {
  await page.route('**/smokesignals/media/logo', (route) => route.abort())
  await page.goto('/smokesignals')
  await expect(
    page.getByRole('heading', { name: 'API test article', exact: true }),
  ).toBeVisible()
  await expect(
    page.locator('main [class*="storyImage"] [class*="placeholder"]'),
  ).toBeVisible()
  await expect(page.locator('main img')).toHaveCount(0)
})
