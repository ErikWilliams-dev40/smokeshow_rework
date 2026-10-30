# Wholesale lead delivery

Both forms POST email, name, phone, optional interest and a random submission ID
to `/api/leads`. The ID stays in component memory and authorizes status/resend;
only its SHA-256 digest is stored. Retrying the same submission is idempotent.
The key is bound to trimmed name/phone, lowercased trimmed email and interest.
An identical retry retains it after a lost response; changing details rotates it.
A conflict exposes a new-inquiry action that retains the entered fields.
Separate inquiries from the same email are allowed; there is no unique-email
constraint. Pending submissions do not notify sales.

D1 stores leads and an email outbox in the additive `0001_leads.sql` migration.
Cloudflare Email Sending sends verification, then a sales notification and
customer acknowledgment after confirmation. Mail includes plain text and HTML.
A link has a 24-hour signed credential in its fragment, not its query string.
`/verify-email` removes the fragment from browser history and requires an explicit
POST to confirm. Resending rotates the credential and is limited to once a minute.

An identical form resubmission can also recover the current failed verification
delivery once that same one-minute cooldown has elapsed. Recovery requires an
unverified lead and a failed, undelivered job with no active lease. It atomically
rotates the verification version, renews the 24-hour expiration and queues one
new delivery, retaining the failed job for investigation. Concurrent retries
create only one replacement. During the cooldown, submission still returns 202
with the failed delivery state; existing request rate limits can return 429.
Queued, sent and confirmed submissions retain their existing idempotent behavior.
Changed details return 409 without modifying the lead or its deliveries.

The response follows the durable lead/outbox transaction, without awaiting email.
The server-only Cloudflare adapter schedules immediate delivery with `waitUntil`.
The outbox claims jobs with two-minute leases and retries on a five-minute cron
with exponential backoff, up to five attempts, including interrupted attempts.
Documented permanent provider rejections (for example, suppressed recipients,
invalid payloads and unverified senders) stop automatic retries immediately.
Rate/quota limits, internal errors and unknown failures retain bounded retries.
Only a nonempty provider message ID records acceptance. `delivery: sent` means
provider acceptance, not guaranteed inbox delivery.
Failed jobs remain retrievable for investigation; a new verification resend
creates a new job. Notification jobs are unique per lead, and repeated confirmation
does not enqueue them again. The mail transport is **at least once**: a crash after
provider acceptance but before recording success can cause a duplicate email.
Sales can deduplicate by the stable lead ID included in the notification.

All four client operations use an immediate in-flight guard, a 30-second deadline
and runtime response validation. Confirmation retains the fragment credential in
component memory after failures and succeeds only on a valid confirmed response.
The server accepts only `application/json` (case-insensitive, parameters allowed),
strict UTF-8 and at most 8192 actual bytes; input has a 10-second deadline and
cleans up disconnected readers.

There is no artificial email-send deadline: a timeout cannot cancel provider
acceptance. Platform-bounded background work may end before recording delivery;
the durable outbox, leases and cron remain authoritative. See
[Cloudflare execution guidance](https://developers.cloudflare.com/workers/runtime-apis/context/#waituntil).
Readiness checks required D1 columns within three seconds and validates enabled
mail configuration without sending. `checks.leads` is `disabled`, `ok`, or `error`.

## Modes

- Local: actual local SQLite persistence and simulated mail; no outbound emails.
- Staging: disabled by default. Both application and binding restrict recipients
  to `LEAD_TEST_RECIPIENTS`; the sales inbox must also be on that list.
- Production: disabled by default until `LEADS_ENABLED=true` and required values
  are configured. Credentials are Worker secrets, never committed.

Apply migrations before enabling the pipeline. Do not undo these tables during
application rollback. The pre-launch application ignores them safely.

## Operations

Use authenticated `cf d1` access to retrieve leads and failed outbox records; no
public administration or export endpoint exists. Scope access to the account's
operators. Do not paste contact records or email contents into logs/issues.

Inspect `lead_deliveries.failed_at IS NOT NULL` when investigating mail failures.
After correcting mail configuration, an operator may clear `failed_at`, reset
`attempts` and set `due_at` to the current time for a specifically reviewed job.
Do not replay expired verification jobs; request a new link instead. Before
retrying uncertain sales notifications, check whether the inbox already received
that lead ID. Automatic logs contain only job IDs, attempt counts and operation
names, never contact details or credentials.

The scheduled handler emits `Lead delivery health` with pending/failed job
counts and `oldestOverdueSeconds`. Monitor any increase in failures or an oldest
overdue job older than ten minutes. Some failed verification jobs are deliberately
expired or superseded; distinguish these from current delivery failures before
replaying anything. Metrics contain no contact details. Provider failure logs
contain only an allowlisted code, job ID, attempt count and retry decision.
Use Email Service analytics to investigate acceptance, suppression and later
delivery failures; application acceptance cannot prove inbox delivery.

## API and failure contract

All operations are same-origin JSON POSTs with `Cache-Control: no-store`.

| Endpoint | Input | Success |
| --- | --- | --- |
| `/api/leads` | Email, name, phone, optional interest, UUID `submissionId`, honeypot `website` | 202 after durable persistence |
| `/api/leads/status` | `submissionId` | 200 with the matching inquiry state |
| `/api/leads/resend` | `submissionId` | 200 with replacement delivery queued when eligible |
| `/api/leads/verify` | Signed `token` | 200 with confirmed state after the transaction commits |

The existing success body remains `{status: pending|confirmed, delivery:
queued|sent|failed}`. The opaque submission ID is a bearer credential; do not
put it in URLs or logs. GET `/verify-email` displays a confirmation button;
opening a link, fetching it with HEAD, or scanning it does not confirm a lead.
Confirmation retains its token in component memory after failed requests.

Errors return `{error: string}`: 400 invalid input/token, 403 origin or staging
recipient restriction, 404 unknown inquiry credential, 408 body deadline, 409
changed details under the same submission ID, 410 expired/superseded token,
413 body over 8192 bytes, 415 unsupported media type, 429 throttled, and 503
disabled/unavailable dependencies. A 429 includes `Retry-After: 60`.

The rate-limit binding allows five requests per minute per IP/action and five
signup attempts per minute per normalized email. These platform limits are
best-effort and location-scoped; they are not an exact global quota. The
one-minute resend cooldown is enforced atomically in D1. Honeypots return a
neutral 202 without persisting or sending. Normalize by trimming and lowercasing
email; preserve plus tags and dots. Turnstile and marketing are outside this
service.

## Credentials and staging setup

Email addresses are configuration, not credentials. Choose `MAIL_FROM` on a
domain you control, then enable the sending domain in Cloudflare **Compute & AI
> Email Service**. Verify the supplied SPF/DKIM records and the domain's DMARC
policy without replacing unrelated DNS records. Confirm Workers Paid/account
eligibility and current sending quota before enabling arbitrary recipients.
Use real inboxes you control for the customer test and `SALES_INBOX`; include
both in `LEAD_TEST_RECIPIENTS`. One inbox can serve both roles.

The native email binding needs no separate email API key. Authenticate the local
CLI with `corepack pnpm exec cf auth login --no-browser`, or provide a separately
scoped `CLOUDFLARE_API_TOKEN` through a protected local environment. Obtain API
tokens in Cloudflare **My Profile > API Tokens**. Scope account permissions to
the required Worker/D1 operations and the staging account. The existing GitHub
staging Environment deploy token can be used by Actions, but its value cannot
be read back from GitHub. Never paste tokens into chat or tickets.

Generate `LEAD_TOKEN_SECRET` independently for each environment using a secure
random generator (at least 32 random characters). For example, run this locally
with shell tracing disabled; it creates an ignored, owner-readable file without
printing the secret:

```sh
node --input-type=module <<'JS'
import {randomBytes} from 'node:crypto';
import {mkdirSync, writeFileSync} from 'node:fs';
mkdirSync('.cache/lead-setup', {recursive:true, mode:0o700});
writeFileSync('.cache/lead-setup/signing-secret.txt', randomBytes(48).toString('base64url'), {mode:0o600, flag:'wx'});
JS
```

An authorized operator stores that value on **smokeshow-web-staging > Settings
> Variables and Secrets**, as a secret named `LEAD_TOKEN_SECRET`, and removes the
temporary file afterward. Store it in the organization's approved secret store
if recovery is required. A GitHub secret alone does not provision a Worker
secret. Do not rotate this key during an unrelated deploy.

Set `MAIL_FROM`, `SALES_INBOX`, `LEAD_TEST_RECIPIENTS` and initially
`LEADS_ENABLED=false` in GitHub **Settings > Environments > staging > Variables**.
The build config uses those values for both application checks and email-binding
recipient restrictions. Verify names and quota without sending:

```sh
corepack pnpm exec cf auth whoami
corepack pnpm exec cf workers secrets list --worker smokeshow-web-staging --mode staging
corepack pnpm exec cf email-sending limits get --mode staging
```

Apply the existing additive migration through the established staging release.
After sender, quota, allowlist, schema and signing secret are verified, set
staging `LEADS_ENABLED=true` and deploy the exact reviewed, merged SHA through
the existing human-triggered workflow with production unchecked. Health must
report that SHA, `checks.d1: ok` and `checks.leads: ok`; configuration probing
never sends email. Health with `checks.leads: disabled` is not signup acceptance.

The existing workflow refuses unmerged SHAs. Do not bypass that gate with a
direct deployment. See [LEADS_VERIFICATION.md](LEADS_VERIFICATION.md) for the
acceptance evidence and remaining external prerequisites.

## Rotation and rollback

To rotate the signing secret, disable signup/delivery in the affected environment
through the established release process, replace the Worker secret, then release
and verify readiness before re-enabling. Existing pending links signed by the old
secret become invalid; request a new verification email after rotation. Retain
stored inquiries, confirmation timestamps and outbox records. Do not claim
dual-key verification; this implementation intentionally accepts only the active
key. Handle interrupted/uncertain sends using the existing outbox runbook.

Application rollback keeps the D1 tables and data. Select an approved compatible
release using the repository rollback process; do not reverse the migration or
replay all failed jobs. Preserve production Environment review gates and keep
production signup disabled until its separate acceptance and approval complete.

## Verification commands

Under Node 22 with the package-manager version pinned in `package.json`, run
frozen installation, `corepack pnpm lint`, `corepack pnpm build`,
`corepack pnpm test`, `corepack pnpm test:e2e`, and the dependency audit.
`corepack pnpm test:leads` can also run the real workerd/D1 integration in
isolation. It uses disposable storage, simulates local mail, checks transaction
rollback, concurrent retries, persisted restart, signed confirmation, and cron
lease recovery. It also runs from the standard unit suite, so existing PR/main
test jobs execute it without a workflow change. Run browser suites sequentially
because they share build output.
