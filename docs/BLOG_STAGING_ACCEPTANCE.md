# Blog hardening and staging acceptance

Issue #110 tracks publication correctness and staging activation; #73 tracks traffic
controls and #74 tracks public-media authorization. This document specifies checks,
not a claim that staging has passed. Independent human review and the append-only
release record are required before deployment. Production is excluded from this run.

## Endpoint and failure matrix

| Interface | Access | Required evidence |
| --- | --- | --- |
| Articles/list/homepage | Reader, editor, owner | Only approved content; Unicode filtering; bounded pagination; old publication survives edits; 404 after withdrawal |
| Admin article create/edit/inspect/history | Editor, owner | Atomic response identity; version conflict; no partial audit/revision writes; snapshot inspection; bounded approval summaries |
| Approval/withdrawal | Owner | Reader/editor denied; exact historical revision; immutable original publication date; conflict and rollback |
| Revision approval listing | Editor, owner | Paginated complete history; wrong article/revision 404; website credential denied |
| Admin homepage GET/PUT | Editor read, owner write | Versioned readback; concurrent updates produce one 409; invalid selections do not mutate |
| Admin media GET/POST | Editor, owner | Draft inspection; image signature/size/dimensions; deduplication/repair; uncertain registration preserves bytes |
| Public media GET | Approved references only | Draft-only 404; shared references; last withdrawal 404; immutable same-origin proxy |
| API health | Authenticated | Exact SHA, D1/R2 readiness, three-second dependency deadlines, no-store |
| Website blog health | Public | Correct read token/service binding/API SHA; no HTTP fallback; 503 and Retry-After on failure |
| Input failures | All applicable routes | 400 JSON/UTF-8/schema/query/interruption; 408 deadlines; 413 actual bytes; 415 type; 422 references; sanitized stored-data/dependency 503 |
| Traffic controls | Deployed blog/admin | 429 before storage/upstream; per-client website and per-actor admin keys; separate namespaces; limiter failure 503 |
| CLI | Individual editor/owner | Explicit updates/versions; dry runs without writes; consistent pagination; 10,000 record cap; deduplicated file preparation; rehash before upload |

## Release and recovery sequence

1. Run the complete Node 22 verification sequence and obtain CI/security and human
   review on each PR. Merge publishing, capacity and readiness changes before the
   separate workflow PR. Create `releases/<approved-sha>.json` with actual evidence.
2. Preserve staging D1/R2 exports in restricted storage and restore into scratch
   resources. Compare table counts and media hashes before any migration. Existing
   staging contains the original schema; apply 0002/0003 without modifying 0001.
3. Provision the GitHub staging variables and credentials. Use separate operator
   editor/owner and temporary verification editor/owner identities. Retain raw
   tokens only in the restricted local handoff; the API registry contains digests.
4. On first deployment there is no API writer. On subsequent upgrades, temporarily
   replace the API admin registry with `[]` before migrations/backfill. The release
   restores the configured registry only when the new Worker is deployed. If any
   step fails, keep writes paused, investigate, and rerun the idempotent backfill.
5. Dispatch API staging only, then the website at the same reviewed SHA. Both
   health checks must pass. Never promote merely because the leads health is green.
6. Run `node scripts/verify-blog-staging.mjs` with `COMMIT_SHA`, `BLOG_API_TOKEN`,
   `BLOG_EDITOR_TOKEN`, and `BLOG_OWNER_TOKEN` loaded securely (no shell tracing).
   The last two must be temporary verification credentials. The script publishes
   synthetic content, checks browser behavior, observes readiness for 15 minutes,
   restores curation and withdraws its articles. Evidence goes to ignored
   `.cache/staging-verification/`. Investigate any cleanup failure by recorded slug.
7. Build an isolated website canary with `BLOG_STAGING_CANARY=true` and staging mode,
   the same API binding and SHA, and `DEPLOY_URL` set to
   `https://smokeshow-web-staging-canary.dev40.workers.dev`. Its name and rate-limit
   namespace are separate; lead processing and scheduled triggers are disabled.
   Deploy only reviewed code using `cf --provision=false` and a temporary secret
   file containing an intentionally incorrect read token. Run
   `node scripts/verify-blog-canary.mjs outage`; then update only the canary's token
   to the correct one, run `recovered`, then `throttle`. These tests must not take
   down or load-test the main staging site. Delete the temporary canary afterward.
8. Remove temporary verification IDs from the API registry using the verified cf
   secret update interface; keep operator credentials and the website token. Run
   `node scripts/verify-blog-canary.mjs revoked` with the retired tokens, then rerun
   API/website readiness. Record sanitized results and revoke/delete temporary
   secret files. No production dispatch is part of acceptance.

Application rollback preserves all D1/R2 data. The homepage version column and search
projection are backward compatible with the prior Worker. An older Worker does not
maintain the search projection; pause writes and rebuild it before upgrading again.
Do not restore a backup over live data as a routine rollback. Never treat synthetic
owner approvals as human code review or approval of real editorial content.

## Implementation evidence — 2026-10-29

The review stack is [#118](https://github.com/House-of-Helix-CMD/smokeshow_rework/pull/118)
(publishing), [#119](https://github.com/House-of-Helix-CMD/smokeshow_rework/pull/119)
(capacity), [#120](https://github.com/House-of-Helix-CMD/smokeshow_rework/pull/120)
(readiness), and [#121](https://github.com/House-of-Helix-CMD/smokeshow_rework/pull/121)
(workflows). Dependent PRs target their predecessor until it merges; retarget them
to main and rerun the main-targeted review gates before merging.

Local Node 22.23.4 / pnpm 12.3.4 evidence: frozen installation, full lint,
265 unit/guard tests across 31 suites, website/API/CLI build, real Worker D1/R2
persistence integration, CLI/browser publishing integration, all eight authenticated
fault-injection browser checks, and 91 browser regressions passed. Eight stub tests
are intentionally skipped in the general browser suite and run separately. The
normal high-severity dependency audit reported no known vulnerabilities.
The staging-canary build was inspected: separate Worker name and namespace 1106,
no scheduled triggers, lead processing disabled, and the intended API binding.
Logs are local ignored `.cache/hardening-*.log` files; CI is the durable check record.

The staging Environment now has `BLOG_API_URL`, `BLOG_API_TOKEN`, and
`BLOG_ADMIN_CREDENTIALS`. Distinct operator and temporary verification editor/owner
credentials were generated; raw credentials remain in a mode-0600 handoff inside a
mode-0700 directory outside the repository. Worker token reconciliation occurs in
the reviewed deployment workflow. No credential value is included in this record.

The original staging D1 schema/data was exported with cf read queries and restored
into an isolated scratch D1 database. All nine table inventories matched (only the
homepage seed and original migration record were nonempty). Both new migrations and
the cf-driven search backfill passed there. The source R2 inventory was empty; the
scratch bucket also had no objects, public access, or custom domains. Both scratch
resources were then removed. Restricted backup evidence is retained outside the
repository. This proves an empty-library recovery rehearsal, not restoration of a
populated media library; repeat that check after staging content acceptance.

Independent human approval, the reviewed release record, actual staging deployment,
the 15-minute live observation, populated-media recovery, canary outage/throttling,
and final verification-token revocation remain outstanding. No production change
or claim of live staging acceptance is implied by these local/CI results.
