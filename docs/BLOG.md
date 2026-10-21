# Blog implementation and operations

The public `/blog` and `/blog/[slug]` pages use the private v1 API described in
`src/domain/article.ts`. The browser never contacts that API. Articles do not
require age consent; the root layout still renders the frozen hemp notice.
The separate API/editor, deployment and production provisioning are not part
of this implementation.

## Configuration

All runtime binding access goes through `src/server/cloudflare/env.ts`.

- `BLOG_API_URL`: non-secret API base URL, supplied to the build environment;
  `cloudflare.config.ts` declares it as a text binding. A base path is supported.
  Deployed URLs must use HTTPS, with no userinfo, query or fragment.
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
