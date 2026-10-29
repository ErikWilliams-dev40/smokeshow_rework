# VIP Text Club promo dialog

A dismissable dialog shown after the licence gate is passed: dimmed overlay,
Smoke Show branding, a short headline, a QR code that opens the SMS signup page,
and a text "Close" button. Revised 2026-10-14 to fit this repository's stack and
rules; the first draft assumed a plain HTML site.

Status: not started. Waits on the Friday 2026-10-16 meeting (see Open
questions) and a tracking issue. Branch as `feat/<issue>-text-club-dialog`.
The outcome of the 2026-10-16 meeting is not recorded here as of 2026-10-29;
the open questions below still stand until it is.

## Plan

| # | Task | Model |
| --- | --- | --- |
| 1 | QR code: generate an SVG at build time from the real signup link with a local script (`qrcode` npm package, dev dependency). Output to `public/brand/text-club-qr.svg`. No image service, no CDN | Haiku 5.5 |
| 2 | Panel artwork: Smoke Show logo and cyan/pink tokens only. Headline and "Scan to join SMS alerts" as real text, not baked into an image. No leaf art, no bell or chat icons, no third-party "Powered by" mark | Haiku 5.5 |
| 3 | `TextClubDialog` client component in `src/components/promo/`, built on the native `<dialog>` element with `showModal()` | Sonnet 5.5 |
| 4 | CSS Module using tokens: overlay via `::backdrop`, `rgb(0 0 0 / 75%)` notation, `--r-btn` radius, `.sl` footnote for the consent line | Haiku 5.5 |
| 5 | Open logic: render only when the gate cookie is present (set now or on an earlier visit), 1.5 s delay, dismissed state kept seven days in `localStorage` behind try/catch | Sonnet 5.5 |
| 6 | Accessibility: `aria-labelledby` on the heading, focus lands on "Close", `<dialog>` traps focus and handles Escape and focus return, panel tappable on phones, 44 px minimum targets | Sonnet 5.5 |
| 7 | Tests: Vitest for the dismissal window and storage guard; Playwright for gate-then-dialog on desktop and mobile widths and both themes | Haiku 5.5 |

## Component sketch

```tsx
'use client'

import { useEffect, useRef } from 'react'
import styles from './TextClubDialog.module.css'

const KEY = 'textClubDismissedAt'
const WINDOW_MS = 7 * 24 * 60 * 60 * 1000
const DELAY_MS = 1500

function dismissedRecently(): boolean {
  try {
    const at = Number(window.localStorage.getItem(KEY))
    return at > 0 && Date.now() - at < WINDOW_MS
  } catch {
    return false
  }
}

function markDismissed(): void {
  try {
    window.localStorage.setItem(KEY, String(Date.now()))
  } catch {
    /* private mode or storage blocked: the dialog still closes */
  }
}

export function TextClubDialog({ signupHref }: { signupHref: string }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (dismissedRecently()) return
    const id = window.setTimeout(() => ref.current?.showModal(), DELAY_MS)
    return () => window.clearTimeout(id)
  }, [])

  function close() {
    markDismissed()
    ref.current?.close()
  }

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="text-club-title"
      onClose={markDismissed}
      onClick={(e) => e.target === ref.current && close()}
    >
      <div className={styles.panel}>
        <h2 id="text-club-title">Join the VIP text club</h2>
        <p>Scan to get a text when new drops and restocks land.</p>
        <a href={signupHref} className={styles.qr}>
          <img src="/brand/text-club-qr.svg" alt="QR code for the Smoke Show text club signup" width={220} height={220} />
          <span>On a phone? Tap to join.</span>
        </a>
        <p className="sl">{/* consent line, wording to come from the client */}</p>
        <button type="button" onClick={close} autoFocus>
          Close
        </button>
      </div>
    </dialog>
  )
}
```

The page renders `<TextClubDialog>` only when the server has read the gate
cookie. That covers both the visitor who just clicked through the gate and the
returning visitor who never sees it. `showModal()` gives the overlay, focus
trap, Escape handling and focus return for free.

## CSS notes

```css
.dialog {
  border: 0;
  padding: 0;
  background: transparent;
  max-width: min(500px, 90vw);
}

.dialog::backdrop {
  background: rgb(0 0 0 / 75%);
}

.panel {
  background: var(--slab);
  color: var(--on-slab);
  border-radius: var(--r-btn);
  padding: 32px;
}
```

- Colours come from `src/styles/tokens.css`. No hard-coded black or white.
- `rgba(...)` fails Stylelint outside `tokens.css`; use `rgb(... / ...)`.
- The dialog works in both themes over the same markup. Do not fork it.
- Nothing in this component animates, so the `transform` rule does not apply.

## What changed from the first draft

| First draft | Now | Why |
| --- | --- | --- |
| Image copied from the Hemp Supply Prime popup | Smoke Show branding, real text, local QR | Competitor branding and leaf art; the client is not a hemp supplier; baked-in text is unreadable to screen readers and ignores themes |
| "×" close button | Text button "Close" | Project rule: no icons or glyphs |
| Plain HTML/JS, `div` overlay, manual focus | React client component on `<dialog>` | Stack is Next.js; `<dialog>` traps focus and handles Escape |
| Opened from the age gate's "Yes" click | Opened whenever the gate cookie is present | Returning visitors skip the click and would never see it |
| Unguarded `localStorage` | try/catch on read and write | Private browsing throws on access |
| `rgba(0,0,0,.75)` | `rgb(0 0 0 / 75%)` via tokens | Stylelint standard config |
| Umbrella named as provider | Provider to confirm | "Powered by Umbrella" came from the competitor's popup |

## Open questions for Friday 2026-10-16

1. SMS provider: is it Umbrella, or still to choose? Who manages the list?
2. The signup link the QR code points to.
3. Consent wording for the signup page: message frequency, "Msg & data rates
   may apply", "Reply STOP to opt out", terms and privacy links. The provider
   may require exact text.
4. Timing: right after the gate, or later in the visit so "Get the Wholesale
   Menu" stays the first ask. Recommendation: later.
5. Provider monthly fee, so the memo's cost table can carry it.

## Not in scope

- No analytics or tracking of opens and dismissals.
- No popup plugin or SMS widget embedded in the page. The site makes no
  outside requests; the provider's page handles opt-in.
