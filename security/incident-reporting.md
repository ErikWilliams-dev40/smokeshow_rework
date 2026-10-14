# Incident Reporting

## Report first, diagnose second

If you think something might be a security incident, report it. You are not expected to
be sure. Over-reporting costs a few minutes; under-reporting costs a lot more.

Good-faith reporting is never penalized — including when you caused the problem.

## What to report

- Leaked or exposed credentials, keys or tokens.
- Access to something you shouldn't have been able to reach.
- Suspected account compromise, phishing, or malware on a device used for work.
- Unexpected production changes, or changes made outside the pipeline.
- Customer data exposed, sent to the wrong place, or handled outside policy.
- Suspicious activity from an integration, bot or AI agent.
- Lost or stolen device with company code or access on it.

## How to report

1. **Immediately** notify a technical admin through the internal security channel.
   For an active or suspected-active incident, do that before anything else.
2. Do not post details in a public issue or PR. See [SECURITY.md](../SECURITY.md).
3. Preserve evidence: don't delete logs, branches, messages or history.
4. If credentials are involved, rotate them —
   [secrets handling](secrets-handling.md#if-a-secret-is-exposed).

Include what happened, when you noticed, what's affected, and what you've already done.

## Severity

| Level | Meaning | Response |
|---|---|---|
| **SEV1** | Active compromise, customer data exposure, production down | Immediate, all hands |
| **SEV2** | Credential leak, unauthorized access, no confirmed data loss | Same business day |
| **SEV3** | Policy violation or weak configuration, no active exposure | Within 3 business days |

A technical admin sets severity. When in doubt, report it high and let it be downgraded.

## Handling

A technical admin owns each incident and is responsible for containment, rotation,
assessment of impact, and closure. Fixes follow the normal
[engineering workflow](../standards/engineering-workflow.md) unless the emergency path applies.

## Security logging

We log what the platforms actually emit — no more than that:

- Authentication and MFA events.
- Access grants, revocations and permission changes.
- Branch-protection and repository-configuration changes.
- Secret creation, rotation and configuration changes, where the platform records them.
- Deployments, production changes and CI/CD runs.
- Detected secret exposure and security-tool alerts.
- Application and control-plane security events.

**Individual reads of a secret are not logged.** A workflow retrieving a GitHub Actions
secret leaves no per-read trail. Treat any secret a workflow could reach as used, and rely on
rotation and provider-side access logs
([secrets handling](secrets-handling.md#if-a-secret-is-exposed)) instead of a read history
that does not exist.

Logs are append-only and not editable by the people they record.
Do not disable logging without technical-admin approval.

## After the fact

SEV1 and SEV2 incidents get a written postmortem within five business days using
[templates/postmortem.md](../templates/postmortem.md). Postmortems are blameless and
focus on what made the failure possible.
