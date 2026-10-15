import { describe, expect, it } from 'vitest'
import { createSmokeClock } from '@/components/hero/smoke-clock'

describe('smoke animation time', () => {
  it('holds the same time while paused and resumes without catching up', () => {
    const clock = createSmokeClock()
    expect(clock.advance(1000)).toBe(0)
    expect(clock.advance(1020)).toBeCloseTo(0.02)
    clock.pause()
    expect(clock.advance(9000)).toBeCloseTo(0.02)
    expect(clock.advance(9020)).toBeCloseTo(0.04)
  })
  it('caps long frames so tab changes cannot make the haze jump', () => {
    const clock = createSmokeClock()
    clock.advance(1000)
    expect(clock.advance(5000)).toBeCloseTo(0.05)
    expect(clock.advance(4990)).toBeCloseTo(0.05)
  })
})
