/**
 * Frozen compliance copy. These strings may be re-typeset but never reworded,
 * and are rendered only through `ComplianceText`. A guard test asserts them
 * verbatim, so any change here fails CI until the test is changed with it,
 * which is the point: rewording needs the client's sign-off.
 *
 * Source: design_handoff_wholesale_b2b/README.md § Compliance copy. Only the
 * strings the current scope renders are carried; the vape-programme strings
 * from the original handoff no longer describe the business and are left out
 * until the client supplies replacements.
 */

export const compliance = {
  gate: 'Confirm you are 21+ and buying for a licensed business.',
} as const

export type ComplianceKey = keyof typeof compliance
