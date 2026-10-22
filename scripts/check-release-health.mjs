import { setTimeout } from 'node:timers/promises'
const [base, commit] = process.argv.slice(2)
if (!/^[a-f0-9]{40}$/.test(commit ?? '')) throw new Error('Full commit SHA required')
const url = new URL('/api/health', base)
if (url.protocol !== 'https:') throw new Error('HTTPS deployment URL required')
let healthy = false
for (let attempt = 1; attempt <= 20; attempt++) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      redirect: 'error',
    })
    const body = await response.json()
    if (
      response.ok &&
      body.status === 'ok' &&
      body.commit === commit &&
      body.checks?.d1 === 'ok'
    ) {
      healthy = true
      break
    }
  } catch {
    /* Retry transient propagation or network errors. */
  }
  if (attempt < 20) await setTimeout(15_000)
}
if (!healthy)
  throw new Error(
    'Release readiness failed: expected commit and healthy D1 not observed',
  )
console.log('Expected release and D1 readiness verified')
