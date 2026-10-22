# Wholesale launch implementation and review order

The owner approved implementation with placeholders for unavailable account,
mail and blog values. Production deployment, live delivery and search-console
setup remain pending configuration and release approval.

| Order | Stage | Tracking issue |
| --- | --- | --- |
| 1 | Correct the roadmap | #92 |
| 2 | Environment-aware indexing and metadata | #93 |
| 3 | Persist and verify leads before notifying sales | #94 |
| 4 | Approved blog discovery and resilient sitemap | #95 |
| 5 | Public navigation and breadcrumbs | #96 |
| 6 | Approved wholesale landing page | #99 |
| 7 | Safe structured data | #100 |
| 8 | Browser verification and measured performance | #97 |
| 9 | Separate deployment/rollback infrastructure | #98 |

The PRs form an ordered review stack. Review each against its immediate predecessor;
retarget onto `main` as predecessors merge. Do not release a partial stack. Workflow
changes are isolated in the last PR. Existing untracked handoff directories were
preserved. No checkout, accounts, public pricing, analytics or administration UI
were added.

The local evidence includes 187 unit/guard tests, full lint/type/format checks,
Worker builds, real local D1 persistence and additive migration reapplication,
browser consent/accessibility/layout tests, and eight controlled blog API browser
tests. Email delivery tests use mocks/simulation; actual sending requires staging.
The dependency audit passes under the existing advisory exception documented in
REVIEW.md. Performance data and reproduction instructions are in PERFORMANCE.md.

Use CONFIGURATION.md for the credentials/information still required, LEADS.md for
verification/outbox recovery, and RELEASE.md for staging, launch and data-preserving
rollback. No release approval or live validation is claimed by these local checks.
