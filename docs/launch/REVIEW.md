# Implementation review and remaining release gates

Author self-review found no unresolved issue requiring a source change in the
launch diff. This is not independent approval; the established peer, security and
business review gates remain open.

Reviewed boundaries: same-origin JSON submission; bounded request bodies; shared
validation; IP/email rate limits; parameterized D1 queries; idempotent persistence;
24-hour signed credentials; explicit POST confirmation; transactional notification
insertion; outbox leases/retries; staging recipient restrictions; safe JSON-LD and
email HTML serialization; no contact data in browser persistence, URLs or logs;
public-route indexing; approved-only blog discovery/cache behavior; workflow SHA,
ancestry, Environment, token forwarding and migration/rollback controls.

The outbox claim also rechecks the due time after obtaining a candidate, preventing
a concurrent worker from immediately reclaiming a delivery another worker just
rescheduled. Logical notification jobs are unique; mail transport remains
at-least-once, so a crash after provider acceptance and before marking delivery can
cause a repeated message. See LEADS.md for recovery.

The additive migration is compatible with the prior application and application
rollback retains all lead data. No destructive migration or reverse migration is
introduced. Worker binding changes are intentional: staging destinations are
restricted to configured test recipients; production customer addresses are dynamic
and require the onboarded Email Sending domain. Activation defaults to disabled.

Validation uses local D1, simulated mail, a controlled blog API stub and built
Worker previews. It cannot establish real sender authentication, upstream API
ownership, DNS readiness, production delivery or external search-console ownership.
Those checks remain in CONFIGURATION.md and RELEASE.md.

The dependency audit passes the configured high-severity threshold with the
repository's pre-existing GHSA-vfj7-8cjw-p6xm exception for build-time glob tooling;
two moderate advisories remain. This change adds no runtime dependency and does not
change audit exceptions. (Update 2026-10-26: that exception was removed in
b52df9b, #110; the audit now passes with no exceptions.) The existing compliance copy and private pricing modules
are unchanged.
