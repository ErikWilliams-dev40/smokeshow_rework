import 'server-only'

import { env, waitUntil } from 'cloudflare:workers'

/**
 * The only module that knows how the app reaches its Cloudflare bindings.
 * Everything else asks for `getEnv()` so the adapter can change in one place
 * (see docs/decisions/0001). `Env` is generated from cloudflare.config.ts into
 * .cloudflare/types at build time.
 */
export function getEnv(): Env {
  return env
}

/** Durable persistence happens first; failures are recovered by the outbox cron. */
export function scheduleBackground(work: Promise<unknown>): void {
  waitUntil(work.catch(() => console.error('Background lead delivery unavailable')))
}
