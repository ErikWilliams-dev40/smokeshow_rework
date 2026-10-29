import { bindings, defineConfig, defineWorker } from 'cf/config'

export default defineConfig((ctx) => {
  const mode = ctx.mode === 'production' || ctx.mode === 'staging' ? ctx.mode : 'local'
  const suffix = mode === 'production' ? '' : `-${mode}`
  return {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    worker: defineWorker({
      name: `smokeshow-blog-api${suffix}`,
      entrypoint: './src/worker.ts',
      // Match the installed workerd; advance with a tested toolchain update.
      compatibilityDate: '2026-10-07',
      compatibilityFlags: ['nodejs_compat'],
      workersDev: true,
      observability: {
        enabled: true,
        redactQueryString: true,
        logs: { enabled: true },
        traces: { enabled: true, headSamplingRate: 0.01 },
      },
      env: {
        BLOG_ADMIN_RATE: bindings.rateLimit({
          namespace:
            mode === 'production' ? '1104' : mode === 'staging' ? '1103' : '1100',
          simple: { limit: 60, period: 60 },
        }),
        BLOG_DB: bindings.d1({
          name: `smokeshow-blog${suffix}`,
          id:
            mode === 'local'
              ? '00000000-0000-4000-8000-000000000110'
              : process.env.BLOG_DB_ID || 'REPLACE-WITH-BLOG-DATABASE-ID',
        }),
        BLOG_MEDIA: bindings.r2({
          name: process.env.BLOG_BUCKET_NAME || `smokeshow-blog-media${suffix}`,
        }),
        BLOG_API_TOKEN: bindings.secret(),
        BLOG_ADMIN_CREDENTIALS: bindings.secret(),
        COMMIT_SHA: bindings.text(process.env.COMMIT_SHA || 'local'),
      },
    }),
  }
})
