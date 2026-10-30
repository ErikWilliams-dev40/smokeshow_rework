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
const environment = vi.hoisted(() => ({
  current: {} as Env,
  background: [] as Promise<unknown>[],
}))
vi.mock('@/server/cloudflare/env', () => ({
  getEnv: () => environment.current,
  scheduleBackground: (work: Promise<unknown>) => {
    environment.background.push(work)
  },
}))
import { deliverPending, reportDeliveryHealth } from '@/server/leads/delivery'
import { leadRequest, readBody } from '@/server/leads/http'
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
afterEach(async () => {
  await Promise.all(environment.background.splice(0))
  vi.useRealTimers()
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
  it('rolls back the lead when the outbox insert fails', async () => {
    store.sqlite.exec(`CREATE TRIGGER fail_outbox BEFORE INSERT ON lead_deliveries
      BEGIN SELECT RAISE(ABORT, 'injected outbox failure'); END`)
    await expect(saveLead(store.db, input())).rejects.toThrow('injected outbox')
    expect(store.sqlite.prepare('SELECT COUNT(*) AS n FROM leads').get()?.n).toBe(0)
    expect(
      store.sqlite.prepare('SELECT COUNT(*) AS n FROM lead_deliveries').get()?.n,
    ).toBe(0)
  })
  it('serializes concurrent identical submissions while allowing separate inquiries', async () => {
    const data = input()
    const results = await Promise.all(
      Array.from({ length: 10 }, () => saveLead(store.db, data)),
    )
    expect(new Set(results.map((lead) => lead.id)).size).toBe(1)
    await saveLead(store.db, { ...data, submissionId: crypto.randomUUID() })
    expect(store.sqlite.prepare('SELECT COUNT(*) AS n FROM leads').get()?.n).toBe(2)
    expect(
      store.sqlite.prepare('SELECT COUNT(*) AS n FROM lead_deliveries').get()?.n,
    ).toBe(2)
  })
  it('rolls back confirmation when notification persistence fails', async () => {
    const data = input()
    const lead = await saveLead(store.db, data)
    store.sqlite.exec(`CREATE TRIGGER fail_notification BEFORE INSERT ON lead_deliveries
      WHEN NEW.kind = 'sales' BEGIN SELECT RAISE(ABORT, 'injected notification failure'); END`)
    await expect(
      confirm(store.db, lead.id, 1, lead.verification_expires_at),
    ).rejects.toThrow('injected notification')
    expect((await findLead(store.db, data.submissionId))?.verified_at).toBeNull()
    expect(
      store.sqlite.prepare('SELECT COUNT(*) AS n FROM lead_deliveries').get()?.n,
    ).toBe(1)
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
      store.sqlite.prepare('SELECT verified_at FROM leads').get()?.verified_at,
    ).toBe(2000)
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
describe('failed verification recovery', () => {
  const snapshot = () => ({
    leads: store.sqlite.prepare('SELECT * FROM leads ORDER BY id').all(),
    deliveries: store.sqlite.prepare('SELECT * FROM lead_deliveries ORDER BY id').all(),
  })
  async function failedLead() {
    const data = { ...input(), interest: 'Vapes' as const }
    const lead = await saveLead(store.db, data, 1000)
    store.sqlite.exec('UPDATE lead_deliveries SET failed_at = 2000, attempts = 5')
    return { data, lead }
  }
  it('recovers at the exact cooldown boundary and retains failed history', async () => {
    const { data, lead } = await failedLead()
    const failed = snapshot()
    const early = await saveLead(store.db, data, 60_999)
    expect((await leadState(store.db, early)).delivery).toBe('failed')
    expect(snapshot()).toEqual(failed)
    const recovered = await saveLead(
      store.db,
      { ...data, email: ' BUYER@EXAMPLE.TEST ' },
      61_000,
    )
    expect(recovered).toEqual({
      ...lead,
      verification_version: 2,
      verification_expires_at: 61_000 + DAY,
      resend_at: 61_000,
    })
    expect(await leadState(store.db, recovered)).toEqual({
      status: 'pending',
      delivery: 'queued',
    })
    const deliveries = store.sqlite
      .prepare('SELECT * FROM lead_deliveries ORDER BY version')
      .all()
    expect(deliveries[0]).toEqual(failed.deliveries[0])
    expect(deliveries[1]).toMatchObject({
      id: `${lead.id}:verification:2`,
      version: 2,
      attempts: 0,
      due_at: 61_000,
      failed_at: null,
      delivered_at: null,
      lease_until: 0,
    })
    await saveLead(store.db, data, 121_000)
    expect(
      store.sqlite.prepare('SELECT COUNT(*) AS n FROM lead_deliveries').get()?.n,
    ).toBe(2)
  })
  it.each([
    ['queued', 'failed_at = NULL, attempts = 0'],
    ['sent', 'failed_at = NULL, delivered_at = 2000'],
    ['leased', 'lease_until = 61001'],
    ['already accepted', 'delivered_at = 2000'],
  ])('preserves %s deliveries without rotating credentials', async (_state, update) => {
    const { data, lead } = await failedLead()
    store.sqlite.exec(`UPDATE lead_deliveries SET ${update}`)
    const before = snapshot()
    expect(await saveLead(store.db, data, 61_000)).toEqual(lead)
    expect(snapshot()).toEqual(before)
  })
  it('preserves confirmed leads even when the verification job is marked failed', async () => {
    const { data, lead } = await failedLead()
    await confirm(store.db, lead.id, 1, lead.verification_expires_at, 3000)
    const before = snapshot()
    const replay = await saveLead(store.db, data, 61_000)
    expect(replay.verified_at).toBe(3000)
    expect(replay.verification_version).toBe(1)
    expect(snapshot()).toEqual(before)
  })
  it.each([
    { email: 'other@example.test' },
    { name: 'Other' },
    { phone: '5557654321' },
    { interest: 'Flower' as const },
    { interest: undefined },
  ])('rejects conflicting replay %j without any writes', async (changed) => {
    const { data } = await failedLead()
    const before = snapshot()
    await expect(
      saveLead(store.db, { ...data, ...changed }, 61_000),
    ).rejects.toMatchObject({ status: 409 })
    expect(snapshot()).toEqual(before)
    // A conflicting replay must not repair a missing outbox row either.
    store.sqlite.exec('DELETE FROM lead_deliveries')
    const missing = snapshot()
    await expect(
      saveLead(store.db, { ...data, ...changed }, 61_000),
    ).rejects.toMatchObject({ status: 409 })
    expect(snapshot()).toEqual(missing)
  })
  it('serializes concurrent recovery into one new version and delivery', async () => {
    const { data } = await failedLead()
    const results = await Promise.all(
      Array.from({ length: 10 }, () => saveLead(store.db, data, 61_000)),
    )
    expect(results.every((lead) => lead.verification_version === 2)).toBe(true)
    expect(
      store.sqlite
        .prepare('SELECT version FROM lead_deliveries ORDER BY version')
        .all(),
    ).toEqual([{ version: 1 }, { version: 2 }])
    // A newly failed recovery still shares the cooldown with subsequent submits.
    store.sqlite.exec('UPDATE lead_deliveries SET failed_at = 62000 WHERE version = 2')
    const before = snapshot()
    await saveLead(store.db, data, 62_000)
    expect(snapshot()).toEqual(before)
  })
  it('rolls back credential rotation when replacement outbox insertion fails', async () => {
    const { data } = await failedLead()
    const before = snapshot()
    store.sqlite.exec(`CREATE TRIGGER fail_recovery BEFORE INSERT ON lead_deliveries
      WHEN NEW.version = 2 BEGIN SELECT RAISE(ABORT, 'injected recovery failure'); END`)
    await expect(saveLead(store.db, data, 61_000)).rejects.toThrow(
      'injected recovery failure',
    )
    expect(snapshot()).toEqual(before)
  })
  it('shares credential rotation and cooldown with explicit resend', async () => {
    const { data, lead } = await failedLead()
    const recovered = await saveLead(store.db, data, 61_000)
    await expect(
      confirm(store.db, lead.id, 1, lead.verification_expires_at, 62_000),
    ).rejects.toMatchObject({ status: 410 })
    await expect(resend(store.db, data.submissionId, 120_999)).rejects.toMatchObject({
      status: 429,
    })
    const resent = await resend(store.db, data.submissionId, 121_000)
    expect(resent.verification_version).toBe(3)
    await expect(
      confirm(store.db, lead.id, 2, recovered.verification_expires_at, 122_000),
    ).rejects.toMatchObject({ status: 410 })
    await confirm(store.db, lead.id, 3, resent.verification_expires_at, 122_000)
    expect(
      (await leadState(store.db, (await findLead(store.db, data.submissionId))!))
        .status,
    ).toBe('confirmed')
  })
  it('confirms the new recovery credential and leaves notifications unique', async () => {
    const { data } = await failedLead()
    const recovered = await saveLead(store.db, data, 61_000)
    const secret = environment.current.LEAD_TOKEN_SECRET
    const token = await signVerification(
      { id: recovered.id, version: 2, expires: recovered.verification_expires_at },
      secret,
    )
    const payload = (await readVerification(token, secret))!
    await confirm(store.db, payload.id, payload.version, payload.expires, 62_000)
    await confirm(store.db, payload.id, payload.version, payload.expires, 63_000)
    expect(
      store.sqlite
        .prepare(
          'SELECT kind, COUNT(*) AS n FROM lead_deliveries GROUP BY kind ORDER BY kind',
        )
        .all(),
    ).toEqual([
      { kind: 'acknowledgment', n: 1 },
      { kind: 'sales', n: 1 },
      { kind: 'verification', n: 2 },
    ])
  })
  it('serializes a racing explicit resend and form recovery into one version', async () => {
    const { data } = await failedLead()
    const results = await Promise.allSettled([
      saveLead(store.db, data, 61_000),
      resend(store.db, data.submissionId, 61_000),
    ])
    for (const result of results) {
      if (result.status === 'fulfilled')
        expect(result.value.verification_version).toBe(2)
      else expect(result.reason).toMatchObject({ status: 429 })
    }
    expect((await findLead(store.db, data.submissionId))?.verification_version).toBe(2)
    expect(
      store.sqlite.prepare('SELECT COUNT(*) AS n FROM lead_deliveries').get()?.n,
    ).toBe(2)
  })
})
describe('durable delivery', () => {
  it.each([
    'E_RECIPIENT_SUPPRESSED',
    'E_SENDER_NOT_VERIFIED',
    'E_RECIPIENT_NOT_ALLOWED',
  ])('stops automatic delivery after permanent %s', async (code) => {
    const lead = await saveLead(store.db, input())
    sendEmail.mockRejectedValueOnce(
      Object.assign(new Error('private recipient information'), { code }),
    )
    await deliverPending(lead.id)
    expect((await leadState(store.db, lead)).delivery).toBe('failed')
    store.sqlite.exec('UPDATE lead_deliveries SET due_at = 0')
    await deliverPending()
    expect(sendEmail).toHaveBeenCalledOnce()
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
      'private recipient',
    )
  })
  it('bounds transient retries, including an interrupted final attempt', async () => {
    const lead = await saveLead(store.db, input())
    sendEmail.mockRejectedValue(
      Object.assign(new Error('temporary'), { code: 'E_RATE_LIMIT_EXCEEDED' }),
    )
    for (let attempt = 1; attempt <= 5; attempt++) {
      store.sqlite.exec('UPDATE lead_deliveries SET due_at = 0')
      await deliverPending(lead.id)
      expect((await leadState(store.db, lead)).delivery).toBe(
        attempt < 5 ? 'queued' : 'failed',
      )
    }
    // Simulate termination after the fifth claim, before recording its outcome.
    store.sqlite.exec(
      'UPDATE lead_deliveries SET failed_at = NULL, due_at = 0, lease_until = 0',
    )
    await deliverPending()
    expect(sendEmail).toHaveBeenCalledTimes(5)
    expect((await leadState(store.db, lead)).delivery).toBe('failed')
  })
  it('keeps malformed provider acceptance responses retryable', async () => {
    const lead = await saveLead(store.db, input())
    sendEmail.mockResolvedValueOnce({})
    await deliverPending(lead.id)
    expect((await leadState(store.db, lead)).delivery).toBe('queued')
  })
  it('does not deliver concurrently while another worker holds the lease', async () => {
    const lead = await saveLead(store.db, input())
    let release!: (value: { messageId: string }) => void
    sendEmail.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = resolve
        }),
    )
    const first = deliverPending(lead.id)
    await vi.waitFor(() => expect(sendEmail).toHaveBeenCalledOnce())
    await deliverPending(lead.id)
    expect(sendEmail).toHaveBeenCalledOnce()
    release({ messageId: 'accepted' })
    await first
  })
  it('reports aggregate outbox health without contact information', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-29T12:00:00Z'))
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    await saveLead(store.db, input())
    await reportDeliveryHealth()
    expect(console.log).toHaveBeenCalledWith('Lead delivery health', {
      pending: 1,
      failed: 0,
      oldestOverdueSeconds: 0,
    })
    expect(JSON.stringify(vi.mocked(console.log).mock.calls)).not.toMatch(
      /buyer|example|555123/,
    )
  })
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
    vi.useFakeTimers()
    vi.setSystemTime(Date.now() + 61_000)
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
  it('returns 202 with failed state during recovery cooldown and queued state after it', async () => {
    const now = Date.now()
    vi.useFakeTimers({ toFake: ['Date'] }).setSystemTime(now)
    const data = input()
    await saveLead(store.db, data, now)
    store.sqlite.exec('UPDATE lead_deliveries SET failed_at = 1')
    const early = await leadRequest(request(data), 'submit')
    expect(early.status).toBe(202)
    expect(await early.json()).toEqual({ status: 'pending', delivery: 'failed' })
    await Promise.all(environment.background.splice(0))
    vi.setSystemTime(now + 60_000)
    const recovered = await leadRequest(request(data), 'submit')
    expect(recovered.status).toBe(202)
    expect(await recovered.json()).toEqual({ status: 'pending', delivery: 'queued' })
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
    const throttled = await leadRequest(request(input()), 'submit')
    expect(throttled.status).toBe(429)
    expect(throttled.headers.get('Retry-After')).toBe('60')
  })
  it('normalizes email before applying the per-email rate limit', async () => {
    const data = { ...input(), email: ' Buyer+Menu@Example.test ' }
    rateLimit
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false })
    expect((await leadRequest(request(data), 'submit')).status).toBe(429)
    const { hashAccess } = await import('@/server/leads/credentials')
    expect(rateLimit).toHaveBeenLastCalledWith({
      key: `email:${await hashAccess('buyer+menu@example.test')}`,
    })
    expect(store.sqlite.prepare('SELECT COUNT(*) AS n FROM leads').get()?.n).toBe(0)
  })
  it('does not authorize status or resend with another submission ID', async () => {
    await saveLead(store.db, input())
    for (const action of ['status', 'resend'] as const) {
      const response = await leadRequest(
        request({ submissionId: crypto.randomUUID() }),
        action,
      )
      expect(response.status).toBe(404)
      expect(await response.text()).not.toContain('buyer@example')
    }
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
    expect(await response.json()).toEqual({ status: 'pending', delivery: 'queued' })
    expect((await leadRequest(request({ token: 'invalid' }), 'verify')).status).toBe(
      400,
    )
  })
})

describe('bounded lead request bodies', () => {
  const raw = (body: BodyInit, type = 'application/json', signal?: AbortSignal) =>
    new Request('https://example.test', {
      method: 'POST',
      headers: { 'Content-Type': type },
      body,
      signal,
      duplex: 'half',
    } as RequestInit)
  it.each(['application/jsonp', 'application/json-evil', 'text/json'])(
    'rejects %s',
    async (type) => {
      await expect(readBody(raw('{}', type))).rejects.toMatchObject({ status: 415 })
    },
  )
  it('accepts case-insensitive JSON with parameters', async () => {
    expect(await readBody(raw('{}', 'Application/JSON; charset=UTF-8'))).toEqual({})
  })
  it('rejects invalid UTF-8 and measures bytes rather than characters', async () => {
    await expect(
      readBody(raw(new Uint8Array([123, 34, 120, 34, 58, 34, 255, 34, 125]))),
    ).rejects.toMatchObject({ status: 400 })
    expect(await readBody(raw(JSON.stringify('x'.repeat(8190))))).toHaveLength(8190)
    await expect(readBody(raw(JSON.stringify('é'.repeat(4096))))).rejects.toMatchObject(
      { status: 413 },
    )
  })
  it.each(['deadline', 'disconnect'])('cancels stalled readers on %s', async (mode) => {
    vi.useFakeTimers()
    const cancel = vi.fn()
    const controller = new AbortController()
    const result = readBody(
      raw(new ReadableStream({ cancel }), 'application/json', controller.signal),
    )
    const assertion = expect(result).rejects.toMatchObject({
      status: mode === 'deadline' ? 408 : 400,
    })
    if (mode === 'deadline') await vi.advanceTimersByTimeAsync(10_000)
    else controller.abort()
    await assertion
    expect(cancel).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })
})

it('responds after durable persistence while delivery is stalled, then recovers through the cron outbox', async () => {
  let reject!: (error: Error) => void
  sendEmail.mockImplementationOnce(
    () =>
      new Promise((_, fail) => {
        reject = fail
      }),
  )
  const data = input()
  const response = await leadRequest(
    new Request('https://smokeshowlabs.com/api/leads', {
      method: 'POST',
      headers: {
        origin: 'https://smokeshowlabs.com',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }),
    'submit',
  )
  expect(response.status).toBe(202)
  expect(await response.json()).toEqual({ status: 'pending', delivery: 'queued' })
  expect(await findLead(store.db, data.submissionId)).not.toBeNull()
  expect(
    store.sqlite.prepare('SELECT COUNT(*) AS n FROM lead_deliveries').get()?.n,
  ).toBe(1)
  await vi.waitFor(() => expect(sendEmail).toHaveBeenCalledOnce())
  reject(new Error('Provider unavailable'))
  await Promise.all(environment.background.splice(0))
  store.sqlite.exec('UPDATE lead_deliveries SET due_at = 0, lease_until = 0')
  await deliverPending()
  expect(sendEmail).toHaveBeenCalledTimes(2)
})

import { GET as readiness } from '@/app/api/health/route'
it('validates enabled lead configuration without sending mail', async () => {
  vi.stubGlobal('__COMMIT_SHA__', 'test')
  expect(await (await readiness()).json()).toMatchObject({
    checks: { d1: 'ok', leads: 'ok' },
  })
  environment.current.LEAD_TOKEN_SECRET = ''
  expect((await readiness()).status).toBe(503)
  environment.current.LEADS_ENABLED = 'false'
  expect(await (await readiness()).json()).toMatchObject({
    checks: { leads: 'disabled' },
  })
  expect(sendEmail).not.toHaveBeenCalled()
  vi.unstubAllGlobals()
})
it('fails readiness when the durable outbox schema is absent', async () => {
  vi.stubGlobal('__COMMIT_SHA__', 'test')
  store.sqlite.exec('DROP TABLE lead_deliveries')
  expect((await readiness()).status).toBe(503)
  vi.unstubAllGlobals()
})
