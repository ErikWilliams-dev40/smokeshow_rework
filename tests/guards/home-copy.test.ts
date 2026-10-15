import { describe, expect, it } from 'vitest'

import { home, signupAnchor } from '@/content/home'
import { splash } from '@/content/splash'

/** Every string below is quoted from the client's brief (2026-10-14). */
describe('homepage copy', () => {
  it('uses the brief hero copy verbatim', () => {
    expect(home.hero.headline).toBe('STOCK UP. STAND OUT.')
    expect(home.hero.subheadline).toBe(
      'Your source for bulk flower, vapes, edibles & more.',
    )
    expect(home.hero.supporting).toBe(
      'Sign up to receive the current wholesale menu and connect with your dedicated salesperson.',
    )
    expect(home.hero.primaryCta).toBe('Get the Wholesale Menu')
    expect(home.hero.secondaryCta).toBe('Talk to Sales')
    expect(home.header.cta).toBe('Get the Wholesale Menu')
  })

  it('lists the six supply categories from the brief, in order', () => {
    expect(home.supply.categories).toEqual([
      'Bulk flower',
      'Vapes',
      'Edibles',
      'Joints and pre-rolls',
      'Concentrates',
      'HOUSE OF HELIX peptide strips',
    ])
  })

  it('uses the HOUSE OF HELIX callout verbatim', () => {
    expect(home.houseOfHelix.heading).toBe('HOUSE OF HELIX — BULK PEPTIDE STRIP SUPPLY')
    expect(home.houseOfHelix.body).toBe(
      'Smoke Show supplies HOUSE OF HELIX peptide strips in bulk. Request the menu and speak with our sales team about wholesale options.',
    )
  })

  it('follows the brief’s three how-it-works steps, in order', () => {
    expect(home.howItWorks.steps).toEqual([
      'Sign up',
      'Receive the menu',
      'Work with your dedicated salesperson',
    ])
  })

  it('uses the signup intro and confirmation verbatim', () => {
    expect(home.signup.intro).toBe(
      'Get the Smoke Show wholesale menu. Tell us about your business, and our team will connect you with a dedicated salesperson to help with availability and ordering.',
    )
    expect(home.signup.confirmation).toBe(
      'Thank you for signing up. Our team will send you the current wholesale menu and connect you with a dedicated salesperson to help with availability and your order.',
    )
  })

  it('points every menu button at the one signup form', () => {
    expect(signupAnchor).toBe('#signup')
  })

  it('agrees with the interim splash, which quotes the same brief', () => {
    expect(splash.headline).toBe(home.hero.headline)
    expect(splash.subheadline).toBe(home.hero.subheadline)
    expect(splash.categories).toEqual(home.supply.categories)
  })
})
