import { describe, expect, it, vi } from 'vitest'
import { checkWebsiteBlog } from '../../scripts/check-website-blog.mjs'
const env = { DEPLOY_URL: 'https://site.example.com', COMMIT_SHA: 'a'.repeat(40) }
const healthy = () =>
  Response.json(
    { status: 'ok', commit: env.COMMIT_SHA, checks: { blog: 'ok' } },
    { headers: { 'Cache-Control': 'no-store' } },
  )
describe('website blog deployment check', () => {
  it('requires no-store, the expected commit and healthy blog status', async () => {
    const request = vi.fn().mockResolvedValueOnce(healthy())
    await checkWebsiteBlog(env, { request, attempts: 1 })
    expect(request.mock.calls[0][1]).toMatchObject({
      redirect: 'error',
      cache: 'no-store',
    })
    for (const response of [
      Response.json({ status: 'ok', commit: env.COMMIT_SHA, checks: { blog: 'ok' } }),
      Response.json(
        { status: 'ok', commit: 'b'.repeat(40), checks: { blog: 'ok' } },
        { headers: { 'Cache-Control': 'no-store' } },
      ),
      Response.json(
        { status: 'ok', commit: env.COMMIT_SHA, checks: { d1: 'ok' } },
        { headers: { 'Cache-Control': 'no-store' } },
      ),
      new Response('x'.repeat(16_001)),
    ])
      await expect(
        checkWebsiteBlog(env, {
          request: vi.fn().mockResolvedValue(response),
          attempts: 1,
        }),
      ).rejects.toThrow('readiness')
  })
})
