# Smoke Show Labs

Smoke Show Labs is a wholesale lead-generation website for buyers of bulk
flower, vapes, edibles, joints and pre-rolls, concentrates, and HOUSE OF HELIX
peptide strips. The first launch centers on **Get the Wholesale Menu**:

**Signup → Menu → Dedicated salesperson → Confirmed order → Payment link.**

The salesperson confirms availability, quantities and the final total before
sending a payment link. Menu delivery can be manual at launch; the website
must not promise instant delivery or a callback deadline.

Repository: [House-of-Helix-CMD/smokeshow_rework](https://github.com/House-of-Helix-CMD/smokeshow_rework).
Built from the Project Helix application template.

## Current status

This is an early Next.js implementation, not a working wholesale signup site.
The frontend foundation and governance import described below are submitted
in separate draft PRs under issue #1; they are pending merge into `main`.

| Area | Current state |
| --- | --- |
| Frontend foundation | Two-theme CSS tokens, base styles, motion utilities and self-hosted fonts |
| Homepage | Placeholder exercising the tokens; the launch homepage is not built |
| Health endpoint | Uncached `GET /api/health` returns `{ "status": "ok" }`; no dependency or release checks |
| Tests | Vitest with a toolchain smoke test; no signup or browser tests yet |
| Governance | Vendored policies, standards, security guidance and onboarding documents |
| Brand assets | Local HOUSE OF HELIX logo variants in `public/brand/` |
| Signup, lead storage and email | Not implemented; providers and configuration remain to be chosen |
| Hosting and deployment | Host undecided; deploy and health-check workflows remain placeholders |

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
corepack pnpm dev
```

`nvm` is optional; another version manager can install the same Node version.
Open <http://localhost:3000>. Corepack invokes the pinned pnpm without writing
system-wide shims. If your Node installation lacks Corepack, install the exact
pnpm version declared in `package.json` and run the same commands with `pnpm`.

No environment variables are required for the current placeholder. Future
integrations must document their keys in a tracked `.env.example` with empty
values. Local values belong in ignored environment files; production values
belong in GitHub Environment secrets and the chosen host's secret store.
The runtime secret store has not been selected yet.

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

After building, `corepack pnpm start` serves the production build locally.
Check `/` for the placeholder and `/api/health` for the readiness stub.
These checks do not verify lead storage or email delivery. Playwright and
end-to-end tests are planned, not installed or configured.

## Launch requirements

The homepage should present the header, hero, supply categories, HOUSE OF HELIX
callout, how-it-works explanation, wholesale inquiry form and footer. Every
menu button leads to the same form. Use the provided Smoke Show branding and
minimal photography; HOUSE OF HELIX assets are a separate brand.

The form requires name, business name, email, phone, state and business type,
with optional product interests and notes. Each submission must save a
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
Both themes share one markup tree. There is no database or authentication.

## Design references and constraints

The [design handoff](design_handoff_wholesale_b2b/README.md) supplies typography,
colours, motion and thirteen desktop screen references. Its older ordering
flows exceed the simplified launch scope. Treat those screens as visual
references rather than a requirement to build a catalogue or quote builder.

The `.dc.html` prototype uses a bespoke runtime and must not be copied into
Next.js. Screenshots show the light Editorial theme, while the app defaults to
dark Brand. They are human review references, not pixel-test baselines.

- Serve assets locally. No runtime CDN, analytics or third-party widgets.
  Prototype hotlinks are reference material that must be replaced before use.
- Use token-based CSS and the animation `translate`, `rotate` and `scale`
  longhands; Stylelint enforces the animation restriction.
- Keep approved compliance wording unchanged. The planned compliance module
  and verbatim tests have not been implemented.
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

Deployment is not configured. Placeholder deploy workflows intentionally fail;
a green application build is not evidence of a deployment. Maintainers must
select a server-capable host and implement the deployment and health checks
before dispatching the release workflow.

The project release path is staging deployment, staging verification, business
approval, production deployment and production verification. Approval refers
to the recorded commit SHA. See [the lifecycle](docs/LIFECYCLE.md),
[customization checklist](docs/CUSTOMIZATION.md) and
[release metadata](docs/RELEASE_METADATA.md).

CI definitions and CODEOWNERS do not prove that required checks, team access,
branch protection or GitHub Environments are configured in the destination.
Technical admins must verify those repository settings. Report vulnerabilities
through the process in [SECURITY.md](SECURITY.md).
