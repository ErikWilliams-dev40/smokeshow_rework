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
and `/wholesale` signup preview. This is not yet a working lead-capture service.
The frontend foundation and governance import described below are submitted
in separate draft PRs under issue #1; they are pending merge into `main`.

| Area | Current state |
| --- | --- |
| Frontend foundation | Cyan/pink Brand tokens, base styles, ambient motion and self-hosted fonts |
| Homepage | Responsive screenshot recreation with hero form, brands, categories, Helix, process and contact footer |
| Health endpoint | Uncached `GET /api/health` reports the deployed commit and a D1 check; 503 when D1 does not answer |
| Tests | Vitest guards, validation, draft and smoke-clock tests; Playwright regressions against the production preview |
| Governance | Vendored policies, standards, security guidance and onboarding documents |
| Brand assets | Local HOUSE OF HELIX logo variants in `public/brand/` |
| Signup, lead storage and email | Frontend validation and preview/edit states implemented; server storage and email remain unimplemented |
| Hosting and deployment | Cloudflare Workers via vinext and the `cf` CLI ([ADR-0001](docs/decisions/0001-cloudflare-workers-adapter.md)); Dev40 staging preview configuration is available; automated deploy and rollback workflows remain placeholders |

The recent frontend foundation is reusable for the launch. The quote/pricing
prototype on local branch `chore/23-park-quote-pricing` is parked for later and
is not included here. Accounts, checkout, live inventory, pricing tiers and a
full product catalogue are outside the first launch.

## Run locally

Use **Node 22.12 or later within Node 22** (`.nvmrc` pins major 22) and
**pnpm 12.3.4** (`package.json` pins the package manager). Older template
references to Node 24 are stale; use the manifest and `.nvmrc`.

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
`cf workers secrets update <NAME> --mode <mode>` by a technical admin; the
deploy credentials (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) are GitHub
Environment secrets. Nothing secret is ever committed.

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
These checks do not verify lead storage or email delivery. Browser regression
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
validation and verification previews, temporary interest cleanup, mobile
navigation, 320/390/768px layouts, desktop placement, and smoke motion/fallbacks.
Screenshots and failure traces are written to the ignored `test-results/` directory.

## Frontend preview flow

Age consent uses the existing 30-day cookie on both `/` and `/wholesale`.
The intro runs for three seconds once per tab session, supports Skip intro
and Escape, and is bypassed for reduced motion. Direct signup visits return
to `/wholesale` after consent. Skipping cancels the intro timer so it cannot
interrupt form entry. Without JavaScript the page and sales contact links remain
usable; preview forms are disabled to prevent accidental native submissions.

The intro and homepage splash use a locally bundled Three.js smoke shader:
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

Valid forms open an inbox-verification preview. Visitors can simulate a verified
state or a resend, edit their details, or start again. Every state explicitly says
that no verification email or lead has been sent and no address has actually been
verified. Contact details stay in component memory, outside URLs and storage.
Real email verification, lead storage and delivery remain separate backend work.

## Launch requirements

The homepage should present the header, hero, supply categories, HOUSE OF HELIX
callout, how-it-works explanation, wholesale inquiry form and footer. Every
menu button leads to the same form. Use the provided Smoke Show branding and
minimal photography; HOUSE OF HELIX assets are a separate brand.

The latest client direction requires only email, name and phone, followed by
inbox email verification. Business details are collected during team follow-up. Each submission must save a
retrievable record, notify the sales inbox, send an acknowledgment email and
show a clear confirmation. Basic validation, spam protection and desktop/mobile
verification are required before staging review.

Sales contact details, the actual Smoke Show logo, policy copy, form storage
and email providers, hosting, and responsive design decisions still need to be
settled. The [VIP Text Club plan](docs/promo-popup.md) is a proposal awaiting
its own tracking issue and provider details, not an implemented feature.

## Project layout

```text
src/app/                         App Router pages, layout and health route
src/styles/                      Tokens, base styles, motion and utilities
public/fonts/                    Bodoni Moda and Jost fonts served locally
public/brand/                    HOUSE OF HELIX logo variants
tests/unit/                     Vitest toolchain smoke test
design_handoff_wholesale_b2b/    Original design prototype and screenshots
docs/                           Lifecycle, workflows, release metadata and plans
policies/                       Governance provenance and policy index
standards/ security/            Engineering and security guidance
onboarding/ templates/          Contributor guidance and reusable documents
architecture/decisions/         Place for architecture decision records
.github/                        CI, PR/issue templates and code-owner routing
```

The stack is Next.js App Router, React, TypeScript and plain CSS/CSS Modules.
Brand (dark) is the default root class; Editorial (light) uses the root tokens.
The launch screens share one markup tree. There is no customer authentication.
The existing D1 health binding is not used to store inquiry submissions.

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
- Keep approved compliance wording unchanged. The age-gate sentence is rendered
  through the compliance module and protected by a verbatim guard test.
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
The deploy and rollback workflows are still placeholders that intentionally
fail; filling them and configuring GitHub Environment credentials is a separate
workflow-only change (Helix issue #11). A green application build is not evidence
of a deployment.

### Dev40 design preview (issue #23)

Preview URL: <https://smokeshow-web-staging.dev40.workers.dev>.

The `staging` mode targets account `8441cc5cfd234da96da8cdf090d94658`, Worker
`smokeshow-web-staging`, and D1 `smokeshow-leads-staging`
(`b98400fb-eae4-45db-ad1d-71c5d73ca22c`). The database is empty: `/api/health`
only checks connectivity. No lead storage or email delivery is implemented.
Staging deliberately has no email, rate-limit, or secret bindings until #15
implements the real pipeline. Production configuration remains unprovisioned.

For an authorized staging preview deployment, use Node 22 and the local `cf`
OAuth login (or a scoped API token). Select the Dev40 account explicitly; do not
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
`PLAYWRIGHT_BASE_URL=<deployed-url> corepack pnpm test:e2e` and check `/privacy`
and `/terms` (both still placeholder copy). The workers.dev address needs no
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
