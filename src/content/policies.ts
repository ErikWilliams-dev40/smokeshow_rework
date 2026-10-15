/**
 * Placeholder copy for the privacy and terms pages (issue #14).
 *
 * The client supplies the real text (target Tue 2026-10-20). Until then each
 * page states plainly that it is a placeholder and carries no terms, so nobody
 * mistakes it for a policy in effect. Replacing a page is a change to this file
 * only: swap `sections`, drop `notice`, and set `placeholder` to false.
 */

export type PolicyPageCopy = {
  readonly placeholder: boolean
  readonly title: string
  readonly notice: string
  readonly sections: readonly string[]
}

const notice =
  'Placeholder. This page will carry Smoke Show Labs’ final text once the client supplies it. Nothing here is in effect yet.'

export const privacy: PolicyPageCopy = {
  placeholder: true,
  title: 'Privacy Policy',
  notice,
  sections: [
    'What we collect',
    'How we use it',
    'Who we share it with',
    'How long we keep it',
    'Your choices',
    'Contact',
  ],
}

export const terms: PolicyPageCopy = {
  placeholder: true,
  title: 'Terms of Use',
  notice,
  sections: [
    'Who may use this site',
    'Wholesale enquiries',
    'Intellectual property',
    'Limitation of liability',
    'Governing law',
    'Contact',
  ],
}
