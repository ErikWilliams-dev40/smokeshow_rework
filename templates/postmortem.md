# Postmortem: <short incident name>

<!-- Copy into the project repository that owns the incident. Replace <GOV> below with this
     governance repository's URL — relative paths from here will not resolve there. -->

Blameless. We describe what made the failure possible, not who typed it.

- **Date:** YYYY-MM-DD
- **Severity:** SEV1 | SEV2 | SEV3
- **Duration:** detection → resolution
- **Owner:**
- **Author:**

## Summary

Three sentences: what broke, who it affected, how it ended.

## Impact

Users, data, revenue, duration. Numbers where you have them; "unknown" where you don't.

## Timeline

| Time (UTC) | Event |
|---|---|
|  | Change deployed |
|  | First symptom |
|  | Detected |
|  | Mitigated |
|  | Resolved |

## Root cause

The chain of conditions, not a single culprit. Include the control that should have caught
it and didn't.

## What worked

## What didn't

Detection gaps, missing runbook, unclear ownership, noisy alerts, missing test.

## Action items

| Action | Owner | Issue | Due |
|---|---|---|---|
|  |  | # |  |

Each action must be an issue in GitHub. "Be more careful" is not an action item.

## Follow-up

- [ ] Credentials rotated, if applicable (`<GOV>/security/secrets-handling.md`)
- [ ] Detection or alerting added
- [ ] Test added that would have caught this
- [ ] Runbook or docs updated
