# Smoke Show Labs

Smoke Show Labs is a wholesale lead-generation website for buyers of bulk
flower, vapes, edibles, joints and pre-rolls, concentrates, and HOUSE OF HELIX
peptide strips. The first launch centers on **Get the Wholesale Menu**:

**Signup → Confirm email → Team follow-up → Current wholesale materials.**

The salesperson confirms availability, quantities and the final total before
sending a payment link. Menu delivery can be manual at launch; the website
must not promise instant delivery or a callback deadline.

Repository: [House-of-Helix-CMD/smokeshow_rework](https://github.com/House-of-Helix-CMD/smokeshow_rework).
Built from the Project Helix application template.

## Current status

The four-screen frontend design is implemented: age gate, session intro, homepage
and `/wholesale` signup. The wholesale overview (`/wholesale-products`), four policy pages and Smoke Signals blog are public routes with shared navigation, metadata and structured data. Lead capture is implemented; deployed delivery requires configuration.

| Area | Current state |
| --- | --- |
| Frontend foundation | Cyan/pink Brand tokens, base styles, ambient motion and self-hosted fonts |
| Homepage | Responsive screenshot recreation with hero form, brands, categories, Helix, process and contact footer |
| Sales phone strip | Site-wide strip above every route with the sales number, shared with the homepage contact section (#75) |
| Policy pages | Final Return & Exchange (`/returns`), Shipping (`/shipping`), Privacy (`/privacy`) and Terms of Website Use (`/terms`) copy, public without consent and linked from the footer (#44, #46, #48, #52, #56) |
| Blog | Smoke Signals magazine, category archives, search and articles at `/smokesignals`, served from a private server-side API (#76, #83); see [Public blog](#public-blog) |
| Health endpoint | Uncached `GET /api/health` reports the deployed commit and a D1 check; 503 when D1 does not answer, with bounded, redacted failure logs (#68) |
| Consent session | Server-set 30-day consent cookie, Secure in production builds, with fixed post-consent destinations (#67) |
| Tests | Vitest guards, validation and draft tests; Playwright regressions against the production preview, plus a stubbed blog API suite |
| Governance | Vendored policies, standards, security guidance and onboarding documents |
| Brand assets | Local HOUSE OF HELIX logo variants in `public/brand/` |
| Compliance copy | Age-gate sentence and a site-wide hemp product notice (21+) on every route, frozen in `src/content/compliance.ts` and guarded verbatim |
| Pricing (not launched) | Server-only quote and discount modules, product data and domain schemas with unit tests (#36); selections are validated at the estimator boundary (#69); not wired into any route |
| Signup, lead storage and email | D1 persistence, email confirmation and retry outbox implemented; deployed delivery disabled until configured |
| Hosting and deployment | Cloudflare Workers via vinext and the `cf` CLI ([ADR-0001](docs/decisions/0001-cloudflare-workers-adapter.md)); staging deploys run in CI through the Deploy workflow (#37, #38); guarded production deploy and rollback workflows are prepared; launch configuration and release approvals remain outstanding |

The recent frontend foundation is reusable for the launch. The quote/pricing
prototype was merged in #36 as server-side code that no page uses yet. It is
parked for later and is not part of the first launch. Accounts, checkout, live
inventory, pricing tiers and a full product catalogue are outside the first launch.

## Run locally

Use **Node 22.13 or later within Node 22** (`.nvmrc` pins major 22, `engines`
requires >=22.13) and **pnpm 12.3.4** (`package.json` pins the package
manager). CI installs Node from `.nvmrc`, so keep the two in step.

```sh
nvm install
nvm use
corepack pnpm install --frozen-lockfile
cp .dev.vars.example .dev.vars   # fill in local values
corepack pnpm db:migrate:local   # local D1 in .cloudflare/state
corepack pnpm dev
```

`nvm` is optional; another version manager can install the same Node version.
Open <http://localhost:3000>. `pnpm dev` runs vinext on Vite with local
Cloudflare bindings (D1, email, rate limit) simulated by workerd. `pnpm build:local`,
`pnpm db:migrate:local`, then `pnpm preview` serves the production Worker
locally against the migrated local D1; run it for any change that touches
server code, because `vite dev` is not proof that the Workers build works.
Bare `pnpm build` is a production-mode build and binds the production D1 id,
so do not preview it locally. Corepack invokes the pinned pnpm without writing
system-wide shims. If your Node installation lacks Corepack, install the exact
pnpm version declared in `package.json` and run the same commands with `pnpm`.

Worker secrets are declared in `cloudflare.config.ts` and listed with empty
values in the tracked `.dev.vars.example`. Local values go in the ignored
`.dev.vars`. Staging and production values are Worker secrets, set with
`cf workers secrets update <NAME> --mode <mode>` by a technical admin. The
deploy credential `CLOUDFLARE_API_TOKEN` is a GitHub Environment secret; the
staging account id comes from `cloudflare.config.ts`. Never create a repo- or
org-level `CLOUDFLARE_API_TOKEN`: it would silently stand in for a missing
Environment secret. Nothing secret is ever committed.

## Checks

Run the same commands used by CI before submitting a pull request:

```sh
corepack pnpm lint
corepack pnpm test
corepack pnpm build
corepack pnpm audit --audit-level=high
```

Lint includes TypeScript, ESLint, Stylelint and Prettier. `pnpm format` writes
formatting changes; Markdown, workflow YAML and the design handoff are excluded
from formatting. `pnpm test:watch` runs Vitest interactively.

After `corepack pnpm build:local`, `corepack pnpm preview` serves the built Worker locally.
Check `/` for the age gate and homepage, `/wholesale` for the signup preview,
and `/api/health` for readiness.
The local tests exercise real D1 persistence with simulated mail. Live delivery requires allowlisted staging verification. Browser regression
tests build the Worker in local-preview mode:

```sh
corepack pnpm exec playwright install chromium
corepack pnpm test:e2e
```

The test runner builds fresh and starts its own preview on port 4173. It never
reuses an existing server. Set `PLAYWRIGHT_PORT=4185` when that port is occupied,
or `PLAYWRIGHT_BASE_URL=https://<staging-worker-url>` to test a deployed preview
without building or starting a local server. Set
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to use an already installed Chromium binary.
Tests cover consent with JavaScript disabled, intro timing and focus, signup
validation and verification states, temporary interest cleanup, mobile
navigation, 320/390/768px layouts, desktop placement, and smoke motion/fallbacks.
They also cover the policy pages, the sales phone strip on every route, the hemp
notice, and the Smoke Signals magazine, drawer, archive and article shell.
Screenshots and failure traces are written to the ignored `test-results/` directory.

`blog-api.spec.ts` is skipped by `test:e2e`. Run it with
`corepack pnpm test:blog-api`, which starts a local stub API on port 4399
(`BLOG_STUB_PORT` overrides it) with a random token and runs the suite against
it. It temporarily writes `.dev.vars.local-preview` and restores it afterwards.

## Public blog

The public `/smokesignals` pages use the Smoke Signals editorial design, with a magazine
homepage, category navigation, searchable archives and a shared article shell.
Approved structured articles come from a private server-side API, with images
proxied through the same origin. The persistent API and publishing CLI are in
`services/blog-api`; see [publishing operations](docs/BLOG_PUBLISHING.md).
Provision and deploy the API before enabling the site's service binding. Wholesale CTAs
continue to use the existing `/wholesale` signup flow. Local development
uses sample articles when no API URL is set; deployed environments fail closed
until configured. See [blog setup and testing](docs/BLOG.md) and the
[draft approval checklist](docs/BLOG_COMPLIANCE.md).

## Consent and signup flow

Age consent uses the existing 30-day cookie on both `/` and `/wholesale`.
The intro runs once per tab session: a 2.2-second hold followed by an 800ms fade
revealing the page underneath. Skip intro and Escape use a 200ms fade. Reduced
motion bypasses the intro or immediately closes it if already showing. Direct
signup visits return to `/wholesale` after consent. Skipping cancels the intro timer so it cannot
interrupt form entry. Without JavaScript the page and sales contact links remain
usable; forms are disabled to prevent accidental native submissions.

The intro and homepage splash use a shared, locally bundled WebGL smoke shader:
subtle cyan-to-magenta haze with slow drift. Open Tweaks and switch Motion off
to hold its current frame. Reduced motion, hidden tabs and off-screen sections
also pause rendering. A static gradient remains available without WebGL.

Both signup forms require only email, name and phone. The homepage keeps email
and Go in the desktop hero, then reveals name and phone. `/wholesale` shows
all three fields together. Business name, state, type, volume and other business
details are collected by the team during follow-up, outside the website form.
Category and Helix links transfer only an optional inquiry interest through
session storage. The form consumes it on arrival, shows a removable selection,
and clears it on Start again. Personal contact details never enter that storage.

Both forms persist inquiries to D1 and request email verification. Confirmation
requires an explicit action after opening the email link. Sales receives a lead
only after confirmation; failed emails remain in a durable retry outbox. Local
mail is simulated. Staging/production delivery is disabled until configured.
See [Lead delivery](docs/launch/LEADS.md) for migrations, modes and recovery.

## Launch requirements

The homepage should present the header, hero, supply categories, HOUSE OF HELIX
callout, how-it-works explanation, wholesale inquiry form and footer. Every
menu button leads to the same form. Use the provided Smoke Show branding and
minimal photography; HOUSE OF HELIX assets are a separate brand.

The latest client direction requires only email, name and phone, followed by
inbox email verification. Business details are collected during team follow-up. Each submission must save a
retrievable record immediately and, only after confirmation, notify sales, send an acknowledgment and
show a clear confirmation. Basic validation, spam protection and desktop/mobile
verification are required before staging review.

The sales phone number, the four policy pages and Cloudflare hosting are
settled. The existing branding and responsive layout are implemented. D1 and Cloudflare Email Sending are selected; production account, sender and recipient configuration remain outstanding. The [VIP Text Club plan](docs/promo-popup.md) is a proposal awaiting
its own tracking issue and provider details, not an implemented feature.

## Project layout

```text
src/app/                         App Router pages: home, wholesale, blog, policies, health
src/components/                  blog, brand, compliance, hero, layout, motion, policy, public, seo, splash, wholesale
src/content/                     Frozen compliance strings, page copy and final policy text
src/domain/                      Zod schemas and the types inferred from them
src/server/                      Server-only blog client, Cloudflare env, leads, logging, SEO, session
src/styles/                      Tokens, base styles, motion and utilities
public/fonts/                    Bodoni Moda and Jost fonts served locally
public/brand/                    Smoke Show logo and mark, HOUSE OF HELIX logo variants
tests/                          unit/, guards/, e2e/ (Playwright), fixtures/ (blog API stub)
design_handoff_wholesale_b2b/    Original design prototype and screenshots
docs/                           Lifecycle, workflows, release metadata and plans
policies/                       Governance provenance and policy index
standards/ security/            Engineering and security guidance
onboarding/ templates/          Contributor guidance and reusable documents
docs/decisions/                 Architecture decision records (ADRs)
.github/                        CI, PR/issue templates and code-owner routing
```

The stack is Next.js App Router, React, TypeScript and plain CSS/CSS Modules.
Brand (dark) is the default root class; Editorial (light) uses the root tokens.
The launch screens share one markup tree. There is no customer authentication.
D1 stores wholesale leads and their email-verification state
(`migrations/0001_leads.sql`); `/api/health` checks the same binding.

## Design references and constraints

The [design handoff](design_handoff_wholesale_b2b/README.md) supplies typography,
colours, motion and thirteen desktop screen references. Its older ordering
flows exceed the simplified launch scope. Treat those screens as visual
references rather than a requirement to build a catalogue or quote builder.

The `.dc.html` prototype uses a bespoke runtime and must not be copied into
Next.js. The four replacement screenshots define the launch design: a dark cyan/pink
Brand theme with a light signup panel. The mobile client references guide
responsive styling; their catalogue and ordering interactions remain outside
launch scope. They are human review references, not pixel-test baselines.

- Serve assets locally. No runtime CDN, analytics or third-party widgets.
  Prototype hotlinks are reference material that must be replaced before use.
- Use token-based CSS and the animation `translate`, `rotate` and `scale`
  longhands; Stylelint enforces the animation restriction.
- Keep approved compliance wording unchanged. The age-gate sentence and the
  hemp product notice are rendered through the compliance module and protected
  by a verbatim guard test. The notice's shield is the only permitted icon
  (client-approved, #39).
- Any future pricing calculation belongs on the server. A licence-consent
  cookie is never authorization for account data.

See [CLAUDE.md](CLAUDE.md) for the original implementation constraints. Some
sections describe future screens and modules rather than existing code.

## Contribution and review

Read [CONTRIBUTING.md](CONTRIBUTING.md) and the
[governance index](policies/README.md). Start with a tracking issue, branch from
`main` as `<type>/<issue-number>-<slug>`, and open a draft PR using the template.
Reference the issue in each commit and explain why the change is needed.
Use an imperative summary; the company convention is
`<type>(<scope>): <imperative summary>`. The governance index records the
remaining differences between company policy and template guidance.

Keep unrelated changes and workflow edits in separate PRs. Record validation,
migration and rollback implications, new permissions, and substantial AI
involvement. Human approval is required before merge; AI review supplements it.
The existing history contains issue references from the original repository;
those numbers do not identify issues in this newly initialized destination.

Vendored governance is copied from a recorded source commit and must not be
edited here. Its source-repository wording (including the architecture index's
“governance only” description) is not a description of this application.
Project-specific guidance and known differences are listed in
[policies/README.md](policies/README.md).

## Deployment and security

The host is Cloudflare Workers ([ADR-0001](docs/decisions/0001-cloudflare-workers-adapter.md)).
Staging deploys run in CI. The production deploy and rollback workflows use the `cf` CLI, preserve approval/SHA guards, and fail closed on missing launch configuration. See the [configuration checklist](docs/launch/CONFIGURATION.md) and [release runbook](docs/launch/RELEASE.md).
A green application build is not evidence of a deployment.

### Staging deploy (CI)

Run **Actions → Deploy → Run workflow** on `main`, with `commit-sha` and
`approved-sha` both set to the full SHA of a merged commit and
`deploy-production` left unchecked. From the CLI:

```sh
SHA=<full 40-character merged SHA>
gh workflow run deploy.yml -R House-of-Helix-CMD/smokeshow_rework --ref main \
  -f commit-sha=$SHA -f approved-sha=$SHA -f deploy-production=false
```

`staging-deploy.yml` refuses any commit that is not on `main`. It fails early if
the `staging` Environment is missing `CLOUDFLARE_API_TOKEN` or `DEPLOY_URL`,
builds in staging mode with the SHA compiled into `/api/health`, and deploys with
`cf deploy --prebuilt --provision=false`. The Worker version is tagged with
the 12-character short SHA, and its message is `sha=<sha> run=<id>`.
`staging-health-check` then probes `/api/health`. The staging job applies the
additive D1 migrations in `migrations/` before deploying.

The `staging` GitHub Environment accepts deployments from `main` only. It holds
the secret `CLOUDFLARE_API_TOKEN` and the variable `DEPLOY_URL`. `deploy.yml`
passes the token to the reusable workflow by name, never with `secrets: inherit`.
A reusable workflow receives an Environment secret only when its caller passes
it; otherwise the secret is silently empty.

### Dev40 design preview (issue #23)

Preview URL: <https://smokeshow-web-staging.dev40.workers.dev>.

The `staging` mode targets account `8441cc5cfd234da96da8cdf090d94658`, Worker
`smokeshow-web-staging`, and D1 `smokeshow-leads-staging`
(`b98400fb-eae4-45db-ad1d-71c5d73ca22c`), overridable through Environment variables.
The new lead migration and email pipeline are implemented locally but have not
been deployed. Staging email requires an explicit recipient allowlist and
`LEADS_ENABLED=true`; the default is disabled. The live blog URL and token,
production account/domain, D1 and sender still require configuration.

The CI deploy above is the normal path. For a manual preview deployment, for
example when CI is unavailable, use Node 22 and the local `cf` OAuth login (or a
scoped API token). The commands must run from a clean checkout of a merged
commit. Select the Dev40 account explicitly; do not
reuse the read-only Helix admin account. Do not use a production build artifact.

```sh
export CLOUDFLARE_ACCOUNT_ID=8441cc5cfd234da96da8cdf090d94658
export COMMIT_SHA="$(git rev-parse HEAD)"
corepack pnpm exec vite build --mode staging
corepack pnpm exec cf deploy --mode staging --prebuilt --provision=false --dry-run
# Verify the output targets smokeshow-web-staging and the staging database above.
corepack pnpm exec cf deploy --mode staging --prebuilt --provision=false \
  --tag "${COMMIT_SHA:0:12}" --message "design-preview sha=$COMMIT_SHA"
```

Check the deployed `/api/health` JSON for `status: "ok"`, `checks.d1: "ok"`,
and `commit` equal to the full deployed SHA. Test the preview with
`PLAYWRIGHT_BASE_URL=<deployed-url> corepack pnpm test:e2e` and check the four
policy pages and `/smokesignals`. The workers.dev address needs no
custom-domain DNS. This preview does not constitute a production release or
business approval; the normal production gates below still apply.

The project release path is staging deployment, staging verification, business
approval, production deployment and production verification. Approval refers
to the recorded commit SHA. See [the lifecycle](docs/LIFECYCLE.md),
[customization checklist](docs/CUSTOMIZATION.md) and
[release metadata](docs/RELEASE_METADATA.md).

CI definitions and CODEOWNERS do not prove that required checks, team access,
branch protection or GitHub Environments are configured in the destination.
Technical admins must verify those repository settings. Report vulnerabilities
through the process in [SECURITY.md](SECURITY.md).
