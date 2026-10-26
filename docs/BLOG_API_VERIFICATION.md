# Smoke Signals API verification

Verified locally on 2026-10-26 with Node 22.23.4 and pnpm 12.3.4.

- Unit/guard suite: 218 tests across 25 suites.
- Lint: binding types, TypeScript, ESLint, CSS and formatting passed.
- Production build: website, separate API Worker and Node publishing CLI passed.
- Dependency audit: high-severity gate passed. Zod 4.6.6 and Undici 7.30.1 replace
  the vulnerable versions; no new exception or install script was introduced.
  Six lower-severity advisories remain (two low, four moderate).
- Worker runtime: real D1/R2, service binding, transactional concurrent edits,
  owner-only publication, image visibility, restart durability and withdrawal.
- Publishing integration: manifest validation/dry-run, import, identical replay,
  owner approval, built website homepage/search/article/image, same-origin browser
  requests, token absence in HTML, revision replacement, withdrawal and HTTP 404/503.
- Existing authenticated stub suite: eight browser tests passed, covering API
  timeouts, redirects, invalid payloads, media failures and caching behavior.
- Full browser regression suite: 91 passed; eight stub-only tests intentionally
  skipped there and verified by the dedicated suite above.

The unit cache tests exercise expiry without a five-minute wall-clock wait.
Real API runtime tests restart workerd against the same isolated persisted store.
The browser integration uses the real API over loopback HTTP; the separate runtime
test uses a genuine Worker service binding, and transport unit tests prove there
is no HTTP fallback after binding failure or a missing deployed binding.

## Security review and limits

Direct review following the repository security-reviewer checklist covered read
versus editor/owner credentials, exact-revision approval, optimistic concurrency
inside D1 batches, immutable revision history, private R2 objects, shared media
references, request byte limits, image headers, input validation, safe errors and
logs, CLI redirects/path confinement, and secret exclusion from browser output.
No confirmed merge blocker remains in those examined paths. This is the
implementation agent's review, not an independent human approval.

Database migrations are additive and confined to the dedicated blog database.
Application rollback preserves revisions and image objects. Published content
withdrawal is subject to the existing five-minute article cache and potentially
year-long browser image caches. No test establishes instantaneous global recall.

No real articles were approved or imported into a deployed environment. No
Cloudflare resource was provisioned or deployed. Staging integration with account
resources, operational credentials, human review and business approval remain
release prerequisites. The existing public request-amplification follow-up (#73)
is not resolved by adding the private backend.
