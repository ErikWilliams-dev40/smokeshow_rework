# Email signup verification and staging acceptance

Status on 2026-10-29: implementation and local verification complete. Live
staging email acceptance remains pending. Production signup is not activated.

Tracking issue: [#141](https://github.com/House-of-Helix-CMD/smokeshow_rework/issues/141).
The isolated branch `feat/141-email-signup` starts from verified organization
main `15f39eb399b2c2b2aabb72edf4d5d75c8d813345`. Signup repairs were reviewed and
reused from the earlier project-repair worktree; unrelated blog and deployment
changes were excluded. The original checkout and its untracked handoffs remain
separate. There are no dependency, schema, workflow, or approved-copy changes.

## Completed verification

All commands used Node 22.23.4 and pinned pnpm 12.3.4. Suites sharing build
output ran sequentially.

| Check | Result |
| --- | --- |
| Frozen installation | Passed using the existing package store; lockfile unchanged |
| Generated Cloudflare types, TypeScript, ESLint, Stylelint, formatting | Passed through `corepack pnpm lint` |
| Production website, API and publishing-tool builds | Passed through `corepack pnpm build` |
| Standard unit/guard suite | 309 passed across 34 files |
| Real workerd/D1 integration | Passed directly and from the standard unit suite |
| Built website browser suite | 97 passed; 8 unrelated blog fault-fixture cases skipped by their existing environment guard |
| Dependency audit | No known vulnerabilities; `corepack pnpm audit --audit-level=high` passed |
| Whitespace/diff check | Passed |

Real-runtime persistence tests prove transactional lead/outbox creation,
transaction rollback on an injected outbox failure, concurrent idempotent
retries, survival across a runtime restart, signed confirmation, a stable
confirmation timestamp on replay, separate inquiries from one email address,
and scheduled recovery after a lease expires. They use disposable actual D1
storage and local mail simulation; they send no outbound email.

Additional tests cover malformed JSON/media types/UTF-8, byte limits,
disconnects and body deadlines; missing schema/configuration and readiness
timeouts; honeypots, origin restrictions, normalized per-email throttling and
protected inquiry access; permanent provider errors, transient retries,
interrupted final attempts, malformed provider acceptance, concurrent delivery
leases and redacted logs. Browser tests cover both forms, retained retry IDs,
edited details, conflicts, duplicate submits, malformed responses, a stalled
request, explicit confirmation and token retention after failure.

Ignored local logs are in `.cache/email-signup-verification/`. The real-runtime
test entrypoint is test-only and is not included in the application build.
Existing PR/main unit jobs now include the runtime test without a workflow edit.
Remote CI and independent review are separate from these local results.

## Verified staging prerequisites and blockers

Read-only GitHub inspection found the staging account/database/deployment URL
variables and existing `CLOUDFLARE_API_TOKEN`, `BLOG_API_TOKEN`, and
`BLOG_ADMIN_CREDENTIALS` Environment secret names. GitHub does not reveal secret
values. The staging Environment currently has no lead activation, sender,
sales-inbox or recipient-allowlist variables.

Local `cf auth whoami` reports unauthenticated. The read-only Email Sending quota
check reports that no authentication token is available. Sender-domain status,
Worker signing-secret presence, sending quota and live inbox delivery could not
be verified. The attempted public staging-health fetch was interrupted; no fresh
deployed-SHA evidence is claimed here.

Required before acceptance:

- An authorized Cloudflare login or scoped token for the staging account.
- An eligible Email Sending account, authenticated sender domain and available
  sending quota.
- Owner-selected `MAIL_FROM`, a controlled customer inbox, `SALES_INBOX`, and
  `LEAD_TEST_RECIPIENTS` including both inboxes.
- A securely generated `LEAD_TOKEN_SECRET` provisioned as a staging Worker
  secret. No separate email API key is required.
- Review and merge of this branch. Existing deployment workflows reject
  unmerged SHAs; do not work around that check with a direct deployment.

Use [LEADS.md](LEADS.md#credentials-and-staging-setup) for credential setup and
secret rotation. No secrets, contact records or real verification links belong
in this report. No production configuration was changed.

## Controlled staging acceptance checklist

Run these checks only after the prerequisites above are met. Keep production
unchecked in the existing human-triggered deployment workflow. Assign a named
operator to record the results and a human reviewer to assess them.

1. Deploy the exact reviewed, merged SHA. Record the workflow run URL, SHA and
   staging URL. Verify `/api/health` identifies that SHA with HTTP 200,
   `status: ok`, `checks.d1: ok`, `checks.leads: ok`, and `no-store`. Verify the
   website's blog health endpoint also identifies the intended release. The
   readiness handler's internal deadline is three seconds and sends no email.
2. Submit one inquiry from an allowlisted inbox. Record only its opaque lead/job
   identifiers in restricted operational evidence. Confirm a pending lead and
   verification job exist before delivery; the API returns 202 promptly.
3. Observe the received plain-text/HTML verification email and its SPF/DKIM/DMARC
   results. Provider acceptance alone is insufficient to check this step off.
4. Open the verification link. Confirm its fragment disappears, no verification
   POST occurs and the record stays pending. Press **Confirm email**; confirm
   the timestamp is set and sales/acknowledgment jobs are created once. Confirm
   those controlled inbox messages arrive.
5. Repeat the verification POST with the same valid credential in the controlled
   test session. Confirm the timestamp and notification-job count stay unchanged.
   Retry an unchanged signup after an uncertain response and confirm it reuses
   the inquiry. Submit a deliberately new inquiry at the same email and confirm
   it is separate.
6. In a new pending inquiry, exercise resend cooldown and then a replacement
   link. Confirm 429 has `Retry-After: 60`, the old version returns 410, and the
   new link confirms. Exercise throttling without sending beyond the controlled
   recipient allowlist. Expiry and malformed-token fault cases must retain
   their passing automated evidence.
7. In an isolated controlled staging failure exercise, record the injected
   delivery failure and recovery method. Confirm the same durable job is retried
   after its lease/backoff, cron recovers it, and no extra inquiry is created.
   Inspect the recipient inbox for duplicates after an uncertain provider
   outcome. Do not change shared production mail or DNS to inject a fault.
8. Record post-test readiness, aggregate pending/failed counts, oldest-overdue
   duration, and any remaining failed test jobs. Review intentional expired or
   superseded verification jobs separately. Document operator cleanup without
   deleting business records or replaying all failed jobs.

All live checklist items remain **pending**. Record actual dates, run URLs,
SHA, outcomes and reviewer identity after execution; do not substitute local
simulation results for Cloudflare staging evidence. Production requires its
existing independent, peer and business approval gates after staging acceptance.
