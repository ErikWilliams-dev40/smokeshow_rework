# Smoke Signals API

Independent Worker for the existing website contract. D1 stores immutable article
revisions, approvals and audit records; a private R2 bucket holds images. No draft
becomes public until an owner approves its exact revision. Editing leaves the
previous approved version live. Withdrawal keeps all stored history.

## Local setup

Use Node 22 and the root's pinned pnpm. From the repository root:

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm --dir services/blog-api db:migrate:local
corepack pnpm --dir services/blog-api exec vite build --mode local-preview
corepack pnpm --dir services/blog-api preview
```

Create an ignored `services/blog-api/.dev.vars.local-preview` before preview.
It requires a random `BLOG_API_TOKEN` of at least 32 characters and
`BLOG_ADMIN_CREDENTIALS`, a JSON array of `{id,name,role,sha256}` records.
The digest is SHA-256 of a separate random token of at least 32 characters; role
is `editor` or `owner`. IDs and digests must be unique. Keep real tokens out of
the repository, command arguments, screenshots, and logs. The website token
has read access only. Do not reuse it as an editor/owner token.

Removing a credential record revokes it immediately on the next request using
the updated Worker secret. Rotate the website token on both services together.
Local and deployed credentials must be different.

## HTTP interfaces

Every request uses `Authorization: Bearer <token>`. Every API response is
`no-store`; the website independently caches validated article data for five
minutes. Media IDs are immutable. Previously public image bytes may remain in
browser caches for a year after withdrawal.

- `GET /articles?page=1&pageSize=12&category=flower&q=packaging`: existing page envelope.
- `GET /articles/{slug}`, `GET /homepage`, `GET /media/{id}`: existing contracts.
- `GET /health`: authenticated readiness, commit and boolean D1/R2 checks.
- `GET /admin/articles?page=1&pageSize=12`: paginated article state.
- `GET /admin/articles/{slug}`: version, revision IDs, the draft and published
  revision content, and `revisionCount`. It never includes the whole history.
- `GET /admin/articles/{slug}/revisions?page=1&pageSize=12`: paginated revision
  metadata (ID, author, time, approvals) without content.
- `GET /admin/articles/{slug}/revisions/{id}`: one revision with its content.
- Create, edit, approve and withdraw return only
  `{slug,version,draftRevisionId,publishedRevisionId}`, so responses stay small
  however long an article's history grows.
- `POST /admin/articles`: `{slug,content}`; creates a draft and returns 201.
- `PUT /admin/articles/{slug}/draft`: `{expectedVersion,content}`.
- `POST /admin/articles/{slug}/approve`: owner only;
  `{expectedVersion,revisionId,checklistAcknowledged:true}`.
- `POST /admin/articles/{slug}/withdraw`: owner only; `{expectedVersion}`.
- `POST /admin/media`: raw JPEG, PNG, WebP or AVIF bytes and matching Content-Type;
  returns `{id,width,height,mime}`. Place only id/width/height plus alt in articles.
- `PUT /admin/homepage`: owner only; slot names map to ordered slug arrays.
  Omitted slots reset to automatic selection. Unknown, duplicate, unpublished or
  category-ineligible selections are rejected; later withdrawal uses fallbacks.

Content is `{title,excerpt,body,category?,author?,cover?}` using the shared public
structured-block schema. Administrative objects, including nested blocks, reject
unknown fields. Slugs are immutable. Dates, IDs and approval records are assigned
by the server. First publication establishes publishedAt; subsequent approval
preserves it and updates updatedAt. Historical backdating is not supported.

Changes require the current article version; a 409 requires reinspection. Exact
draft replays and repeat approval of the current published revision return the
existing state without another mutation. Approval may select any existing revision
of that article, enabling reviewed content rollback. The owner identity comes from
the credential, not the request body. Audit events retain the credential ID.

The JSON limit is 256,000 actual bytes. Media is limited to 5,000,000 bytes,
32,768 pixels per dimension and 100 million total pixels. Header inspection does
not decode images. AVIF containers with ambiguous dimensions are rejected.
Uploads are content-deduplicated; incomplete uploads are never public. Private
R2 access must remain disabled outside the Worker.

Errors use `{error:{code,message,issues?}}`. Codes map to 400 invalid input,
401 authentication, 403 role, 404 absent/unpublished resource, 409 conflict,
413 size, 415 media type, 422 reference/image and 503 dependency failures.
Errors and request logs omit content, credentials and internal exception text.

## Operations and release

Provision a separate D1 database and private R2 bucket per environment using cf.
Supply `BLOG_DB_ID`, `BLOG_BUCKET_NAME`, `CLOUDFLARE_ACCOUNT_ID`, and `COMMIT_SHA`
when building in staging or production mode. Set both secret bindings using cf's
verified secret/deploy interface. Unconfigured database IDs deliberately fail.
Never deploy local `.dev.vars` or test fixtures.

The migration is additive: `database_migration: true`, `rollback_safe: true`.
Deploy the API before enabling the website's service binding. Run authenticated
readiness, import/approval, concurrency and media-visibility tests before promotion.
Follow repository staging, owner-review and business-approval gates.

For application rollback, redeploy the previous approved Worker version; leave
D1 tables and R2 objects intact. For content rollback, approve an earlier exact
revision with the current version. Withdrawal removes publication only.

Before changes, use cf's discovered D1 export and R2 object download/list commands
to export the complete database and referenced immutable objects into restricted
storage. Record export timestamps and object hashes. Verify restore into a separate
non-production database/bucket, run readiness and compare article/revision/media
counts and hashes, then test approved and draft media access. Never restore over
production as an unreviewed rollback step. Orphan cleanup is intentionally manual
and must exclude every registered media object; v1 never deletes registered media.

Monitor authenticated readiness, error rates and latency using structured Worker
logs/traces. Request IDs correlate API failures without logging query strings or
content. The site's existing request-amplification follow-up (#73) remains relevant.
