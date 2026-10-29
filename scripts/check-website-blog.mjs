import { pathToFileURL } from 'node:url'
import { setTimeout } from 'node:timers/promises'

export async function checkWebsiteBlog(
  env,
  { request = fetch, wait = setTimeout, attempts = 20 } = {},
) {
  const url = new URL('/api/health/blog', env.DEPLOY_URL)
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    !/^[a-f0-9]{40}$/.test(env.COMMIT_SHA ?? '')
  )
    throw new Error('Invalid website readiness configuration')
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await request(url, {
        redirect: 'error',
        cache: 'no-store',
        signal: AbortSignal.timeout(10_000),
      })
      const reader = response.body?.getReader()
      let text = '',
        size = 0
      if (reader)
        try {
          for (;;) {
            const { done, value } = await reader.read()
            if (done) break
            size += value.length
            if (size > 16_000) throw new Error('Oversized readiness response')
            text += new TextDecoder().decode(value)
          }
        } finally {
          await reader.cancel().catch(() => {})
          reader.releaseLock()
        }
      const body = JSON.parse(text)
      if (
        response.ok &&
        response.headers.get('cache-control') === 'no-store' &&
        body.status === 'ok' &&
        body.commit === env.COMMIT_SHA &&
        body.checks?.blog === 'ok'
      )
        return
    } catch {
      /* Retry propagation without response or credential logging. */
    }
    if (i + 1 < attempts) await wait(15_000)
  }
  throw new Error('Website blog readiness did not confirm the released API')
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  checkWebsiteBlog(process.env).catch(() => {
    console.error('Website blog readiness failed')
    process.exitCode = 1
  })
