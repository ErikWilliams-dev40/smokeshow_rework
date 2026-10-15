import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { wholesaleSchema } from '@/content/wholesale'
import { clearDraft, readDraft, saveDraft } from '@/components/wholesale/draft'

const valid = {
  name: 'Jordan Reyes',
  email: 'jordan@example.com',
  phone: '+1 (213) 555-0123',
}

describe('wholesale inquiry validation', () => {
  it('accepts just email, name and phone', () => {
    expect(wholesaleSchema.safeParse(valid).success).toBe(true)
  })
  it('rejects missing required fields and malformed contact information', () => {
    for (const [field, value] of Object.entries({
      name: '',
      email: 'bad',
      phone: '123',
    })) {
      expect(
        wholesaleSchema.safeParse({ ...valid, [field]: value }).success,
        field,
      ).toBe(false)
    }
    expect(
      wholesaleSchema.safeParse({ ...valid, phone: 'abc2135550123' }).success,
    ).toBe(false)
  })
  it('allows legitimate international phone formatting and approved product interests', () => {
    expect(
      wholesaleSchema.safeParse({
        ...valid,
        phone: '+44 20 7946 0958',
        interest: 'HOUSE OF HELIX Peptide Strips',
      }).success,
    ).toBe(true)
  })
  it('rejects unknown interests and oversized contact details', () => {
    expect(wholesaleSchema.safeParse({ ...valid, interest: 'Unknown' }).success).toBe(
      false,
    )
    expect(wholesaleSchema.safeParse({ ...valid, name: 'a'.repeat(101) }).success).toBe(
      false,
    )
    expect(wholesaleSchema.safeParse({ ...valid, phone: '1'.repeat(41) }).success).toBe(
      false,
    )
  })
  it('requires all three contact fields and trims email and name', () => {
    for (const key of ['email', 'name', 'phone']) {
      expect(wholesaleSchema.safeParse({ ...valid, [key]: undefined }).success).toBe(
        false,
      )
    }
    expect(
      wholesaleSchema.parse({
        ...valid,
        name: ' Jordan Reyes ',
        email: ' jordan@example.com ',
      }),
    ).toEqual(valid)
  })
})

describe('temporary signup draft', () => {
  beforeEach(() => {
    const entries = new Map<string, string>()
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => entries.set(key, value),
      removeItem: (key: string) => entries.delete(key),
    })
  })
  afterEach(() => vi.unstubAllGlobals())
  it('keeps the most recent interest and clears it on dismissal', () => {
    saveDraft({ interest: 'Vapes' })
    saveDraft({ interest: 'Flower' })
    expect(readDraft()).toEqual({ interest: 'Flower' })
    clearDraft()
    expect(readDraft()).toEqual({})
  })
  it('strips legacy contact details on reads and writes', () => {
    sessionStorage.setItem(
      'ss_wholesale_draft',
      JSON.stringify({ ...valid, interest: 'Flower' }),
    )
    expect(readDraft()).toEqual({ interest: 'Flower' })
    saveDraft({ ...valid, interest: 'Vapes' })
    expect(JSON.parse(sessionStorage.getItem('ss_wholesale_draft')!)).toEqual({
      interest: 'Vapes',
    })
  })
  it('ignores malformed JSON and invalid draft shapes', () => {
    sessionStorage.setItem('ss_wholesale_draft', '{broken')
    expect(readDraft()).toEqual({})
    sessionStorage.setItem(
      'ss_wholesale_draft',
      JSON.stringify({ interest: 'Unknown', email: 123 }),
    )
    expect(readDraft()).toEqual({})
  })
  it('remains usable when storage is unavailable', () => {
    vi.stubGlobal('sessionStorage', {
      getItem: () => {
        throw new Error('Blocked')
      },
      setItem: () => {
        throw new Error('Blocked')
      },
      removeItem: () => {
        throw new Error('Blocked')
      },
    })
    expect(readDraft()).toEqual({})
    expect(() => saveDraft({ interest: 'Vapes' })).not.toThrow()
    expect(() => clearDraft()).not.toThrow()
  })
})
