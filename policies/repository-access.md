# Repository Access Policy

## Principles

- **Least privilege.** The minimum access needed to do the assigned work.
- **Per-assignment, not per-person.** Developers receive access only to the repositories
  required for their current work. New assignment, new access request.
- **Individual identities only.** No shared accounts, no shared tokens, no shared SSH keys.
- **Time-bound where possible.** Contractor and elevated access carries an expiry.

## Roles

| Role | Typical access |
|---|---|
| Contributor | Read + branch push on assigned repositories. No protected-branch write. |
| Maintainer | Contributor + manage issues, PRs and releases on owned repositories. |
| Technical admin | Repository settings, branch protection, secrets, org-level configuration. |

Technical admin is granted to the smallest viable group and reviewed quarterly.

## Requesting access

1. Open an [access request issue](../.github/ISSUE_TEMPLATE/access_request.md) naming the
   repository, the role, the work it's for, and an end date if the work is time-bound.
2. A technical admin approves and grants it. Approval and grant are recorded on the issue.
3. Access outside this process is not valid access.

## Authentication

- MFA is required on every GitHub account with access to company repositories.
- Personal access tokens: fine-grained, minimum scope, expiry set, never shared, never committed.
- SSH keys are per-device and per-person.
- Machine access uses a dedicated machine identity, never a human account.

## Review and revocation

- Access is reviewed quarterly; anything unused or no longer justified is removed.
- Access is revoked on assignment completion, role change, or departure —
  see [offboarding](../onboarding/developer-offboarding.md).

## Prohibited

- Sharing credentials or session tokens with anyone, including teammates.
- Cloning or copying repositories you have not been granted access to.
- Attempting to access repositories, infrastructure, secrets, internal agents or company
  systems you have not been granted. This includes probing for weak configuration.

Suspected or accidental over-access is a security event —
report it via [incident reporting](../security/incident-reporting.md). Reporting in good
faith is never penalized.
