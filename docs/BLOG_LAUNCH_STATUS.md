# Blog staging preparation — 2026-10-26

Status: local validation passed; staging infrastructure is partially prepared.
No blog API was deployed, no remote migration was applied, and no real content
was imported or approved. Production work is deferred at the owner's request.
The owner will supply the three pilot articles and licensed images later.

## Candidate and verification

Repository: `House-of-Helix-CMD/smokeshow_rework`.
Base: merged main commit `c231e9960f627522d3f629c8cc09d71df2cab8ef`.
Preparation branch: `chore/110-blog-launch-readiness`.
The previous checkout at `c0850cf` predates the fixes merged in PRs #114–#116;
the results below cover the newer main code plus this branch's dependency fixes.

Runtime: Node **22.23.4**, Corepack pnpm **12.3.4**. Select Node 22 explicitly;
the host's default Node remains 24.22.1.

| Command (prefix with `corepack pnpm`) | Result |
| --- | --- |
| `install --frozen-lockfile` | Passed with the updated lockfile |
| `test` | 226 tests, 26 suites passed |
| `lint` | Cloudflare binding types, TypeScript, ESLint, Stylelint, Prettier passed |
| `build` | Website, separate API Worker, and publishing CLI passed |
| `test:blog-backend` | Real local D1/R2, service binding, atomic conflicts, restart durability, and withdrawal passed |
| `test:blog-library` | CLI validation/import/replay, owner approval, built website, media, same-origin requests, edits, and 404/503 handling passed |
| `test:blog-api` | All eight fault-injection browser tests passed |
| `test:e2e` | 91 passed; eight stub-only tests skipped and covered by the preceding command |
| `audit --audit-level=high` | Passed; no known vulnerabilities reported |

The integration and browser commands ran sequentially. Local server checks needed
execution outside the filesystem/network sandbox because it rejects local
listeners with `EPERM`. Initial sandbox DNS/listener failures were environmental;
the successful reruns above used the same locked toolchain.

Local logs and audit JSON are in ignored `.cache/blog-launch/`. These are local
verification evidence, not a substitute for CI, independent human review, a
reviewed release record, or staging acceptance. After merge, bind the release
record and CI evidence to the actual merged SHA; do not label the base SHA as
containing this branch's dependency changes.

## Dependency disposition

The initial audit reported four moderate and two low advisories. This change
remediates all six without changing application interfaces or schemas:

| Dependency | Exposure and disposition |
| --- | --- |
| `@vitest/mocker` 5.0.0 | Development test tooling; two moderate advisories. Raise Vitest's minimum to 5.0.3; the frozen lock resolves Vitest and its mocker to 5.0.5. |
| `fast-uri` 3.1.8 | Transitive URI parsing through Ajv/webpack and lint tooling; two moderate and two low advisories. Raise the existing override to 3.1.9 for affected 3.x versions. |

Sources: Vitest [mock registration](https://github.com/advisories/GHSA-qxg6-89mg-rqv8)
and [Windows traversal](https://github.com/advisories/GHSA-xp26-3454-mjgp);
fast-uri [encoded schemes](https://github.com/advisories/GHSA-w74x-v6f9-j3xg),
[host canonicalization](https://github.com/advisories/GHSA-wjr9-j795-jxcr),
[path equivalence](https://github.com/advisories/GHSA-xhq7-xmqj-769h), and
[suffix schemes](https://github.com/advisories/GHSA-333x-w4r6-6crp).

An audit of an isolated copy without the existing braces exception also reported
zero advisories. The obsolete suppression was removed and the normal audit rerun;
it passes without advisory exceptions. No dependency install scripts, workflow
permissions, API behavior, or database schema are changed by this preparation PR.
Direct security review of this diff found no new credential handling or runtime
input paths; this is implementation-agent review, not independent human approval.

## Verified staging state

Use the organization repository above, not the older personal `origin` remote.
Cloudflare operations use `cf` and explicit account selection.

| Item | Observed or prepared state |
| --- | --- |
| Cloudflare account | `8441cc5cfd234da96da8cdf090d94658` (existing staging account) |
| GitHub staging branch policy | `main` only |
| Existing website Worker | `smokeshow-web-staging` |
| Dedicated blog database | Created and read back: `smokeshow-blog-staging`, ID `d8115df7-a315-4b36-9c9c-52680d6af4e7`; empty, unmigrated |
| Existing leads database | Separate and unchanged |
| `BLOG_DB_ID` Environment variable | Set to the verified dedicated blog database ID |
| `BLOG_BUCKET_NAME` Environment variable | Planned name `smokeshow-blog-media-staging`; bucket not created |
| `BLOG_DEPLOY_URL` Environment variable | Planned origin `https://smokeshow-blog-api-staging.dev40.workers.dev`; API not deployed |
| R2 | Listing rejected with Cloudflare error 10042: enable R2 through the dashboard |
| GitHub staging secrets | Existing `CLOUDFLARE_API_TOKEN` name confirmed; its value and exact permissions were not read |
| Blog credentials | `BLOG_API_TOKEN` and `BLOG_ADMIN_CREDENTIALS` are not configured |
| Website integration | No website secret, configuration, or deployment changed |

No existing blog database or bucket was migrated or overwritten. Backup/restore
acceptance against account resources remains pending; local restart durability
tests do not establish backup restoration.

## Resume staging

1. Enable R2 in the staging account. Use discovered `cf` bucket commands to create
   `smokeshow-blog-media-staging` and verify both managed public access and custom
   domains are disabled. Do not substitute a public bucket or the leads database.
2. Provision distinct named editor and owner credentials through the operator's
   secret manager. Store only their SHA-256 digest registry in
   `BLOG_ADMIN_CREDENTIALS`; store a separate random read token in `BLOG_API_TOKEN`.
   Configure both as staging GitHub Environment secrets. Before the website
   release, provision the same read token as its Worker secret: the website
   deployment workflow does not copy this secret from GitHub automatically.
   Never paste raw credentials into chat, manifests, PRs, or logs.
3. Merge the preparation PR after CI and required reviews. Add the append-only
   `releases/<merged_sha>.json` in a separately reviewed change, following
   [the release runbook](BLOG_API_RELEASE.md). Human reviewer and security/test
   statuses must have actual supporting evidence; no release record was created
   while those gates remain pending.
4. Dispatch **Deploy blog API** from main with matching full `commit-sha` and
   `approved-sha`, leaving `deploy-production=false`. Allow the guarded workflow
   to apply the blog migration and deploy. Verify authenticated `/health` reports
   that SHA, healthy D1/R2, and `Cache-Control: no-store` before website rollout.
5. When the owner supplies the content package, validate/dry-run all three
   manifests with the built CLI. Follow [publishing instructions](BLOG_PUBLISHING.md)
   for draft import, exact-revision owner approval, curation, and staged lifecycle
   checks. Record environment, source hashes, slug, version, and revision ID for
   each result. Local-image replays require explicit update/version flags;
   reconcile partial imports and conflicts before retrying.

Production remains deferred. The owner selected Dev40's account for eventual
production resources, separate from staging. The organization repository has no
production Environment yet; its reviewers, branch restrictions, resources,
credentials, backup/restore checks, and editorial acceptance must be established
before a later production rollout. Do not treat the personal repository's
production reviewer configuration as protection for the organization repository.
