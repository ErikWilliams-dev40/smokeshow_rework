import { pathToFileURL } from 'node:url'

// Report field names only. Never echo environment values or credentials.
export function validateDeployConfig(mode, env) {
  const errors = []
  if (!['staging', 'production'].includes(mode)) return ['deployment mode']
  const requireMatch = (name, pattern) => {
    if (!pattern.test(env[name] ?? '')) errors.push(name)
  }
  requireMatch('CLOUDFLARE_API_TOKEN', /\S+/)
  requireMatch('CLOUDFLARE_ACCOUNT_ID', /^[a-f0-9]{32}$/)
  requireMatch(
    mode === 'production' ? 'DB_ID_PRODUCTION' : 'DB_ID_STAGING',
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
  )
  if (mode === 'production') requireMatch('PRODUCTION_ZONE_ID', /^[a-f0-9]{32}$/)
  const httpsUrl = (name, originOnly = false) => {
    try {
      const url = new URL(env[name])
      if (
        url.protocol !== 'https:' ||
        url.username ||
        url.password ||
        url.hash ||
        url.search ||
        (originOnly && url.pathname !== '/') ||
        url.hostname.endsWith('.invalid') ||
        url.hostname.endsWith('.test')
      )
        throw new Error('Invalid URL')
      return url.origin
    } catch {
      errors.push(name)
    }
  }
  const origin = httpsUrl('DEPLOY_URL', true)
  if (mode === 'production' && origin !== 'https://smokeshowlabs.com')
    errors.push('DEPLOY_URL must match the configured production origin')
  // The blog API is required in every deployed environment. Without it the built
  // Worker answers "Articles are unavailable" and a 503 sitemap while every other
  // deployment and health check still passes. It must not be the website's own
  // origin: the API is a separate Worker reached by binding, so that would route
  // public blog traffic back into the site.
  const blogOrigin = httpsUrl('BLOG_API_URL')
  if (blogOrigin && origin && blogOrigin === origin)
    errors.push('BLOG_API_URL must not be the website origin')
  requireMatch('LEADS_ENABLED', /^(true|false)$/)
  if (env.LEADS_ENABLED === 'true') {
    const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    for (const name of ['MAIL_FROM', 'SALES_INBOX']) {
      requireMatch(name, email)
      if (/\.(invalid|test)$/i.test(env[name] ?? '')) errors.push(name)
    }
    if (mode === 'staging') {
      const recipients = (env.LEAD_TEST_RECIPIENTS ?? '')
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
      if (
        !recipients.length ||
        recipients.some((value) => !email.test(value)) ||
        !recipients.includes((env.SALES_INBOX ?? '').toLowerCase())
      )
        errors.push('LEAD_TEST_RECIPIENTS including SALES_INBOX')
    }
  }
  return [...new Set(errors)]
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const errors = validateDeployConfig(process.argv[2], process.env)
  if (errors.length) {
    console.error(`Missing or invalid deployment configuration: ${errors.join(', ')}`)
    process.exitCode = 1
  } else
    console.log(
      'Deployment configuration validated (Worker secrets must be provisioned separately).',
    )
}
