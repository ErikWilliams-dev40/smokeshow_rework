import { bindings, defineConfig, defineWorker, triggers } from 'cf/config'

/**
 * Worker configuration for every environment. The mode comes from Vite
 * (`vite build --mode staging|production`). Any other mode resolves to local:
 * `vite dev`, and `pnpm build:local` (`--mode local-preview`, because Vite
 * reserves `local`) for `vite preview`. Bare `vite build` is production mode,
 * so it binds the production ids. Bindings do not inherit between modes, so each one
 * is declared once here and parameterised below. See docs/decisions/0001.
 *
 * D1 ids: the local id is a fixed placeholder that `pnpm db:migrate:local`
 * targets in .cloudflare/state. Staging is a design-only preview in the Dev40
 * account. Production remains unprovisioned. See README for staging commands.
 */
const D1_IDS = {
  local: '00000000-0000-4000-8000-000000000001',
  staging: process.env.DB_ID_STAGING || 'b98400fb-eae4-45db-ad1d-71c5d73ca22c',
  production: process.env.DB_ID_PRODUCTION || 'REPLACE-WITH-cf-d1-create-production',
} as const

type Mode = keyof typeof D1_IDS

function resolveMode(mode: string | undefined): Mode {
  return mode === 'staging' || mode === 'production' ? mode : 'local'
}

export default defineConfig((ctx) => {
  const mode = resolveMode(ctx.mode)
  const suffix = mode === 'production' ? '' : `-${mode}`

  return {
    accountId:
      process.env.CLOUDFLARE_ACCOUNT_ID ||
      (mode === 'staging' ? '8441cc5cfd234da96da8cdf090d94658' : undefined),
    worker: defineWorker({
      name: `smokeshow-web${suffix}`,
      entrypoint: './src/worker.ts',
      triggers: [
        triggers.scheduled({ schedule: '*/5 * * * *' }),
        ...(mode === 'production' && process.env.PRODUCTION_ZONE_ID
          ? [
              triggers.fetch({
                pattern: 'smokeshowlabs.com/*',
                zone: process.env.PRODUCTION_ZONE_ID,
              }),
            ]
          : []),
      ],
      // Must not exceed the date the installed workerd supports, or the local
      // runtime refuses to start. Raise it together with the toolchain.
      compatibilityDate: '2026-10-07',
      compatibilityFlags: ['nodejs_compat'],
      workersDev: mode !== 'production',
      observability:
        mode !== 'local'
          ? {
              enabled: true,
              redactQueryString: true,
              logs: { enabled: true },
              traces: { enabled: true, headSamplingRate: 0.01 },
            }
          : undefined,
      assets: {
        htmlHandling: 'none',
        notFoundHandling: 'none',
        runWorkerFirst: [
          '/*',
          '!/_next/static/*',
          '!/*/_next/static/*',
          // `vite dev` serves modules, CSS and the RSC browser entry itself.
          // With "/*" alone the Worker answers those with the app's 404.
          ...(mode === 'local'
            ? ['!/src/*', '!/@*', '!/node_modules/*', '!/__debug']
            : []),
        ],
      },
      env: {
        ASSETS: bindings.assets(),
        DEPLOYMENT_ENV: bindings.text(mode),
        // Non-secret URL is supplied at build time; runtime access uses getEnv().
        BLOG_API_URL: bindings.text(process.env.BLOG_API_URL ?? ''),
        BLOG_API_TOKEN: bindings.secret(),
        BLOG_ALLOW_FIXTURES: bindings.text(mode === 'local' ? 'true' : 'false'),

        // Lead records. One database per environment; migrations in ./migrations.
        DB: bindings.d1({ name: `smokeshow-leads${suffix}`, id: D1_IDS[mode] }),

        LEADS_ENABLED: bindings.text(
          mode === 'local' ? 'true' : (process.env.LEADS_ENABLED ?? 'false'),
        ),
        EMAIL:
          mode === 'local'
            ? bindings.sendEmail({ destinationAddress: 'local@example.invalid' })
            : mode === 'staging'
              ? bindings.sendEmail({
                  allowedDestinationAddresses: (
                    process.env.LEAD_TEST_RECIPIENTS || 'disabled@example.invalid'
                  )
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              : bindings.sendEmail(),
        LEAD_RATE: bindings.rateLimit({
          namespace:
            mode === 'production' ? '1002' : mode === 'staging' ? '1003' : '1001',
          simple: { limit: 5, period: 60 },
        }),
        LEAD_TEST_RECIPIENTS: bindings.text(
          mode === 'staging' ? (process.env.LEAD_TEST_RECIPIENTS ?? '') : '',
        ),
        SALES_INBOX: bindings.text(process.env.SALES_INBOX ?? ''),
        MAIL_FROM: bindings.text(process.env.MAIL_FROM ?? ''),
        LEAD_TOKEN_SECRET: bindings.secret(),
        SITE_URL: bindings.text(
          mode === 'production'
            ? 'https://smokeshowlabs.com'
            : mode === 'staging'
              ? process.env.DEPLOY_URL ||
                'https://smokeshow-web-staging.dev40.workers.dev'
              : 'http://localhost:4173',
        ),
      },
    }),
  }
})
