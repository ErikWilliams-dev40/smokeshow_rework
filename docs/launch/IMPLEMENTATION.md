# Wholesale launch implementation and review order

The owner approved implementation with placeholders for unavailable account,
mail and blog values. Production deployment, live delivery and search-console
setup remain pending configuration and release approval.

| Order | Stage | Tracking issue | Review PR |
| --- | --- | --- | --- |
| 1 | Correct the roadmap | [#92](https://github.com/House-of-Helix-CMD/smokeshow_rework/issues/92) | [#101](https://github.com/House-of-Helix-CMD/smokeshow_rework/pull/101) |
| 2 | Environment-aware indexing and metadata | [#93](https://github.com/House-of-Helix-CMD/smokeshow_rework/issues/93) | [#102](https://github.com/House-of-Helix-CMD/smokeshow_rework/pull/102) |
| 3 | Persist and verify leads before notifying sales | [#94](https://github.com/House-of-Helix-CMD/smokeshow_rework/issues/94) | [#103](https://github.com/House-of-Helix-CMD/smokeshow_rework/pull/103) |
| 4 | Approved blog discovery and resilient sitemap | [#95](https://github.com/House-of-Helix-CMD/smokeshow_rework/issues/95) | [#104](https://github.com/House-of-Helix-CMD/smokeshow_rework/pull/104) |
| 5 | Public navigation and breadcrumbs | [#96](https://github.com/House-of-Helix-CMD/smokeshow_rework/issues/96) | [#105](https://github.com/House-of-Helix-CMD/smokeshow_rework/pull/105) |
| 6 | Approved wholesale landing page | [#99](https://github.com/House-of-Helix-CMD/smokeshow_rework/issues/99) | [#106](https://github.com/House-of-Helix-CMD/smokeshow_rework/pull/106) |
| 7 | Safe structured data | [#100](https://github.com/House-of-Helix-CMD/smokeshow_rework/issues/100) | [#107](https://github.com/House-of-Helix-CMD/smokeshow_rework/pull/107) |
| 8 | Browser verification and measured performance | [#97](https://github.com/House-of-Helix-CMD/smokeshow_rework/issues/97) | [#108](https://github.com/House-of-Helix-CMD/smokeshow_rework/pull/108) |
| 9 | Separate deployment/rollback infrastructure | [#98](https://github.com/House-of-Helix-CMD/smokeshow_rework/issues/98) | [#109](https://github.com/House-of-Helix-CMD/smokeshow_rework/pull/109) |

The PRs form an ordered review stack. Review each against its immediate predecessor;
retarget onto `main` as predecessors merge. Do not release a partial stack. Workflow
changes are isolated in the last PR. Existing untracked handoff directories were
preserved. No checkout, accounts, public pricing, analytics or administration UI
were added.

The local evidence includes 187 unit/guard tests, full lint/type/format checks,
local/staging/production Worker builds, real local D1 persistence and additive migration reapplication,
91 browser consent/accessibility/layout tests, and eight controlled blog API browser
tests. Email delivery tests use mocks/simulation; actual sending requires staging.
The dependency audit passes under the existing advisory exception documented in
REVIEW.md (removed in b52df9b, #110, on 2026-10-26; no exception remains). Performance data and reproduction instructions are in PERFORMANCE.md.

Use CONFIGURATION.md for the credentials/information still required, LEADS.md for
verification/outbox recovery, and RELEASE.md for staging, launch and data-preserving
rollback. No release approval or live validation is claimed by these local checks.

The repository currently runs PR CI only for the `main` base. Retarget each stage
as its predecessor lands and obtain fresh required CI results before merging;
local validation of the integrated stack does not replace that gate.
