# Independent backend and blog security review

Reviewed on 2026-10-21 by the repository's Claude Code `security-reviewer`
agent, after the owner explicitly authorized source sharing with that service.
Scope: `9be6009729d418f9a2a04758c02fa6c5bae2d12f...49ff1767bc87576d855a75cad238b5fe0783854e`,
covering the implementation in PRs #67–71. The reviewer operated read-only.

## Verdict

The reviewer found no merge-blocking issue and no confirmed Critical, High or
Medium finding. Independent AI review is complete; human approval and the
remaining release gates are still required.

## Findings and disposition

1. **Low — unrestricted public requests can consume private API capacity.**
   The media route performs a fresh authenticated fetch, and arbitrary article
   slugs or pagination keys bypass successful-article caching. This can exhaust
   upstream quota or availability without exposing the token. Tracked in
   [#73](https://github.com/House-of-Helix-CMD/smokeshow_rework/issues/73) for a
   separately reviewed traffic-control change. No rate-limit binding or platform
   rule was added as part of this review.
2. **Unconfirmed — the upstream media endpoint might expose unapproved assets.**
   The site checks article approval, but proxies any valid media ID. The separate
   API was unavailable to inspect, so its media publication policy is unknown.
   [#74](https://github.com/House-of-Helix-CMD/smokeshow_rework/issues/74) requires
   the API owner to demonstrate that the site's credential can retrieve only
   approved public assets before the real integration is enabled. Draft-only,
   rejected and private media must return 404. If the upstream cannot enforce
   that boundary, a reviewed authorization contract is required first.

   **Disposition (2026-10-29): implemented, deployed demonstration outstanding.**
   The previously unavailable upstream is now in this repository
   (`services/blog-api`). `Repository.publicMedia` in
   `services/blog-api/src/repository.ts` returns a media row only when the ID is
   referenced by `revision_media` for the article's current `published_revision`
   *and* an `approvals` row matches that same revision. Withdrawal deletes the
   `publication` row, so the same media ID immediately stops resolving (already
   fetched bytes remain in browser caches for the documented one-year immutable
   window). Objects live in a private R2 bucket that the Worker reaches through
   its binding; the release runbook requires public access and custom domains to
   stay disabled. `tests/unit/blog-api-backend.test.ts` ("only exposes media
   referenced by a currently published revision, including shared references")
   and `scripts/test-blog-backend.mjs` cover 404 before approval, 404 after
   withdrawal and shared references. This records the implemented boundary; #74
   still requires the same check against the deployed API with the website's
   read credential during staging acceptance.

## Examined boundaries

The reviewer inspected token storage and binding access, URL/path validation,
redirect rejection, deadlines and body limits, error handling, local-fixture
restrictions, article approval and escaping, media signatures and response
headers, same-origin browser traffic, consent destinations and cookie flags,
pricing validation, health diagnostics, import guards, infrastructure changes,
and CI/dependency changes.

The consent destinations were already restricted before this work; this change
centralizes that existing policy. The health JSON remains unchanged, including
its string-valued D1 status. No historical open-redirect vulnerability or new
health-response shape is implied by the review.

## Evidence limits and rollback

This was a static review. The reviewer did not independently rerun tests,
builds or Worker preview, verify runtime streaming/cache semantics, or inspect
the separate API. Documentation and tests were scanned for credentials rather
than reviewed line by line. The handoff reference directory was excluded.
Runtime evidence from implementation testing is recorded separately in
[BLOG_VERIFICATION.md](BLOG_VERIFICATION.md).

No database migration or schema change is present. Redeploying the previous
application version does not lose stored data, so rollback remains safe. An
unused blog secret may remain after rollback. Previously published immutable
images can remain in browser caches; upstream withdrawal does not recall them.
