import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { checkWebsiteBlog } from './check-website-blog.mjs'
const site = 'https://smokeshow-web-staging-canary.dev40.workers.dev'
const api = 'https://smokeshow-blog-api-staging.dev40.workers.dev'
const get = (url, headers) =>
  fetch(url, { headers, redirect: 'error', signal: AbortSignal.timeout(10_000) })
try {
  switch (process.argv[2]) {
    case 'outage': {
      for (const path of [`/smokesignals/canary-${randomUUID()}`, '/api/health/blog']) {
        const response = await get(site + path)
        assert.equal(response.status, 503)
        assert.equal(response.headers.get('retry-after'), '60')
      }
      for (const path of ['/privacy', '/api/health'])
        assert.equal((await get(site + path)).status, 200)
      assert.equal((await get(site + '/sitemap.xml')).status, 200)
      break
    }
    case 'recovered':
      await checkWebsiteBlog({ DEPLOY_URL: site, COMMIT_SHA: process.env.COMMIT_SHA })
      break
    case 'throttle': {
      let denied = false
      // Bounded traffic to the canary's separate namespace, never the main site.
      for (let batch = 0; batch < 24 && !denied; batch++) {
        const responses = await Promise.all(
          Array.from({ length: 10 }, () =>
            get(site + '/smokesignals/media/canary-missing'),
          ),
        )
        for (const response of responses) {
          assert.ok([404, 429].includes(response.status))
          if (response.status === 429) {
            assert.equal(response.headers.get('retry-after'), '60')
            denied = true
          }
          await response.body?.cancel()
        }
      }
      assert.ok(denied, 'No rate-limit denial observed within bounded probe')
      break
    }
    case 'revoked':
      for (const token of [
        process.env.BLOG_EDITOR_TOKEN,
        process.env.BLOG_OWNER_TOKEN,
      ]) {
        assert.ok(token)
        assert.equal(
          (await get(api + '/admin/articles', { Authorization: `Bearer ${token}` }))
            .status,
          401,
        )
      }
      break
    default:
      throw new Error('Choose outage, recovered, throttle or revoked')
  }
  console.log(`Staging canary check passed: ${process.argv[2]}`)
} catch {
  console.error('Staging canary check failed')
  process.exitCode = 1
}
