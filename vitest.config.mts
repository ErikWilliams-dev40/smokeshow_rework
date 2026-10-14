import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      // `server-only` throws outside React Server Components; alias it to a
      // no-op so server modules can be unit-tested. See tests/setup/server-only.ts.
      'server-only': fileURLToPath(
        new URL('./tests/setup/server-only.ts', import.meta.url),
      ),
    },
  },
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/guards/**/*.test.ts'],
    environment: 'node',
  },
})
