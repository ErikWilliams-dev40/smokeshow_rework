import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { sqliteD1 } from '../helpers/sqlite-d1'
import {
  confirm,
  DAY,
  findLead,
  leadState,
  resend,
  saveLead,
} from '@/server/leads/repository'
import { readVerification, signVerification } from '@/server/leads/credentials'
const environment = vi.hoisted(() => ({ current: {} as Env }))
vi.mock('@/server/cloudflare/env', () => ({ getEnv: () => environment.current }))
import { deliverPending } from '@/server/leads/delivery'
import { leadRequest } from '@/server/leads/http'
const sendEmail = vi.fn().mockResolvedValue({ messageId: 'test' })
const rateLimit = vi.fn().mockResolvedValue({ success: true })
let store: ReturnType<typeof sqliteD1>
const input = () => ({
  submissionId: crypto.randomUUID(),
  email: 'buyer@example.test',
  name: 'Buyer',
  phone: '5551234567',
  website: '',
})
beforeEach(() => {
  sendEmail.mockReset().mockResolvedValue({ messageId: 'test' })
  rateLimit.mockReset().mockResolvedValue({ success: true })
  store = sqliteD1()
  environment.current = {
    DB: store.db,
    BLOG_API_URL: '',
    BLOG_RATE: { limit: vi.fn().mockResolvedValue({ success: true }) },
    BLOG_API_TOKEN: '',
    BLOG_ALLOW_FIXTURES: 'false',
    ASSETS: { fetch: vi.fn(), connect: vi.fn() },
    DEPLOYMENT_ENV: 'production',
    SITE_URL: 'https://smokeshowlabs.com',
    LEADS_ENABLED: 'true',
    LEAD_TOKEN_SECRET: 'test-only-key-with-at-least-32-characters',
    MAIL_FROM: 'mail@example.test',
    SALES_INBOX: 'sales@example.test',
    LEAD_TEST_RECIPIENTS: '',
    EMAIL: { send: sendEmail },
    LEAD_RATE: { limit: rateLimit },
  }
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})
afterEach(() => {
  store.sqlite.close()
  vi.restoreAllMocks()
})

describe('lead persistence and verification', () => {
  it('persists a pending lead once and rejects changed replay payloads', async () => {
    const data = input()
    const first = await saveLead(store.db, data)
    expect((await saveLead(store.db, data)).id).toBe(first.id)
    expect(store.sqlite.prepare('SELECT COUNT(*) AS n FROM leads').get()?.n).toBe(1)
    expect(store.sqlite.prepare('SELECT kind FROM lead_deliveries').all()).toEqual([
      { kind: 'verification' },
    ])
    await expect(
      saveLead(store.db, { ...data, name: 'Changed' }),
    ).rejects.toMatchObject({ status: 409 })
  })
  it('confirms only the current unexpired credential, creating each notification once', async () => {
    const lead = await saveLead(store.db, input(), 1000)
    await expect(
      confirm(store.db, lead.id, 2, lead.verification_expires_at, 2000),
    ).rejects.toMatchObject({ status: 410 })
    await expect(
      confirm(store.db, lead.id, 1, lead.verification_expires_at, 1000 + DAY),
    ).rejects.toMatchObject({ status: 410 })
    await confirm(store.db, lead.id, 1, lead.verification_expires_at, 2000)
    await confirm(store.db, lead.id, 1, lead.verification_expires_at, 3000)
    expect(
      store.sqlite.prepare('SELECT kind FROM lead_deliveries ORDER BY kind').all(),
    ).toEqual([{ kind: 'acknowledgment' }, { kind: 'sales' }, { kind: 'verification' }])
  })
  it('throttles resend and invalidates old credentials', async () => {
    const data = input()
    const lead = await saveLead(store.db, data, 1000)
    await expect(resend(store.db, data.submissionId, 2000)).rejects.toMatchObject({
      status: 429,
    })
    const current = await resend(store.db, data.submissionId, 62_000)
    expect(current.verification_version).toBe(2)
    await expect(
      confirm(store.db, lead.id, 1, lead.verification_expires_at, 63_000),
    ).rejects.toMatchObject({ status: 410 })
  })
  it('authenticates credentials and rejects modification', async () => {
    const payload = { id: crypto.randomUUID(), version: 1, expires: Date.now() + DAY }
    const secret = environment.current.LEAD_TOKEN_SECRET
    const token = await signVerification(payload, secret)
    expect(await readVerification(token, secret)).toEqual(payload)
    expect(await readVerification(`${token}x`, secret)).toBeNull()
    expect(await readVerification(token, `${secret}x`)).toBeNull()
  })
  it('can reapply the additive migration without losing existing leads', async () => {
    const data = input()
    await saveLead(store.db, data)
    store.sqlite.exec(readFileSync('migrations/0001_leads.sql', 'utf8'))
    expect(await findLead(store.db, data.submissionId)).not.toBeNull()
  })
})
describe('durable delivery', () => {
  it('sends only verification until confirmed, then sales and acknowledgment', async () => {
    const lead = await saveLead(store.db, input())
    await deliverPending(lead.id)
    const send = sendEmail
    expect(send).toHaveBeenCalledTimes(1)
    expect(send.mock.calls[0]?.[0]).toMatchObject({ to: 'buyer@example.test' })
    await confirm(store.db, lead.id, 1, lead.verification_expires_at)
    await deliverPending(lead.id)
    await deliverPending(lead.id)
    expect(send).toHaveBeenCalledTimes(3)
    expect(send.mock.calls.map((call) => (call[0] as { to: string }).to)).toContain(
      'sales@example.test',
    )
  })
  it('restricts staging deliveries to explicitly allowed recipients', async () => {
    environment.current.DEPLOYMENT_ENV = 'staging'
    environment.current.LEAD_TEST_RECIPIENTS = 'sales@example.test'
    const lead = await saveLead(store.db, input())
    await deliverPending(lead.id)
    expect(sendEmail).not.toHaveBeenCalled()
    environment.current.LEAD_TEST_RECIPIENTS += ',buyer@example.test'
    store.sqlite.exec('UPDATE lead_deliveries SET due_at = 0, lease_until = 0')
    await deliverPending(lead.id)
    expect(sendEmail).toHaveBeenCalledTimes(1)
  })
  it('retains failed mail for retry and skips leased jobs', async () => {
    const lead = await saveLead(store.db, input())
    sendEmail.mockRejectedValueOnce(new Error('secret upstream message'))
    await deliverPending(lead.id)
    expect((await leadState(store.db, lead)).delivery).toBe('queued')
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
      'secret upstream',
    )
    store.sqlite
      .prepare('UPDATE lead_deliveries SET due_at = 0, lease_until = ?')
      .run(Date.now() + 60_000)
    await deliverPending(lead.id)
    expect(sendEmail).toHaveBeenCalledTimes(1)
    store.sqlite.exec('UPDATE lead_deliveries SET lease_until = 0')
    await deliverPending(lead.id)
    expect((await leadState(store.db, lead)).delivery).toBe('sent')
  })
  it('does not send expired or superseded verification emails', async () => {
    const data = input()
    const lead = await saveLead(store.db, data, 1)
    await deliverPending(lead.id)
    expect(sendEmail).not.toHaveBeenCalled()
  })
})
describe('HTTP boundary', () => {
  const request = (data: unknown, origin = 'https://smokeshowlabs.com') =>
    new Request('https://smokeshowlabs.com/api/leads', {
      method: 'POST',
      headers: { origin, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  it('rejects cross-origin requests before persistence', async () => {
    expect(
      (await leadRequest(request(input(), 'https://other.test'), 'submit')).status,
    ).toBe(403)
    expect(store.sqlite.prepare('SELECT COUNT(*) AS n FROM leads').get()?.n).toBe(0)
  })
  it('persists no honeypot submissions and respects rate limits', async () => {
    expect(
      (await leadRequest(request({ ...input(), website: 'spam' }), 'submit')).status,
    ).toBe(202)
    expect(store.sqlite.prepare('SELECT COUNT(*) AS n FROM leads').get()?.n).toBe(0)
    rateLimit.mockResolvedValue({ success: false })
    expect((await leadRequest(request(input()), 'submit')).status).toBe(429)
  })
  it('fails safely on storage errors without returning personal data', async () => {
    vi.spyOn(store.db, 'batch').mockRejectedValueOnce(new Error('database secret'))
    const response = await leadRequest(request(input()), 'submit')
    expect(response.status).toBe(503)
    expect(await response.text()).not.toMatch(/database secret|buyer@example/)
  })
  it('requires POST verification credentials, and only returns non-personal status', async () => {
    const response = await leadRequest(request(input()), 'submit')
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(await response.json()).toEqual({ status: 'pending', delivery: 'sent' })
    expect((await leadRequest(request({ token: 'invalid' }), 'verify')).status).toBe(
      400,
    )
  })
})
