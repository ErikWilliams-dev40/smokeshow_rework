import { describe, expect, it } from 'vitest'

/**
 * A placeholder so `test.yml` runs a real suite rather than reporting success
 * for a runner that found nothing. Vitest exits non-zero on an empty run, which
 * would make the gate fail for a reason unrelated to the code under test.
 *
 * Delete this once the pricing tests land — see the plan's PR 12.
 */
describe('toolchain', () => {
  it('runs the test suite', () => {
    expect(1 + 1).toBe(2)
  })
})
