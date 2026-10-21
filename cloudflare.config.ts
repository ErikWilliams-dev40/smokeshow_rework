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
 * targets in .cloudflare/state. Staging is a design-only preview in the Dev40
 * account. Production remains unprovisioned. See README for staging commands.
 */
const D1_IDS = {
  local: '00000000-0000-4000-8000-000000000001',
  staging: 'b98400fb-eae4-45db-ad1d-71c5d73ca22c',
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
    accountId: mode === 'staging' ? '8441cc5cfd234da96da8cdf090d94658' : undefined,
    worker: defineWorker({
      name: `smokeshow-web${suffix}`,
      entrypoint: './src/worker.ts',
      // Must not exceed the date the installed workerd supports, or the local
      // runtime refuses to start. Raise it together with the toolchain.
      compatibilityDate: '2026-10-07',
      compatibilityFlags: ['nodejs_compat'],
      workersDev: mode === 'staging' ? true : undefined,
      observability:
        mode === 'staging'
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
        // Non-secret URL is supplied at build time; runtime access uses getEnv().
        BLOG_API_URL: bindings.text(process.env.BLOG_API_URL ?? ''),
        BLOG_API_TOKEN: bindings.secret(),
        BLOG_ALLOW_FIXTURES: bindings.text(mode === 'local' ? 'true' : 'false'),

        // Lead records. One database per environment; migrations in ./migrations.
        DB: bindings.d1({ name: `smokeshow-leads${suffix}`, id: D1_IDS[mode] }),

        // Staging has no email capability or lead secrets while its forms are
        // previews. Issue #15 must add a restricted test mailer before enabling
        // real submission there. Local/production retain the pipeline scaffold.
        ...(mode === 'staging'
          ? {}
          : {
              EMAIL:
                mode === 'production'
                  ? bindings.sendEmail()
                  : bindings.sendEmail({
                      destinationAddress: 'staging-leads@example.invalid',
                    }),
              LEAD_RATE: bindings.rateLimit({
                namespace: mode === 'production' ? '1002' : '1001',
                simple: { limit: 5, period: 60 },
              }),
              SALES_INBOX: bindings.text(''),
              MAIL_FROM: bindings.text(''),
              LEAD_TOKEN_SECRET: bindings.secret(),
              CSV_EXPORT_USER: bindings.secret(),
              CSV_EXPORT_PASSWORD: bindings.secret(),
            }),
        SITE_URL: bindings.text(
          mode === 'production'
            ? 'https://smokeshowlabs.com'
            : mode === 'staging'
              ? 'https://smokeshow-web-staging.dev40.workers.dev'
              : 'http://localhost:4173',
        ),
      },
    }),
  }
})
