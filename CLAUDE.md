# Project instructions

Guidance for Claude Code working in this repository.

---

## Project

- **What this is:** Smoke Show Labs — a B2B wholesale storefront through which
  licensed cannabis operators specify and price white-label vape products
  (hardware, terpenes, blending and filling, packaging).
- **Stack:** TypeScript on Next.js (App Router, server rendering), React, pnpm,
  Node 24. Styling is plain CSS with CSS Modules over a custom-property token
  system — deliberately not Tailwind, see below. Vitest for units, Playwright
  for end-to-end and visual review.
- **Hosting:** not yet decided. Server rendering is a hard requirement — route
  handlers, middleware and server actions all need a Node runtime, so a
  static-export host is not an option. `docs/CUSTOMIZATION.md` notes this is the
  decision that determines how the project deploys and rolls back, so settle it
  before filling in the deploy workflows.
- **Owner:** not yet assigned. `CODEOWNERS.example` stays a template until real
  teams exist and have repository access — see `docs/CUSTOMIZATION.md` step 2.

## Commands

These must match `.github/workflows/`. The workflows invoke the same package
scripts, so there is one definition of each command rather than two.

| Task | Command |
| --- | --- |
| Install | `pnpm install --frozen-lockfile` |
| Lint | `pnpm lint` (`tsc --noEmit`, ESLint, Stylelint, Prettier `--check`) |
| Test | `pnpm test` (Vitest) |
| Build | `pnpm build` (`next build`) |
| Run locally | `pnpm dev` |
| Audit | `pnpm audit --audit-level=high` |
| Format | `pnpm format` |

Keep this table and the workflows in sync. If they drift, CI and local runs stop
agreeing and the AI review gate loses its reference point.

CI has no `setup-*` action: it uses the runner's preinstalled Node and reaches
pnpm through `corepack pnpm ...`, which resolves the version pinned by
`packageManager` in `package.json`. Each job asserts the runner's Node major
matches `.nvmrc` and fails if it does not.

## Layout

```
src/app/          routes (App Router). Screens map to routes as in
                  docs/design/SCREEN_MAP.md; api/ holds route handlers.
src/styles/       tokens.css (both themes, lifted verbatim from the handoff),
                  base.css, motion.css, utilities.css (.ov and .sl only)
src/components/   layout/ primitives/ product/ hero/ compliance/
src/content/      compliance.ts — the frozen compliance strings
src/domain/       Zod schemas and the types inferred from them
src/data/         typed fixtures, parsed by their schema
src/server/       server-only code: pricing/, repositories/, session/, uploads/
src/lib/          shared pure helpers (money, format, countdown)
tests/            unit/ guards/ e2e/ visual/
public/           fonts/, brand/, photography/ — all assets are local
design_handoff_wholesale_b2b/
                  the design specification. Reference only, never imported.
```

### Things about this codebase that are load-bearing

- **The volume discount table is server-owned.** It lives in
  `src/server/pricing/discount.server.ts` behind `import 'server-only'` and must
  never reach the browser. The client sends option IDs and a quantity and
  receives computed numbers; it never applies the multiplier itself. All totals
  are derived, never stored.
- **Compliance copy may be re-typeset but never reworded.** Six strings live in
  `src/content/compliance.ts` and are rendered only through `ComplianceText`. A
  test asserts them verbatim.
- **Animation uses the `translate` / `rotate` / `scale` longhands, never the
  `transform` shorthand.** The hero's smoke plumes compose their drift; the
  shorthand overwrites it. Stylelint fails the build on `transform` in animation
  CSS.
- **Tabular numerals are load-bearing**, not decoration: prices, spec tables and
  the countdown rely on them to column-align.
- **No icons, no emoji, no CDN, no analytics, no external requests.** Every
  indicator is a coloured square, dot, bar or rule. `next.config.ts` keeps
  `images.remotePatterns` empty so `next/image` can only serve local files.
- **Two themes over one markup tree**, applied as a root class. Brand (dark) is
  the shipping default; Editorial (light) is the `:root` token set. Never fork
  the markup per theme.
- **The licence gate is not access control.** It is a consent interstitial backed
  by a cookie any visitor can set. Authorization belongs in server actions and
  page-level session checks, not in middleware.
- **The design handoff's `.dc.html` must not be ported.** It runs on a bespoke
  in-house template runtime (`<x-dc>`, `{{ holes }}`, `DCLogic`) that does not
  exist here, and it carries 1,199 inline styles with no class vocabulary. Read
  it for tokens, copy, pricing and motion parameters; re-express the structure.

---

## Lifecycle rules

These apply regardless of stack. Do not remove them.

1. **Work starts from an issue.** No branch without a tracking issue.
2. **Branch from the default branch.** Naming: `<type>/<issue-number>-<slug>`,
   e.g. `feat/142-token-refresh`. Types: `feat`, `fix`, `chore`, `docs`, `refactor`.
3. **Never commit directly to the default branch.** Every change lands via pull
   request.
4. **One PR, one concern.** If a PR needs two paragraphs to explain why it
   touches unrelated areas, split it.
5. **Do not edit `.github/workflows/` as a side effect** of a feature change.
   Workflow changes ship in their own PR so they are reviewed on their own terms.
6. **Do not weaken a `permissions:` block** to make a job pass. Escalating a
   workflow's token scope is a security change and needs its own PR and review.
7. **Never hardcode a secret.** Read from GitHub Actions secrets or the
   platform's secret store. If you need a new secret, say so in the PR body
   rather than inventing a value.
8. **Release metadata is append-only.** Records in `releases/` are written once
   and never edited. `commit_sha` identifies the record. See
   [`docs/RELEASE_METADATA.md`](docs/RELEASE_METADATA.md).

## Database migrations

Any change that adds, alters, or drops schema must:

- set `database_migration: true` in the release metadata record,
- state in the PR body whether the migration is backward compatible,
- state whether rollback is safe; if it is not, set `rollback_safe: false`.

A destructive migration makes a release non-rollback-safe. Say so explicitly
rather than leaving it implied.

## Review gates

A change reaches production only after all of these:

| Gate | Who or what |
| --- | --- |
| Automated checks | `lint`, `test`, `build`, `security-check` |
| AI review | `.claude/agents/security-reviewer.md` |
| Peer approval | a human owner (see `CODEOWNERS.example`; not yet operational) |
| Staging verification | `staging-deploy` + `staging-health-check` |
| Business approval | required reviewer on the `production` Environment |
| Production health | `production-health-check` |

Full description: [`docs/LIFECYCLE.md`](docs/LIFECYCLE.md).

## When asked to deploy

Do not run deploy workflows on your own initiative. Deploys are triggered by a
human via `workflow_dispatch`, and production additionally requires the
Environment reviewer to approve. If asked to "ship it," prepare the release
metadata record and report what is still missing.
