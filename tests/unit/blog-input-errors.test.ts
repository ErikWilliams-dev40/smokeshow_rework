import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { InputError, parseInput } from '../../services/blog-api/src/http'

describe('bounded validation diagnostics', () => {
  it('caps exposed issues when many input fields are invalid', () => {
    try {
      parseInput(
        z.array(z.string().min(1)),
        Array.from({ length: 2000 }, () => ''),
      )
      throw new Error('Expected validation failure')
    } catch (error) {
      expect(error).toBeInstanceOf(InputError)
      if (!(error instanceof InputError)) throw error
      expect(error.issues).toHaveLength(50)
      expect(Buffer.byteLength(JSON.stringify(error.issues))).toBeLessThan(10_000)
    }
  })
})
