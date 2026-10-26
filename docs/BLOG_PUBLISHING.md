# Publishing Smoke Signals

The website pulls only approved revisions from the dedicated API in
`services/blog-api`. The owner approves an exact revision after completing
`docs/BLOG_COMPLIANCE.md`. Editing never changes the live article until approval.
An importer cannot approve, withdraw, or curate articles.

## CLI setup

Use Node 22. Run `corepack pnpm build:blog-tools` after checkout or CLI changes.
Set `BLOG_ADMIN_URL` to the API URL and load your individual `BLOG_ADMIN_TOKEN`
from your secret manager into the environment. Never pass tokens on command lines.
HTTPS is required except for loopback HTTP during local development. The website's
`BLOG_API_TOKEN` cannot be used to administer articles.

Create a JSON manifest with a stable slug and structured content:

```json
{
  "slug": "packaging-for-wholesale",
  "content": {
    "title": "Packaging for wholesale teams",
    "excerpt": "Questions to consider before requesting a quote.",
    "category": "flower",
    "author": "Smoke Signals",
    "cover": { "file": "images/cover.png", "alt": "Product packaging" },
    "body": [
      { "type": "heading", "level": 2, "text": "Planning the order" },
      { "type": "paragraph", "text": "Article copy awaiting owner review." }
    ]
  }
}
```

Image paths resolve inside the manifest directory, including symlink resolution.
Use JPEG, PNG, WebP or AVIF. The tool reads dimensions from the file and uploads
it as an immutable asset. You can also reference an existing `{id,alt,width,height}`
media object. Image blocks use the same file/reference object in their `media`
field. No Markdown conversion, remote image downloads, or approval import occurs.

## Import and inspect

```sh
corepack pnpm blog validate ./articles/packaging.json
corepack pnpm blog import ./articles/packaging.json --dry-run
corepack pnpm blog import ./articles/packaging.json
corepack pnpm blog inspect packaging-for-wholesale
```

Validation and dry-run are offline and need no credentials. Import returns the
draft's revision ID and article version. Multiple files produce independent JSON
result lines; any failure produces a nonzero exit status. Existing articles require
`--update --version N` for changes and for imports with local images. Updates take
one manifest at a time. Inspect first and supply that exact version:

```sh
corepack pnpm blog import ./articles/packaging.json --update --version 2
```

Identical draft content is a no-op; identical image bytes reuse the original ID.
If a request times out, inspect state and repeat the same operation, without
automatically substituting a newer version. A 409 means another change won;
reinspect and review before explicitly retrying. There are no automatic write
retries. Unreferenced upload objects never become public.

## Owner approval and withdrawal

Using the owner's credential, inspect the exact revision, complete the checklist,
then pass the returned version and revision ID:

```sh
corepack pnpm blog approve packaging-for-wholesale --revision REVISION_UUID --version 2 --checklist
corepack pnpm blog withdraw packaging-for-wholesale --version 3
```

Replace the example version numbers and revision placeholder with inspected
values. `--checklist` is a human acknowledgment, not an automated content review.
Server timestamps and credential identity populate the approval record. The same
owner may approve an older revision to roll back content, using the current
article version. Repeating approval of the currently published revision is a no-op.

The website caches approved articles for five minutes. Edits and withdrawal can
take that long to appear. Already published immutable images may remain cached in
browsers for a year. Never upload confidential assets into this publishing system.

## Homepage curation

Create a JSON object mapping `lead`, `rail`, `feature`, `featured`, `shelf` and
`complianceRetail` to ordered slug arrays. Omitted slots reset to automatic
newest-first selection. Product and compliance slots enforce category eligibility.

```sh
corepack pnpm blog curate ./articles/homepage.json --dry-run
corepack pnpm blog curate ./articles/homepage.json
```

Withdrawn selections are skipped and replaced with eligible published articles.
The Latest lists remain automatic and preserve the website's existing contract.

## Configuration and verification

The website keeps `BLOG_API_URL` as its cache namespace and `BLOG_API_TOKEN` as
its read-only credential. In staging and production, `BLOG_API` binds directly
to the matching API Worker; a missing or failing binding never falls back to
external HTTP. Local stub and library tests continue to use loopback HTTP.
Deploy the API first, then the website. The R2 bucket must remain private.

Run `corepack pnpm test:blog-backend` for real Worker/D1/R2 durability and conflict
tests. Run `corepack pnpm test:blog-library` for the CLI-to-browser publishing
flow, and `corepack pnpm test:blog-api` for the existing fault-injection suite.
Run these sequentially: website integration temporarily updates and then restores
`.dev.vars.local-preview` and rebuilds local preview artifacts. Its tokens and
content are ephemeral, isolated test data. Normal `test:e2e` verifies the rest of
the site's browser behavior. Unit tests cover the 300-second cache expiry.

See `services/blog-api/README.md` for credential format, readiness, backup/restore,
media limits and data-preserving rollback. No registered media or revision is
deleted by v1 tools.
