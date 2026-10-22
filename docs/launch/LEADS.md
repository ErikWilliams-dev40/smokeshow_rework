# Wholesale lead delivery

Both forms POST email, name, phone, optional interest and a random submission ID
to `/api/leads`. The ID stays in component memory and authorizes status/resend;
only its SHA-256 digest is stored. Retrying the same submission is idempotent.
Editing details starts a new inquiry. Pending submissions do not notify sales.

D1 stores leads and an email outbox in the additive `0001_leads.sql` migration.
Cloudflare Email Sending sends verification, then a sales notification and
customer acknowledgment after confirmation. Mail includes plain text and HTML.
A link has a 24-hour signed credential in its fragment, not its query string.
`/verify-email` removes the fragment from browser history and requires an explicit
POST to confirm. Resending rotates the credential and is limited to once a minute.

The outbox claims jobs with two-minute leases, attempts immediate delivery, and
retries on a five-minute cron with exponential backoff, up to five attempts.
Failed jobs remain retrievable for investigation; a new verification resend
creates a new job. Notification jobs are unique per lead, and repeated confirmation
does not enqueue them again. The mail transport is **at least once**: a crash after
provider acceptance but before recording success can cause a duplicate email.
Sales can deduplicate by the stable lead ID included in the notification.

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
