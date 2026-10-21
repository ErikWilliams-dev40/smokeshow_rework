import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { first, prepare } = vi.hoisted(() => {
  const first = vi.fn()
  return { first, prepare: vi.fn(() => ({ first })) }
})
vi.mock('@/server/cloudflare/env', () => ({ getEnv: () => ({ DB: { prepare } }) }))
import { GET } from '@/app/api/health/route'
import { safeError } from '@/server/logging'

describe('readiness', () => {
  beforeEach(() => {
    vi.stubGlobal('__COMMIT_SHA__', 'test-commit')
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it.each([true, false])(
    'reports D1 success=%s without exposing errors',
    async (ok) => {
      if (ok) first.mockResolvedValue({ '1': 1 })
      else first.mockRejectedValue(new Error('connection failed'))
      const response = await GET()
      expect(response.status).toBe(ok ? 200 : 503)
      expect(response.headers.get('cache-control')).toBe('no-store')
      expect(await response.json()).toEqual({
        status: ok ? 'ok' : 'degraded',
        commit: 'test-commit',
        checks: { d1: ok ? 'ok' : 'error' },
      })
      expect(prepare).toHaveBeenCalledWith('select 1')
      if (!ok)
        expect(console.error).toHaveBeenCalledWith('D1 readiness failed', {
          name: 'Error',
          message: 'connection failed',
        })
    },
  )

  it('bounds and redacts messages without serializing arbitrary properties', () => {
    const error = Object.assign(
      new Error(
        'Bearer abc\nhttps://host/path?token=abc user@example.com secret=xyz ' +
          'x'.repeat(300),
      ),
      { env: { token: 'private' } },
    )
    const result = safeError(error)
    expect(result.message.length).toBeLessThanOrEqual(200)
    expect(JSON.stringify(result)).not.toMatch(/abc|xyz|private|example|https/)
    expect(result.message).not.toContain('\n')
    expect(safeError({ token: 'private' })).toEqual({
      name: 'Error',
      message: 'Unknown failure',
    })
  })
})
