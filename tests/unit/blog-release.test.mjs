import { describe, expect, it, vi } from 'vitest'
import { createHash } from 'node:crypto'
import {
  validateIdentity,
  validateRecord,
  validateConfiguration,
  checkHealth,
} from '../../scripts/check-blog-release.mjs'

const env = {
  GITHUB_REF: 'refs/heads/main',
  COMMIT_SHA: 'a'.repeat(40),
  APPROVED_SHA: 'a'.repeat(40),
  GITHUB_REPOSITORY: 'House-of-Helix-CMD/smokeshow_rework',
  BLOG_MODE: 'production',
  CLOUDFLARE_ACCOUNT_ID: 'b'.repeat(32),
  CLOUDFLARE_API_TOKEN: 'test-cloudflare-credential',
  BLOG_DB_ID: '11111111-2222-4333-8444-555555555555',
  BLOG_BUCKET_NAME: 'blog-test-media',
  BLOG_DEPLOY_URL: 'https://api.example.invalid',
  BLOG_API_TOKEN: 'read'.padEnd(48, 'r'),
  BLOG_ADMIN_CREDENTIALS: JSON.stringify([
    { id: 'writer', name: 'Writer', role: 'editor', sha256: 'a'.repeat(64) },
    { id: 'owner', name: 'Owner', role: 'owner', sha256: 'b'.repeat(64) },
  ]),
}
const record = {
  commit_sha: env.COMMIT_SHA,
  repository: env.GITHUB_REPOSITORY,
  test_status: 'passed',
  security_review_status: 'passed',
  human_reviewer: 'reviewer',
  developer: 'author',
  business_approval_required: true,
  database_migration: true,
  rollback_safe: true,
}
describe('blog release gates', () => {
  it('requires a merged-release identity and a matching approved record', () => {
    expect(() => validateIdentity(env)).not.toThrow()
    expect(() => validateRecord(record, env)).not.toThrow()
    expect(() =>
      validateIdentity({ ...env, GITHUB_REF: 'refs/heads/feature' }),
    ).toThrow()
    expect(() => validateIdentity({ ...env, APPROVED_SHA: 'b'.repeat(40) })).toThrow()
    expect(() => validateRecord({ ...record, human_reviewer: 'author' }, env)).toThrow()
    expect(() =>
      validateRecord({ ...record, human_reviewer: ' Author ' }, env),
    ).toThrow()
    for (const developer of [undefined, '', '  ', 7])
      expect(() => validateRecord({ ...record, developer }, env)).toThrow()
    expect(() =>
      validateRecord({ ...record, security_review_status: 'pending' }, env),
    ).toThrow()
    expect(() =>
      validateRecord({ ...record, commit_sha: 'b'.repeat(40) }, env),
    ).toThrow()
  })
  it('allows an honest staging-only record without independent human review', () => {
    const staging = {
      ...record,
      human_reviewer: null,
      deployment_environment: 'staging',
    }
    expect(() =>
      validateRecord(staging, { ...env, BLOG_MODE: 'staging' }),
    ).not.toThrow()
    // The staging record cannot be reused for production, even with a reviewer.
    for (const human_reviewer of [null, 'reviewer'])
      expect(() => validateRecord({ ...staging, human_reviewer }, env)).toThrow()
    expect(() => validateRecord({ ...record, human_reviewer: null }, env)).toThrow()
    expect(() => validateRecord(staging, { ...env, BLOG_MODE: undefined })).toThrow()
    expect(() => validateRecord(staging, { ...env, BLOG_MODE: 'stagng' })).toThrow()
    expect(() => validateRecord(record, { ...env, BLOG_MODE: 'staging' })).toThrow()
    for (const change of [
      { test_status: 'failed' },
      { security_review_status: 'pending' },
      { rollback_safe: false },
      { business_approval_required: false },
      { commit_sha: 'b'.repeat(40) },
    ])
      expect(() =>
        validateRecord({ ...staging, ...change }, { ...env, BLOG_MODE: 'staging' }),
      ).toThrow()
  })
  it('rejects missing, placeholder and shared credentials before deployment', () => {
    expect(() => validateConfiguration(env)).not.toThrow()
    for (const key of [
      'CLOUDFLARE_ACCOUNT_ID',
      'CLOUDFLARE_API_TOKEN',
      'BLOG_DB_ID',
      'BLOG_BUCKET_NAME',
      'BLOG_DEPLOY_URL',
      'BLOG_API_TOKEN',
      'BLOG_ADMIN_CREDENTIALS',
    ])
      expect(() => validateConfiguration({ ...env, [key]: '' })).toThrow()
    expect(() =>
      validateConfiguration({
        ...env,
        BLOG_DB_ID: '00000000-0000-4000-8000-000000000110',
      }),
    ).toThrow()
    for (const change of [{ id: 7 }, { sha256: ['c'.repeat(64)] }]) {
      const coerced = JSON.parse(env.BLOG_ADMIN_CREDENTIALS)
      Object.assign(coerced[0], change)
      expect(() =>
        validateConfiguration({
          ...env,
          BLOG_ADMIN_CREDENTIALS: JSON.stringify(coerced),
        }),
      ).toThrow()
    }
    const registry = JSON.parse(env.BLOG_ADMIN_CREDENTIALS)
    registry[0].sha256 = createHash('sha256').update(env.BLOG_API_TOKEN).digest('hex')
    expect(() =>
      validateConfiguration({
        ...env,
        BLOG_ADMIN_CREDENTIALS: JSON.stringify(registry),
      }),
    ).toThrow()
    expect(() =>
      validateConfiguration({ ...env, BLOG_DEPLOY_URL: 'http://api.example.invalid' }),
    ).toThrow()
  })
  it('authenticates readiness, rejects redirects and verifies SHA and both storage checks', async () => {
    const healthy = {
      status: 'ok',
      commit: env.COMMIT_SHA,
      checks: { d1: true, r2: true },
    }
    const request = vi
      .fn()
      .mockResolvedValue(
        Response.json(healthy, { headers: { 'Cache-Control': 'no-store' } }),
      )
    await checkHealth(env, { request, attempts: 1 })
    expect(request.mock.calls[0][1]).toMatchObject({
      redirect: 'error',
      headers: { Authorization: `Bearer ${env.BLOG_API_TOKEN}` },
    })
    for (const body of [
      { ...healthy, commit: 'wrong' },
      { ...healthy, checks: { d1: true, r2: false } },
    ]) {
      request.mockResolvedValue(
        Response.json(body, { headers: { 'Cache-Control': 'no-store' } }),
      )
      await expect(checkHealth(env, { request, attempts: 1 })).rejects.toThrow(
        'Readiness failed',
      )
    }
    request.mockResolvedValue(Response.json(healthy))
    await expect(checkHealth(env, { request, attempts: 1 })).rejects.toThrow()
  })
})
