import { bindings, defineConfig, defineWorker } from 'cf/config'

/**
 * Worker configuration for every environment. The mode comes from Vite
 * (`vite build --mode staging|production`). Any other mode resolves to local:
 * `vite dev`, and `pnpm build:local` (`--mode local-preview`, because Vite
 * reserves `local`) for `vite preview`. Bare `vite build` is production mode,
 * so it binds the production ids. Bindings do not inherit between modes, so each one
 * is declared once here and parameterised below. See docs/decisions/0001.
 *
 * D1 ids: the local id is a fixed placeholder that `pnpm db:migrate:local`
 * targets in .cloudflare/state. Staging and production ids come from
 * `cf d1 create` once the account exists and replace the placeholders in a
 * small follow-up PR.
 */
const D1_IDS = {
  local: '00000000-0000-4000-8000-000000000001',
  staging: 'REPLACE-WITH-cf-d1-create-staging',
  production: 'REPLACE-WITH-cf-d1-create-production',
} as const

type Mode = keyof typeof D1_IDS

function resolveMode(mode: string | undefined): Mode {
  return mode === 'staging' || mode === 'production' ? mode : 'local'
}

export default defineConfig((ctx) => {
  const mode = resolveMode(ctx.mode)
  const suffix = mode === 'production' ? '' : `-${mode}`

  return {
    worker: defineWorker({
      name: `smokeshow-web${suffix}`,
      entrypoint: 'vinext/server/fetch-handler',
      // Must not exceed the date the installed workerd supports, or the local
      // runtime refuses to start. Raise it together with the toolchain.
      compatibilityDate: '2026-10-07',
      compatibilityFlags: ['nodejs_compat'],
      assets: {
        htmlHandling: 'none',
        notFoundHandling: 'none',
        runWorkerFirst: ['/*', '!/_next/static/*', '!/*/_next/static/*'],
      },
      env: {
        ASSETS: bindings.assets(),

        // Lead records. One database per environment; migrations in ./migrations.
        DB: bindings.d1({ name: `smokeshow-leads${suffix}`, id: D1_IDS[mode] }),

        // Sales notification and buyer acknowledgment. Staging may only send
        // to the test inbox so a staging bug can never email a real buyer.
        EMAIL:
          mode === 'production'
            ? bindings.sendEmail()
            : bindings.sendEmail({
                destinationAddress: 'staging-leads@example.invalid',
              }),

        // Signup throttle, keyed per client IP in code. Period must be 10 or 60.
        LEAD_RATE: bindings.rateLimit({
          namespace: mode === 'production' ? '1002' : '1001',
          simple: { limit: 5, period: 60 },
        }),

        // Plain configuration. Real addresses are filled in when the client
        // confirms the sales inbox and sending domain.
        SITE_URL: bindings.text(
          mode === 'production' ? 'https://smokeshowlabs.com' : 'http://localhost:4173',
        ),
        SALES_INBOX: bindings.text(''),
        MAIL_FROM: bindings.text(''),

        // Secrets: set with `cf workers secrets update`; local values in .dev.vars.
        LEAD_TOKEN_SECRET: bindings.secret(),
        CSV_EXPORT_USER: bindings.secret(),
        CSV_EXPORT_PASSWORD: bindings.secret(),
      },
    }),
  }
})
