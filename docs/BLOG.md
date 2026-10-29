# Blog implementation and operations

The public `/smokesignals` and `/smokesignals/[slug]` pages use the private v1 API described in
`src/domain/article.ts`. The browser never contacts that API. Articles do not
require age consent; the root layout still renders the frozen hemp notice.
The separate API is implemented in `services/blog-api`, with D1 revisions,
private R2 media and owner-approved publishing tools. See
[publishing operations](BLOG_PUBLISHING.md). A browser editor is not included;
deployment and production provisioning still require the release gates.

## Configuration

All runtime binding access goes through `src/server/cloudflare/env.ts`.

- `BLOG_API_URL`: non-secret API base URL, supplied to the build environment;
  `cloudflare.config.ts` declares it as a text binding. A base path is supported.
  Deployed URLs must use HTTPS, with no userinfo, query or fragment. It is
  required in staging and production; `scripts/check-deploy-config.mjs` rejects a
  missing or non-HTTPS value and any value that reuses the website's own origin.
- `BLOG_API_TOKEN`: Worker secret, never a public environment variable. Add its
  local value to ignored `.dev.vars`; use the installed `cf` CLI's secret
  commands for staging and production after inspecting their `--help`.
- `BLOG_ALLOW_FIXTURES`: configuration sets `true` only for local modes. Fixture
  selection also requires an empty API URL and a non-staging/non-production
  build. Missing deployed configuration shows unavailable, never sample content.

Local example: set a local bearer token in `.dev.vars`, then run
`BLOG_API_URL=http://127.0.0.1:4399 corepack pnpm build:local` and
`corepack pnpm preview`. Only loopback HTTP is permitted in local modes.
Do not preview a production build against the production D1 placeholder.

## API and failure behavior

Requests use bearer auth, reject redirects, and have a five-second deadline
including body reads. JSON is limited to 2,000,000 bytes. There are no retries.

- `GET /articles?page=1&pageSize=12`: newest-first summaries, upstream totals.
  Missing/unapproved reviews are filtered; malformed approved entries make the
  list unavailable. Filtering may leave a shorter or empty page without changing
  the API's authoritative total. Invalid browser page parameters become page 1.
- `GET /articles/{slug}`: a validated approved article. Missing/unapproved
  articles return 404; invalid approved data, API errors or missing configuration
  return 503 with generic text and no article metadata.
- `GET /media/{id}`: immutable JPEG, PNG, WebP or AVIF. The origin proxy checks
  MIME/signature agreement, limits actual bytes to 5,000,000, and forwards only
  its own safe headers. Invalid/missing IDs return 404; other failures return 503.

A Worker wrapper preloads article results before rendering and shares them with
metadata and page rendering using AsyncLocalStorage. This prevents streaming
from turning a failed article into an HTTP 200. Other routes delegate to vinext.

The Workers Cache API stores only successful, parsed article data for 300 seconds.
Cache keys include the API base URL and endpoint, never the token. Reads are
validated again and carry explicit expiry timestamps; expired content is not
served after an API failure. Rendered blog HTML/RSC is `no-store`. Cache failures
fall through to a fresh API read. No additional infrastructure is required.
Media carries a one-year immutable public cache header. Change its ID when the
bytes change; do not publish private images through the blog API.

The sitemap reuses `listArticles`. When discovery fails and no cached discovery
younger than a day is available, `/sitemap.xml` answers 503 with
`Retry-After: 60` instead of publishing a sitemap that silently omits the
archive; crawlers retry rather than treat the blog as removed. A previously
successful discovery of up to 24 hours is served during an outage.

## Testing

Use Node 22 and the package-manager version pinned in `package.json`.

```
corepack pnpm lint
corepack pnpm test
corepack pnpm build
corepack pnpm audit --audit-level=high
corepack pnpm db:migrate:local
corepack pnpm test:e2e
corepack pnpm test:blog-api
```

The normal browser suite builds a local Worker using fixture content. It covers
both themes, 320/390/1280px layouts, navigation, pagination, same-origin requests,
real 404s, local image delivery and Secure consent cookies without JavaScript.
Screenshots are in ignored `test-results/`.

`test:blog-api` starts a loopback-only authenticated test API and uses an ephemeral
token. It temporarily supplies `.dev.vars.local-preview`, restores any previous
file on exit, and builds a local Worker against the stub. Do not run it alongside
another build/preview in the same checkout. The suite covers approval rejection,
literal text rendering, HTTP 404/503, timeouts, media limits and cache reuse.
`BLOG_STUB_PORT` and `PLAYWRIGHT_PORT` can select unused ports.

For manual stub use, supply `BLOG_STUB_TOKEN` and run
`node tests/fixtures/blog-api.mjs`. Its authenticated `/__status` endpoint reports
request counts; `POST /__control?mode=healthy|error|timeout|malformed` changes the
response mode. These are test endpoints only and must never be deployed.

## Release and rollback

Follow `docs/BLOG_COMPLIANCE.md` before publishing real articles. Owner/counsel
review remains pending; fixture approval records are not editorial approval.
Withdrawal or edits can take up to five minutes to become visible.

Hardening is split across issues #62–65. The feature is #66, based on the combined
prerequisite branch for review. Merge the hardening PRs first, then retarget/rebase
the blog PR onto main. No schema migration or workflow permission change is needed.
Rollback is safe by redeploying the prior application version; it removes blog
routes without changing data in the separate API.

Before staging review, an administrator must provide the real API URL and token.
The API owner must first demonstrate that `/media/{id}`, with the site's token,
serves only approved public assets and returns 404 for draft-only, rejected and
private assets (#74). The site validates media bytes but does not independently
authorize media publication. See [the independent review](BLOG_SECURITY_REVIEW.md).
Request amplification is a Low-severity follow-up (#73); review traffic controls
before scaling the live API. Already published immutable images may remain in
browser caches even after upstream withdrawal.
Production D1, mail configuration, production observability, operational code
owners, human review and release approval remain external dependencies. No
staging or production deployment is performed by these changes.

## Smoke Signals design (#81)

`/smokesignals` is the editorial magazine homepage. Article pages share its light shell,
sections drawer, footer and wholesale links. Blog styling is scoped: other routes
keep the Brand theme, and the root phone strip and frozen hemp notice stay in place.
The existing Jost font and `/brand/ss-mark.webp` are served locally. Prototype
runtime files are reference material only and are excluded from source tooling.

Approved adaptations from the handoff:

- Every wholesale CTA goes to `/wholesale`, which remains an explicitly labelled
  signup preview. The dark signup band has a link instead of an email-only form.
- Shipping links to `/shipping`; there is no unsupported state eligibility claim.
- No cookie banner, optional tracking, placeholder social links, or Helix promotion.
- Menu, search and close symbols are allowed for these blog controls. Text/button
  pink uses the existing accessible action token; decorative pink/cyan retain the
  handoff colors. Missing/failed cover images use neutral aspect-ratio placeholders.
- The mobile signup bar can be dismissed for the current tab. It hides behind the
  modal drawer. Storage failures retain a working per-page dismissal.

### Public URLs

- `/smokesignals`: magazine. `?section=flower` filters only its Latest list.
- `/smokesignals?view=all`: archive. Add `section=flower` to filter by category.
- `/smokesignals?q=packaging`: archive search; combine `section`, `q` and `page`.
- Existing `/smokesignals?page=2` links remain archive links. Pagination preserves filters;
  first-page archive links explicitly keep `view=all`.
- `/smokesignals/[slug]` and `/smokesignals/media/[id]`: existing detail/media routes.
- Old `/blog` URLs redirect permanently (308) to the same path under
  `/smokesignals`, keeping the query string (#135).

Unknown/duplicate categories become Latest; invalid/duplicate pages become 1.
Search trims whitespace and limits input to 200 characters. Empty search displays
an archive when submitted with `view=all`. Search is submitted, not live/autocomplete.
All archive/category links and search forms work without JavaScript. The native
modal drawer requires JavaScript; the header navigation and footer offer the same
category destinations without it. Dates use a fixed server-render timestamp:
minutes/hours/days below seven days, then an absolute UTC date.

### Upstream API extension (required before staging acceptance)

This repository implements the client, local fixture selection, authenticated
loopback test API and persistent service in `services/blog-api`.
Deploy that service and configure its binding before staging review.
The existing token, transport bounds, media authorization requirements, five-minute
parsed-data cache, and approval rules continue to apply. No new secret or migration
is needed in this application. Old `/articles` consumers remain compatible.

`ArticleSummary` and `Article` gain optional `category`, one of:
`wholesale`, `flower`, `vapes`, `edibles`, `pre-rolls`, `concentrates`, `compliance`,
`retail-tips`. Legacy articles can omit it and remain in general placements and
unfiltered search; they do not appear in a category-specific list. An unrecognized
category on an approved article is invalid. `excerpt`, optional `author`, optional
`cover`, structured `body` and the existing `review` record retain their meanings.

`GET /articles?page=1&pageSize=12&category=flower&q=packaging` accepts optional
`category` and `q`. Apply both predicates before pagination and return the filtered
total. Search uses case-insensitive substring matching over title plus excerpt.
Sort newest-first, with slug ascending to break publication-time ties. Keep the
existing page envelope and return the requested page/pageSize even when empty.
The browser's `section` parameter maps to the API's `category` parameter.
Cache keys include the normalized category and query. Approval filtering can still
shorten the returned list without changing its authoritative upstream total.

`GET /homepage` returns this JSON object, where every story is a complete
`ArticleSummary`, not a slug or article body:

```ts
{
  lead: ArticleSummary | null,
  rail: ArticleSummary[],            // 0–3
  feature: ArticleSummary | null,
  featured: ArticleSummary[],        // 0–4, right-hand featured stack
  shelf: ArticleSummary[],           // 0–4, product categories only
  complianceRetail: ArticleSummary[],// 0–6, compliance / retail-tips only
  latest: {
    latest: ArticleSummary[],        // 0–5, excludes the lead
    wholesale: ArticleSummary[],    // 0–5 in each category
    flower: ArticleSummary[],
    vapes: ArticleSummary[],
    edibles: ArticleSummary[],
    'pre-rolls': ArticleSummary[],
    concentrates: ArticleSummary[],
    compliance: ArticleSummary[],
    'retail-tips': ArticleSummary[]
  }
}
```

All fields and all nine `latest` keys are required, including for an empty library.
Resolve ordered curated slots against approved eligible stories, discard missing
or withdrawn selections, deduplicate by slug within each slot, and fill remaining
positions newest-first. Shelf eligibility is the five product categories;
Compliance & Retail eligibility is its two named categories. Other slots use all
approved stories. Repetition between sections is allowed. Each category's Latest
is newest-first and may include the lead; only the unfiltered Latest excludes it.
The drawer uses the first two entries from each category's Latest list. Do not
make one upstream request per card or download the archive to fill the homepage.
`src/server/blog/selection.ts` is the executable reference algorithm for fixtures.

The client filters unapproved entries out of every slot, rejects malformed approved
summaries and oversized arrays, deduplicates entries, and validates each category's
Latest list. Nullable placements become empty when their story is unapproved.
The API remains responsible for replacing withdrawn selections with eligible
fallbacks. Empty sections collapse; the Latest list has an explicit empty state.
Missing/failed production API configuration never falls back to fixtures.

An article's status/body is authoritative even if the optional `/homepage` read
for drawer previews fails: navigation remains usable with no preview headlines.
Archive results likewise survive a failed optional homepage read. Main homepage
failures show the generic unavailable state. Existing article 404/503 and HTML
`no-store` behavior remain intact.

### Verification and review

Run the standard commands above, including `test:blog-api` separately from other
builds. The Smoke Signals browser suite captures homepage/drawer screenshots at
320, 390, 768, 1024, 1280 and 1440px in `test-results/`, and checks category/search
navigation, history, keyboard focus, session dismissal, reduced motion and no-JS
navigation. Local articles are development examples, not publication approval.
Real cover art and approved articles must come from the upstream API.

Rollback by redeploying the previous application version; the upstream extension
is additive, so existing consumers still work. No deployment, workflow edits or
lead-delivery changes are part of this feature. Obtain the normal human review and
business approval before releasing the customer-visible redesign.

Review captures using local development content:
[desktop](design/smoke-signals/home-desktop.png),
[mobile](design/smoke-signals/home-mobile.png), and
[mobile drawer](design/smoke-signals/drawer-mobile.png).

Validation for #81 used Node 22.23.4 / pnpm 12.3.4: lint/typecheck and production
build passed; 148 unit tests, 27 focused browser tests, and 8 authenticated API
integration tests passed. The full browser suite reported 80 passed, 7 skipped
(API-harness-only tests at that point), and 4 failures in the policy-page keyboard
assertions. All four failures also reproduced from unchanged base commit
`f2ae6a4`: the existing phone strip takes the first Tab before the policy's home
link. No policy implementation or policy tests were modified for this redesign.
The dependency audit passed its high-severity gate with the existing committed
advisory exception; dependency versions and exceptions were unchanged.
