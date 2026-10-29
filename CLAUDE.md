# Project instructions

Guidance for Claude Code working in this repository.

---

## Project

- **What this is:** Smoke Show Labs — a wholesale lead-capture site for
  licensed cannabis operators (splash, wholesale signup with email
  verification, policy pages) plus the Smoke Signals blog, served at
  `/smokesignals` from a separate blog API Worker in `services/blog-api/`.
  The catalogue and quote-pricing prototype is parked (issue #7), not shipped.
- **Stack:** TypeScript on Next.js (App Router, server rendering), React, pnpm,
  Node 22 (`.nvmrc` pins the major, `engines` requires >=22.13). Styling is
  plain CSS with CSS Modules over a custom-property token system — deliberately
  not Tailwind, see below. Vitest for units, Playwright for end-to-end and
  visual review.
- **Hosting:** Cloudflare Workers through vinext, configured by
  `cloudflare.config.ts` and operated with the `cf` CLI; D1 for records, the
  `send_email` binding for mail, a rate-limit binding for the form. See
  `docs/decisions/0001-cloudflare-workers-adapter.md`. Environments are Vite
  modes (`--mode staging|production`). All binding access goes through
  `src/server/cloudflare/env.ts`. `pnpm preview` is part of verifying any
  server change: `vite dev` alone is not proof the Workers build works.
- **Owner:** not yet assigned. `CODEOWNERS.example` stays a template until real
  teams exist and have repository access — see `docs/CUSTOMIZATION.md` step 2.

## Commands

These must match `.github/workflows/`. The check workflows invoke these package
scripts; the deploy workflows call `vite build` and `cf deploy --prebuilt`
directly, so a change to a build or deploy command has to be made in both
places.

| Task | Command |
| --- | --- |
| Install | `pnpm install --frozen-lockfile` |
| Lint | `pnpm lint` (`cf workers types`, `tsc --noEmit`, ESLint, Stylelint, Prettier `--check`) |
| Test | `pnpm test` (Vitest) |
| Build | `pnpm build` (`vite build` for the production Worker, then the blog API Worker and CLI) |
| Build for preview | `pnpm build:local` (`--mode local-preview`) |
| Run locally | `pnpm dev`; `pnpm preview` serves the built Worker |
| Local D1 | `pnpm db:migrate:local`; `pnpm --dir services/blog-api db:migrate:local` for the blog API |
| Remote D1 | `pnpm db:migrate:staging`, `pnpm db:migrate:prod` (the deploy workflows run these) |
| Blog checks | `pnpm test:blog-api`, `test:blog-backend`, `test:blog-library` |
| Audit | `pnpm audit --audit-level=high` |
| Format | `pnpm format` |

Keep this table and the workflows in sync. If they drift, CI and local runs stop
agreeing and the AI review gate loses its reference point.

Every CI job that runs Node installs it with `actions/setup-node`, pinned to a
commit and reading `node-version-file: .nvmrc`, so the file is the single source
of truth for the major; each job then asserts the active Node still matches
`.nvmrc` before doing any work. pnpm is reached through `corepack pnpm ...`,
which resolves the version pinned by `packageManager` in `package.json`.

## Layout

```
src/app/          routes (App Router): /, wholesale, smokesignals, policies,
                  verify-email, robots and sitemap; api/ holds health and
                  leads route handlers.
src/styles/       tokens.css (both themes, lifted verbatim from the handoff),
                  base.css, motion.css, utilities.css (.sl only)
src/components/   layout/ primitives/ product/ hero/ compliance/
src/content/      compliance.ts — the frozen compliance strings
src/domain/       Zod schemas and the types inferred from them
src/server/       server-only code: session/, blog/, leads/, cloudflare/
tests/            unit/ guards/ e2e/ (including browser screenshots)
public/           fonts/, brand/, photography/ — all assets are local
policies/         Company governance vendored from helix-engineering: the
                  policies, standards, security rules and templates this
                  project follows. Read them; never import them. The sibling
                  directories standards/, security/, onboarding/, templates/
                  and architecture/ are part of the same set, and the
                  provenance, index and caveats live in policies/README.md.
design_handoff_wholesale_b2b/
                  the design specification. Reference only, never imported.
```

### Things about this codebase that are load-bearing

- **Pricing is parked, not shipped.** The catalogue, quote builder and volume
  discount prototype live on branch `chore/23-park-quote-pricing` (issue #7)
  and are not on `main`. If it returns, the discount table stays server-owned
  behind `import 'server-only'`: the client sends option IDs and a quantity
  and receives computed numbers, and totals are derived, never stored.
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
  One client-approved exception: the inline SVG shield in the heading of
  `src/components/layout/HempNotice.tsx` (issue #39). It does not license icons
  anywhere else.
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
   e.g. `feat/142-token-refresh`. Types: `feat`, `fix`, `chore`, `docs`,
   `refactor`, `test`, `ci`.
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
| Automated checks | `lint`, `test`, `build`, `security-check`; `blog-api-checks` when the API changes |
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
