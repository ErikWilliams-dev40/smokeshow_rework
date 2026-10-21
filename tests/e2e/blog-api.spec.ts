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
  await page.goto('/blog')
  await expect(page.getByText('Unapproved test copy')).toHaveCount(0)
  await page.getByRole('link', { name: 'API test article' }).click()
  await expect(page).toHaveTitle('API test article | Smoke Show Labs')
  await expect(
    page.getByText('<script>window.untrusted = true</script>', { exact: true }),
  ).toBeVisible()
  expect(await page.evaluate(() => 'untrusted' in window)).toBe(false)
  expect((await page.goto('/blog/unapproved-example'))?.status()).toBe(404)
  await expect(page.getByText('Unapproved test copy')).toHaveCount(0)
  expect((await page.goto('/blog/missing'))?.status()).toBe(404)
  expect((await page.goto('/blog/malformed-approved'))?.status()).toBe(503)
  const media = await request.get('/blog/media/logo')
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
  await page.goto('/blog?page=2')
  await expect(page.getByRole('link', { name: 'API test article' })).toBeVisible()
  await control('error')
  await page.getByRole('link', { name: 'API test article' }).click()
  await expect(
    page.getByRole('heading', { name: 'Articles are unavailable' }),
  ).toBeVisible()
  const response = await page.goto('/blog/uncached-outage')
  expect(response?.status()).toBe(503)
  expect(response?.headers()['cache-control']).toBe('no-store')
  await expect(
    page.getByRole('heading', { name: 'Articles are unavailable' }),
  ).toBeVisible()
  await expect(page).toHaveTitle('Blog | Smoke Show Labs')
  await page.goto('/blog?page=99')
  await expect(
    page.getByRole('heading', { name: 'Articles are unavailable' }),
  ).toBeVisible()
})

test('deadline covers a slow API and stalled image body', async ({ page, request }) => {
  await control('timeout')
  expect((await page.goto('/blog/uncached-timeout'))?.status()).toBe(503)
  await control('healthy')
  expect((await request.get('/blog/media/stall')).status()).toBe(503)
})

test('rejects redirected, oversized, unsupported and missing media', async ({
  request,
}) => {
  for (const id of ['redirect', 'oversize', 'svg'])
    expect((await request.get(`/blog/media/${id}`)).status()).toBe(503)
  expect((await request.get('/blog/media/missing')).status()).toBe(404)
})

test('valid articles reuse cache without a second upstream request', async ({
  request,
}) => {
  const path = `/blog/cache-example-${Date.now()}`
  expect((await request.get(path)).status()).toBe(200)
  expect((await request.get(path)).status()).toBe(200)
  const response = await fetch(`${stub}/__status`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const result = z.object({ requests: z.number() }).parse(await response.json())
  expect(result.requests).toBe(1)
})
