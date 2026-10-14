import 'server-only'

import { env } from 'cloudflare:workers'

/**
 * The only module that knows how the app reaches its Cloudflare bindings.
 * Everything else asks for `getEnv()` so the adapter can change in one place
 * (see docs/decisions/0001). `Env` is generated from cloudflare.config.ts into
 * .cloudflare/types at build time.
 */
export function getEnv(): Env {
  return env
}
