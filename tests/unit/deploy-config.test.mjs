import { describe, expect, it } from 'vitest'
import { validateDeployConfig } from '../../scripts/check-deploy-config.mjs'
const configured = {
  CLOUDFLARE_API_TOKEN: 'test-only-credential',
  CLOUDFLARE_ACCOUNT_ID: 'a'.repeat(32),
  PRODUCTION_ZONE_ID: 'b'.repeat(32),
  DB_ID_PRODUCTION: '00000000-0000-4000-8000-000000000002',
  DB_ID_STAGING: '00000000-0000-4000-8000-000000000003',
  DEPLOY_URL: 'https://smokeshowlabs.com',
  BLOG_API_URL: 'https://blog.example.com/api',
  LEADS_ENABLED: 'true',
  MAIL_FROM: 'mail@example.com',
  SALES_INBOX: 'sales@example.com',
}
describe('deployment preflight', () => {
  it('rejects placeholder production configuration without revealing secrets', () => {
    const errors = validateDeployConfig('production', {
      CLOUDFLARE_API_TOKEN: 'private-token',
    })
    expect(errors).toContain('DB_ID_PRODUCTION')
    expect(errors).toContain('PRODUCTION_ZONE_ID')
    expect(errors).toContain('BLOG_API_URL')
    expect(JSON.stringify(errors)).not.toContain('private-token')
  })
  it('accepts configured production and rejects canonical-origin drift', () => {
    expect(validateDeployConfig('production', configured)).toEqual([])
    expect(
      validateDeployConfig('production', {
        ...configured,
        DEPLOY_URL: 'https://wrong.example.com',
      }),
    ).not.toEqual([])
  })
  it('requires a controlled staging sales inbox and safe URLs', () => {
    expect(validateDeployConfig('staging', configured)).toContain(
      'LEAD_TEST_RECIPIENTS including SALES_INBOX',
    )
    expect(
      validateDeployConfig('staging', {
        ...configured,
        LEAD_TEST_RECIPIENTS: 'sales@example.com',
      }),
    ).toEqual([])
    expect(
      validateDeployConfig('production', {
        ...configured,
        BLOG_API_URL: 'https://user:password@example.com',
      }),
    ).toContain('BLOG_API_URL')
  })
})
