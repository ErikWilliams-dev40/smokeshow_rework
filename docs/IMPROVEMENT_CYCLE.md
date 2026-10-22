# Improvement cycle

A six-hour, time-boxed loop you can repeat. Each pass ships one engineering PR and one SEO/AEO PR (answer engine optimisation: being cited by AI answer engines), may ship a quick-win PR, and leaves the backlog better ranked than before.

## Context

The site is server-rendered Next.js on Cloudflare Workers (vinext). Search engines and AI answer engines can't currently find it. `/` and `/wholesale` render only `AgeGate` unless the `ss_gate` cookie is set (`src/server/session/gate.ts`), and crawlers never set it. That leaves the gate, `/terms` and `/privacy` as the only indexable pages. There is no sitemap, robots file, canonical URL, structured data or Open Graph data, and staging (workers.dev) is publicly indexable.

Decisions already made:

- **New ungated public pages** carry organic and answer-engine traffic. These are category hubs, guides and an FAQ. Pricing, the menu and quoting stay behind the gate, which remains a consent step on transactional routes only.
- **The canonical origin is not chosen yet.** It is read from a `SITE_URL` binding through `src/server/cloudflare/env.ts`. Every mode except production sends noindex.

The loop works inside CLAUDE.md's rules:

- Every change starts from an issue.
- One PR covers one concern.
- Workflow changes are never made as a side effect.
- Deploys are never run on Claude's initiative.
- No analytics, external requests or icons.
- Prices never reach the client, and that includes JSON-LD.
- Compliance strings stay frozen.

## The cycle (360 min)

Each block has a goal, tasks, a done-when test and the most cost-efficient model for it.

### Block 0: Baseline (0:00–0:25) — **Haiku 5.5**

- **Goal:** know the repo's engineering and search state before touching it.
- **Tasks:**
  - `git fetch` and branch from the default branch.
  - Run `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm test`, `pnpm build` and `pnpm audit --audit-level=high`.
  - Run `pnpm preview` and use curl to check `/robots.txt`, `/sitemap.xml`, the canonical tag and JSON-LD on each indexable route, and that a public page returns content rather than the gate when no cookie is sent.
  - Once Search Console is live, record indexed pages, impressions and clicks for the last 28 days.
  - Ask 3 fixed target questions in 2 AI answer engines and record whether Smoke Show Labs is cited (the AEO spot-check).
- **Done when:** a new row in `docs/improvement-log.md` has every engineering and search number. Any red check becomes the top priority for Block 2.

### Block 1: Audit and pick (0:25–0:55) — **Sonnet 5.5**

- **Goal:** choose work by its value, not by what's convenient.
- **Tasks:**
  - Sweep one rotating lens per cycle: (1) docs-vs-code drift, (2) tests and guards, (3) performance and accessibility, (4) security and dependencies, (5) product features.
  - File an issue for each finding.
  - Score each one as impact × confidence ÷ effort.
  - Pick **one primary engineering item** (≤2h) and **one quick win** (≤30 min).
  - Take the next unfinished step of the [SEO/AEO roadmap](#seoaeo-roadmap) as the **SEO item**, and file an issue for it if it has none.
- **Done when:** all three picks are GitHub issues with acceptance criteria written down. Anything bigger is split into issues for later cycles.

### Block 2: Primary engineering build (0:55–2:45, includes a 10-min break) — **Opus 5.5** for design-sensitive or server/pricing work, **Sonnet 5.5** otherwise

- **Goal:** ship the primary item as one PR.
- **Tasks:**
  - Use a `<type>/<issue>-<slug>` branch.
  - Write the failing test or guard first, then implement.
  - For server changes, run `pnpm preview` as well as `vite dev`.
  - Respect the load-bearing rules: server-owned pricing, frozen compliance copy, animation longhands only, no icons or external requests.
- **Done when:** the acceptance criteria are met, a new or updated test covers them, and lint, test and build all pass locally.
- **If time runs out:** cut scope to what passes and file the rest as a follow-up issue. Never extend the block.

### Block 3: SEO/AEO build (2:45–4:15, includes a 10-min break) — model per roadmap step

- **Goal:** ship this cycle's roadmap step as its own PR.
- **Tasks:** the step's tasks from the roadmap below, with a guard or unit test first, on its own `feat/<issue>-<slug>` branch.
- **Done when:** the step's done-when test passes and lint, test and build all pass locally.
- **If time runs out:** cut scope as in Block 2.

### Block 4: Answer-first content (4:15–4:45) — **Opus 5.5**

- **Goal:** add or improve one piece of content that answer engines can quote.
- **Tasks:**
  - Draft or refresh one FAQ entry, guide section or hub intro as a typed content module under `src/content/pages/`.
  - Lead with a direct answer of 40–60 words, then the detail.
  - Use a question-phrased heading and plain, factual language with no medical or effect claims.
  - Write every draft for **client and compliance review**. Nothing is published until it is approved.
  - Before Step 3 of the roadmap has shipped, draft in the issue instead of in the code.
- **Done when:** the draft is in the SEO PR or the issue, is tagged `needs-compliance-review`, and has its target question recorded in the log.

### Block 5: Quick win (4:45–5:15) — **Haiku 5.5**

- **Goal:** one small, separate improvement: a doc fix, a missing guard or a dependency bump.
- **Done when:** a separate PR is green locally, or the item is put back in the backlog with a note.

### Block 6: Review and PR (5:15–5:40) — **Sonnet 5.5** for the PRs, the **security-reviewer** agent for the review gate

- **Goal:** make every PR from this cycle reviewable.
- **Tasks:**
  - Self-review each diff adversarially.
  - Run the `security-reviewer` agent on each PR.
  - On SEO PRs, check that no price or discount field appears in rendered HTML or JSON-LD.
  - Open the PRs using the repo template, including the migration and rollback statements if schema changed.
  - Subscribe to PR activity.
- **Done when:** every PR is open, CI is running and there are no unaddressed security findings.

### Block 7: Retro and log (5:40–6:00) — **Haiku 5.5**

- **Goal:** make the next cycle start sharper.
- **Tasks:**
  - Re-run the Block 0 checks and append the "after" values.
  - Note what took longer than planned.
  - Re-rank the backlog.
  - Rotate the audit lens.
  - Mark the roadmap step done if it shipped.
- **Done when:** the log row shows before → after and the next cycle's top three issues are labelled `next-cycle`.

### Cycle-level "better than last" rule

A cycle counts only if at least one of these improved and none got worse:

- checks passing
- test or guard count
- audit findings
- docs-vs-code drift items
- roadmap steps shipped
- indexed pages or AEO citations
- open `next-cycle` issues resolved

## SEO/AEO roadmap

Take one step per cycle, in order. Each step is one issue and one PR.

### Step 1: Indexing foundation — **Sonnet 5.5**

- **Site URL:** add `SITE_URL` to `cloudflare.config.ts` for each mode, with production set to a `REPLACE-…` placeholder like `D1_IDS`. Expose `siteUrl()` and `isIndexable()` through `env.ts`.
- **Root metadata:** in `src/app/layout.tsx`, switch to `generateMetadata` and set:
  - `metadataBase`
  - a title template
  - default Open Graph data using `public/brand/ss-logo.png`
  - `robots: noindex` outside production
- **Robots and sitemap:** add `src/app/robots.ts` and `src/app/sitemap.ts`, both built from one route registry, `src/content/seo/routes.ts`. Check first that vinext supports metadata routes. If it doesn't, use route handlers instead.
- **AEO crawlers:** robots names Googlebot, Bingbot and the AI crawlers (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended). Production allows the public pages and disallows the gated routes.
- **Header backstop:** add `X-Robots-Tag: noindex` on non-production responses, in the Worker response path, not middleware.
- **Canonicals:** add one on every page. `?declined=1` points at the clean URL.
- **Done when:** unit tests cover robots and sitemap in each mode, and `--mode staging` serves `Disallow: /` plus the header.

### Step 2: Structured data — **Sonnet 5.5**

- **Builders and component:** add `src/components/seo/JsonLd.tsx` and pure builders in `src/lib/seo/schema.ts`.
- **Schema types:**
  - `Organization` and `WebSite` in the layout
  - `BreadcrumbList` on public pages
  - `FAQPage` on the FAQ
  - `Product`/`ProductGroup` on category pages from `src/data/products.ts`, with no `Offer` and no price
- **AEO entity:** give `Organization` stable `@id`s so the entity is described the same way on every page.
- **Done when:** a guard test asserts JSON-LD never contains `price`, `offers` or discount fields, and the Rich Results Test passes on staging.

### Step 3: Public content architecture — **Opus 5.5**

- **URL tree:**
  - `/white-label-vapes` hub, with `/hardware`, `/terpenes`, `/filling` and `/packaging` under it
  - `/guides/<slug>`
  - `/faq`
  - `/about`, if copy exists
- **Page rules:** ungated, statically rendered and price-free. Each page ends with a CTA to `/wholesale` through `InterestLink`.
- **Content and design:** content lives in Zod-validated modules under `src/content/pages/`. Add the pages to `docs/design/SCREEN_MAP.md`.
- **Styling and compliance:** pages use the existing tokens and both themes, with no icons. Any compliance notice goes through `ComplianceText` only.
- **AEO:** every page opens with a direct-answer summary and uses question-phrased H2s that come from the FAQ question list.
- **Done when:** curl without the cookie returns full content, both themes render, and the copy is marked approved.

### Step 4: Internal linking — **Haiku 5.5**

- **Footer and nav:** add a footer linking the hub, guides, FAQ, terms and privacy, and add the hub to `Navigation.tsx`.
- **Breadcrumbs:** visible breadcrumbs share one data source with `BreadcrumbList`.
- **Related links:** a `related` field drives links from each guide to 2–3 category pages.
- **Done when:** a guard test fails on orphan routes or broken internal hrefs.

### Step 5: Performance and Core Web Vitals — **Sonnet 5.5** (branch type `fix/` or `refactor/`)

- **Hero:** load `three`/`ThreeSmoke` with `next/dynamic` and `ssr:false` after first paint, with a static poster as the LCP element. `prefers-reduced-motion` keeps the poster. Public pages don't load `three`.
- **Fonts:** preload the three woff2 files with `font-display: swap` and metric-matched fallbacks.
- **Images:** use WebP or AVIF brand images through `next/image` with explicit sizes.
- **Caching:** set `immutable` on `/_next/static/*` and `/fonts/*`.
- **Done when:** a Playwright budget spec for LCP, CLS and JS size passes against `pnpm preview` on `/` and one hub page.

### Step 6: Search Console, monitoring and strategy docs — **Haiku 5.5** for `docs/SEO.md`, **Opus 5.5** for `docs/SEO_STRATEGY.md`

- **`docs/SEO.md`:**
  - Verify a Domain property through a DNS TXT record in Cloudflare. This needs no on-site tag, so it keeps to the no-external-requests rule.
  - Submit `sitemap.xml` and import into Bing Webmaster Tools. Bing's index also feeds several AI answer engines.
  - Run the Rich Results Test before each JSON-LD release, and do a monthly GSC export, since GSC is the only traffic source.
  - A human does the verification once the production domain is decided.
- **`docs/SEO_STRATEGY.md`:**
  - **Audience:** licensed operators and brand owners.
  - **Keyword and question clusters:** white-label and private-label cartridges, all-in-one hardware, wholesale terpenes, filling services and custom packaging, each mapped to one page so pages don't compete for the same queries.
  - **Calendar:** 2 guides a month.
  - **Link building:** directories and trade associations, plus case studies with client approval.
  - **Compliance guardrails:** no medical claims, and state-by-state wording reviewed.
  - **AEO:** the fixed list of target questions used in the Block 0 spot-check.
- **Done when:** both docs are merged and the GSC property is verified, or an issue records that verification is waiting on the domain.

After Step 6, Block 3 runs from the strategy's content calendar and from Search Console findings: pages with impressions but no clicks, coverage errors and questions where the site is not cited.

## Seed backlog from the first review

1. **CLAUDE.md drift.** CLAUDE.md says Node 24, but `.nvmrc` is `22`, `package.json` has `engines >=22.12 <23`, and the runner has v22.22. It also lists `src/lib/`, `src/server/repositories/`, `src/server/uploads/`, `tests/visual/` and `docs/design/SCREEN_MAP.md`, none of which exist. This is the quick win for cycle 1.
2. **`pnpm install` fails under corepack on Node 22.** The pinned `pnpm@12.3.4` fails to load (`pnpm.cjs` not found). Block 0 depends on it, so fix it first.
3. **D1 has no migrations.** `migrations/` is empty, yet the D1 bindings are wired up. Decide on the first schema or document that it's intentionally empty.
4. **The production D1 id is a placeholder** (`cloudflare.config.ts`). This needs a human, so file an issue only.
5. **There is no visual regression suite**, although CLAUDE.md promises Playwright visual review. Add `tests/visual/` for both themes.
6. **CODEOWNERS is still a template.** This needs a human decision, so file an issue only.
7. **The production canonical domain is undecided.** Steps 1 and 6 of the SEO/AEO roadmap depend on it.

## Verification

- After each cycle, `docs/improvement-log.md` has a before/after row, every PR from the cycle is open with green CI, and backlog issues carry `next-cycle` labels.
- This document passes `pnpm lint` (Prettier).
