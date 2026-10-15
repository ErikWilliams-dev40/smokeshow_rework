# Policies

The company governance this project follows, vendored from
[`House-of-Helix-CMD/helix-engineering`](https://github.com/House-of-Helix-CMD/helix-engineering)
so the rules travel with the code and are reviewed through this repository's own pull
requests.

## Source

| | |
| --- | --- |
| Repository | <https://github.com/House-of-Helix-CMD/helix-engineering> |
| Commit | `5a858499e0d564ab2ab77a8ddc6915198360f981` |
| Pulled | 2026-10-14 |

Files under `policies/`, `standards/`, `security/`, `onboarding/`, `templates/` and
`architecture/` are copies, byte-for-byte. **Do not edit them here.** A local edit forks
policy silently; fix the source repository instead, then re-pull. An intended local
divergence belongs in this project's own documents, stated as a deliberate exception.

## Policies

| Document | Covers |
| --- | --- |
| [pull-request-policy.md](pull-request-policy.md) | What every PR must have, who reviews what, merge and prohibited actions. |
| [ai-assisted-development.md](ai-assisted-development.md) | Accountability for AI output, what is allowed, and why prompts are not enforcement. |
| [repository-access.md](repository-access.md) | Least privilege, roles, requesting and revoking access, authentication. |
| [contractor-byod.md](contractor-byod.md) | Contractor and personally-owned-device rules. |

## Supporting documents

The policies link into these, so they are part of the same set.

| Document | Covers |
| --- | --- |
| [../standards/engineering-workflow.md](../standards/engineering-workflow.md) | The canonical issue → branch → PR → review → merge → staging → production path. |
| [../standards/release-process.md](../standards/release-process.md) | Release rules, when business approval is required, rollback, freezes. |
| [../standards/coding-standards.md](../standards/coding-standards.md) | Code, dependencies, tests, security by default, commits, docs. |
| [../standards/agent-harness.md](../standards/agent-harness.md) | How a repository's agent instruction files must be structured. |
| [../security/secrets-handling.md](../security/secrets-handling.md) | Secret rules and the exposure procedure. |
| [../security/incident-reporting.md](../security/incident-reporting.md) | What and how to report, severity levels, security logging. |
| [../onboarding/developer-onboarding.md](../onboarding/developer-onboarding.md) | First-week path for a new developer. |
| [../onboarding/developer-offboarding.md](../onboarding/developer-offboarding.md) | Access revocation on departure or role change. |
| [../templates/adr.md](../templates/adr.md) | ADR template. |
| [../templates/runbook.md](../templates/runbook.md) | Runbook template. |
| [../templates/postmortem.md](../templates/postmortem.md) | Postmortem template. |
| [../architecture/README.md](../architecture/README.md) | Where architecture decision records are recorded. |

## Overlays in this repository

These project documents also apply and are not replaced by the vendored set:
[CLAUDE.md](../CLAUDE.md), [CONTRIBUTING.md](../CONTRIBUTING.md),
[docs/LIFECYCLE.md](../docs/LIFECYCLE.md),
[docs/RELEASE_METADATA.md](../docs/RELEASE_METADATA.md), [SECURITY.md](../SECURITY.md) and
[.claude/agents/](../.claude/agents/).

## Differences to reconcile

Vendoring the company policy alongside documents written for this project's template
surfaced genuine disagreements. They are decisions, not duplicates — reconcile each one
explicitly rather than leaving two rules standing:

| Area | Vendored policy | This project currently says |
| --- | --- | --- |
| Commit message | `<type>(<scope>): <imperative summary>` ([coding standards](../standards/coding-standards.md#commits)) | Imperative subject, no type prefix ([CONTRIBUTING.md](../CONTRIBUTING.md)) |
| Branch types | includes `test` ([engineering workflow](../standards/engineering-workflow.md#stages)) | `feat`, `fix`, `chore`, `docs`, `refactor` ([CLAUDE.md](../CLAUDE.md)) |
| Merge | Squash merge ([pull request policy](pull-request-policy.md#merging)) | Squash unless a curated commit series ([CONTRIBUTING.md](../CONTRIBUTING.md)) |
| Release record | Semver tag + release notes ([release process](../standards/release-process.md#versioning)) | Append-only `releases/` records keyed by `commit_sha` ([docs/RELEASE_METADATA.md](../docs/RELEASE_METADATA.md)) |
| ADR location | `architecture/decisions/` ([architecture/README.md](../architecture/README.md)) | `docs/decisions/`, because `architecture/` is vendored and must not be edited here ([docs/decisions/](../docs/decisions/)) |

## Known caveats

- [ai-assisted-development.md](ai-assisted-development.md) links to
  `../CONTRIBUTING.md#what-does-not-belong-here`. That heading exists in the governance
  repository but not in this project's `CONTRIBUTING.md`; the link resolves, the anchor
  does not.
- [templates/runbook.md](../templates/runbook.md) and
  [templates/postmortem.md](../templates/postmortem.md) carry a `<GOV>` placeholder for the
  governance repository's URL. Since the governance docs are vendored here, the relative
  paths those comments describe now resolve locally.
- Agent definitions were **not** copied from the source repository. This project's
  [.claude/agents/](../.claude/agents/) is tailored to it and takes precedence.
- `scripts/validate-docs.sh` was **not** copied: it asserts that the repository contains no
  dependency manifest and no application source, which is true of the governance repository
  and false of this one.
