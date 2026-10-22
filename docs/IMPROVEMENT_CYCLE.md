# Wholesale launch improvement cycle

Each change starts with a tracking issue, uses a branch based on the default
branch, and lands through a focused PR. Record verification in
`docs/improvement-log.md`. Keep workflow changes in a separate infrastructure PR.

## Current direction

Smoke Show Labs generates wholesale inquiries for flower, vapes, edibles,
pre-rolls, concentrates and HOUSE OF HELIX peptide strips. The first launch is
signup → email confirmation → sales follow-up. Accounts, checkout, public prices,
and the parked quote prototype are outside this launch.

The App Router application runs on Cloudflare Workers through vinext. `/` and
`/wholesale` retain the consent gate. The four policies, `/blog` and approved blog
articles are public. Blog content comes from the existing private API; local
fixtures must never be published by staging or production.

`SITE_URL` already exists in `cloudflare.config.ts`, with production configured as
`https://smokeshowlabs.com`. Verify DNS before launch; do not replace it with a
placeholder. Deployment mode must be explicit: a production bundle is also used
for staging and local preview. vinext supports robots and sitemap metadata routes.

## Ordered implementation

1. Correct documentation against the current code and business direction.
2. Implement environment-aware indexing, canonical URLs, social metadata and a
   public-route registry. Non-production and gated pages use `noindex`, while
   remaining crawlable. Do not block public article images or other render assets.
3. Complete signup using D1 and Cloudflare Email Sending. Persist pending leads
   immediately; notify sales only after email confirmation. Use expiring,
   single-use verification, idempotent submissions and retriable email delivery.
4. Build discovery from approved blog articles and static public routes. Preserve
   archive pagination in canonical URLs and exclude internal search results.
5. Add shared public navigation and breadcrumbs without duplicating blog chrome.
6. Publish `/wholesale-products` using existing approved category/process copy.
   New claims, guides and category copy require review before publication.
7. Add Organization, WebSite, Article and BreadcrumbList structured data matching
   visible content. Defer Product and FAQ markup; FAQ rich results were retired
   by Google in May 2026, and product snippets exclude vaping/recreational drugs.
8. Measure the built Worker on mobile before optimizing images, fonts, JavaScript
   or the direct-WebGL `SmokeCanvas`. There is no Three.js dependency. Existing
   fonts already use `font-display: swap`. Label measurements as laboratory data.
9. Complete production configuration, release workflows and rollback in a separate
   infrastructure PR. Verify staging and required approvals before release, then
   verify production and submit the sitemap to Search Console and Bing.

## Verification for each change

Run relevant unit/guard tests, lint and a build. Server changes also require
Worker-preview checks (`pnpm build:local`, then `pnpm preview`); do not preview a
production build against placeholder production bindings. Run affected Playwright
specs, including mode-dependent policy metadata checks.

Exercise failed and duplicate submissions, token expiry/replay, resends, delivery
retries, blog outages, draft exclusion and sitemap pagination. Keep compliance
copy frozen, pricing server-owned, personal data out of logs/URLs/browser storage,
and browser requests on the same origin. JSON-LD must safely escape untrusted text.

Use the repository security-reviewer procedure before human review. Additive D1
migrations require migration and rollback statements; application rollback must
not reverse migrations or discard leads. Production deployments follow the
established release and approval workflow.

## Measuring progress

Record checks, user-visible behavior, and remaining blockers in the improvement
log. After launch, track indexing, search impressions/clicks and confirmed leads.
Do not treat test counts, markup volume or anecdotal AI citations as proof of
commercial value. Search eligibility does not guarantee ranking or citation.

## External launch dependencies

- Production D1/account and domain/DNS configuration.
- Workers Paid and an onboarded sending domain for customer email.
- Confirmed sales inbox, sender address, restricted staging recipients and secrets.
- A live approved-content blog API and its secret token.
- Required reviewers, production approval and Search Console/Bing ownership.

Do not invent missing values or mark a release complete while these are absent.
