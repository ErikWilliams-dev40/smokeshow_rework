# Release Process

Releases are the tail of the [engineering workflow](engineering-workflow.md):
merge → staging → business approval when required → production → health check.

## Rules

- Production is deployed by the pipeline. No manual production changes when a pipeline exists.
- Everything reaching production came through a pull request.
- Anything deployed to production was verified in staging first.
- Every release is traceable to its issues and PRs.

## Versioning

Semantic versioning: `MAJOR.MINOR.PATCH`. Tag the release commit `v<version>`.
Release notes list user-visible changes and link the issues.

## Steps

1. Verify the change in staging against its acceptance criteria.
2. Draft release notes from the merged PRs. Note every migration and config change.
3. Obtain business approval if required (below) and record it on the release.
4. Run the pipeline. One release at a time — no parallel deploys.
5. Health check within 15 minutes: error rates, latency, a key user flow, and the specific
   behaviour you changed. Record the result on the release.
6. Close the issues and note anything deferred.

## Business approval is required when

- Customer-visible behaviour, UI or messaging changes.
- Pricing, billing or contractual terms are affected.
- Data handling, retention or sharing changes.
- A migration is irreversible or involves downtime.
- The change is on a scheduled or contractually committed date.

Approval is recorded in writing on the release or its issue. Verbal approval doesn't count.

## Who approves

**Business Approver** is the durable role. It approves the customer-visible or business
outcome of a change. It is not technical approval and never substitutes for peer or
technical-admin review
([pull request policy](../policies/pull-request-policy.md#additional-review-requirements)).

Who currently holds the role is managed outside this repository, in the company's
**Release Approvers** identity group. Ask a technical admin who is in it today —
this repository names roles, never individuals.

## Rollback

Decide within 15 minutes of a failed health check: roll back or fix forward.
Default to rollback. Rolling back is a normal outcome, not a failure.

Irreversible migrations need a documented recovery plan **before** deploy —
if you can't roll back, say so in the release notes and get explicit approval.

If the failure has security impact, follow
[incident reporting](../security/incident-reporting.md).

## Environments without a pipeline

Where no controlled deployment pipeline exists yet, a manual production change is permitted
only when all of the following hold. Building the pipeline is the fix; this is the interim.

- The change came through a merged pull request. There is no exception to this.
- A technical admin approved the manual deploy in writing, before it happened.
- A second person observed it, or it was recorded (command log or session transcript).
- The change, who deployed it, and the health-check result are recorded on the release.

Bypassing an existing pipeline is never covered by this section.

## Freezes

A technical admin may freeze production. During a freeze only
[SEV1/SEV2](../security/incident-reporting.md#severity) fixes deploy, with technical-admin
approval, following [the emergency path](engineering-workflow.md#exceptions).
