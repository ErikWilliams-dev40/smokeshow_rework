# Smoke Show Labs — wholesale storefront

A B2B storefront through which **licensed cannabis operators** specify and price
white-label vape products: hardware, terpenes, blending and filling, and
packaging. Trade-only but not price-gated — a licence gate guards entry, a
two-step registration captures the lead before asking for paperwork, and tiered
per-unit pricing is visible without an account.

Built on the Project Helix repository template, so the delivery lifecycle,
review gates and release-metadata tooling described in [`docs/`](docs/) apply to
this project as shipped.

---

## Status

Early. The toolchain and the four CI check workflows are configured and passing;
the screens are not built yet.

| Area | State |
| --- | --- |
| Toolchain, lint, test, build | Configured and passing |
| Design system, primitives, chrome | Not started |
| The thirteen screens | Not started |
| Deploy workflows | Still placeholders — they fail by design |
| GitHub repository | **Does not exist yet.** No remote; history is local only |

Because there is no remote, none of the GitHub-enforced gates are active:
no branch protection, no required status checks, no Environments, no business
approval. The workflows have also never executed. Treat every gate as advisory
until the repository exists and [`docs/LIFECYCLE.md`](docs/LIFECYCLE.md)'s
configuration checklist has been worked through.

## Quick start

```sh
corepack enable pnpm    # or: npm install -g pnpm
pnpm install
pnpm dev                # http://localhost:3000
```

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the full setup, the checks to run
before a pull request, and how to verify a screen against the design.

## Stack

TypeScript on Next.js (App Router, **server rendering**), React, pnpm, Node 24.
Styling is plain CSS with CSS Modules over a custom-property token system.
Vitest for units, Playwright for end-to-end and visual review.

Server rendering is a requirement rather than a preference. The volume discount
table must never reach the browser, and `import 'server-only'` turns that from a
code-review habit into a compile error. Route handlers, middleware for the
licence gate, and server actions for registration and quote submission all need
a Node runtime, so a static-export host is not an option.

Tailwind was considered and rejected. The design handoff is already a
custom-property system — forty-odd tokens reassigned wholesale by a single root
class — and two themes over one markup tree is precisely what custom properties
do natively.

## The design specification

[`design_handoff_wholesale_b2b/`](design_handoff_wholesale_b2b/) is the normative
spec: thirteen 1080px artboards with final colours, typography, spacing, motion
timings and copy, plus one screenshot per screen as the verification reference.

Its `.dc.html` prototype is **reference only and must not be ported.** It runs on
a bespoke in-house template runtime that does not exist in this codebase, and it
carries 1,199 inline styles with no class vocabulary. Read it for tokens, copy,
pricing logic and motion parameters; re-express the structure.

Product photography in the prototype is placeholder material hotlinked to a
Shopify CDN. It must be vendored locally before anything ships — the design
forbids external requests — and the real product shoot has not happened.

## Constraints that are not preferences

- **The volume discount table is server-owned** and never client-trusted. All
  totals are derived, never stored.
- **Compliance copy may be re-typeset but never reworded.** Six strings live in
  one module and a test asserts them verbatim.
- **No icons, no emoji, no CDN, no analytics, no external requests.** Every
  indicator is a coloured square, dot, bar or rule.
- **Animation uses the `translate` / `rotate` / `scale` longhands**, never the
  `transform` shorthand. Stylelint enforces this.
- **Accessibility pairings in the handoff are already resolved.** They encode
  specific contrast findings; do not "improve" them.

See [`CLAUDE.md`](CLAUDE.md) for the full list and the reasoning.

## Known gaps

Deliberate, and tracked rather than forgotten:

- **No responsive design.** All thirteen artboards are fixed 1080px desktop.
  Breakpoints need design sign-off, which the handoff explicitly withholds.
- **No authentication.** The licence gate is a consent interstitial backed by a
  cookie any visitor can set. It is not access control, and the account
  dashboard renders fixture data.
- **No database.** Data comes from typed fixtures behind repository interfaces,
  so the front end can be built before a backend exists.
- **Loading, error and empty states were never designed** and are being invented.
- **Quote steps 1 and 3 were never designed.** Only step 2 of 3 exists in the
  handoff.

## Deployment

Contributors do not deploy. The deploy workflows are still placeholders that
fail by design; a placeholder exiting `0` would report a successful release of
code that was never shipped. See
[`docs/LIFECYCLE.md`](docs/LIFECYCLE.md) for the gate-by-gate path to production
and [`docs/CUSTOMIZATION.md`](docs/CUSTOMIZATION.md) for what still has to be
filled in.
