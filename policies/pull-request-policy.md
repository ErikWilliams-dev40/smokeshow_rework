# Pull Request Policy

Every change that reaches production came through a pull request — including emergency
fixes and manual deploys in environments that have no pipeline yet
([release process](../standards/release-process.md#environments-without-a-pipeline)).

## Every PR must

- Link to its issue.
- Describe what changed and why, in plain language.
- Be scoped to one logical change. Split unrelated work.
- Include tests for new or changed behaviour.
- Pass CI.
- Have at least one approving review from a human other than the author.
- Have no unresolved review threads at merge time.

## Additional review requirements

| Change touches | Also requires |
|---|---|
| Authentication, authorization, sessions | Technical-admin review |
| Secrets, key management, credentials | Technical-admin review |
| Payment, billing, PII or regulated data | Technical-admin review + business approval |
| Infrastructure, CI/CD, deployment config | Technical-admin review |
| Public API contracts | Technical-admin review |

Business approval is a decision by a
[Business Approver](../standards/release-process.md#who-approves) on the business outcome,
separate from every technical review in the table.

## Size

Aim for under ~400 changed lines. Large PRs get shallow reviews.
If a change is genuinely large, say so in the description and suggest a review order.

## Reviewer expectations

Review for correctness, security, readability and test coverage.
Approve, request changes, or say you're not the right reviewer — do not sit on it.
Target first response within one business day.

## AI review

Findings are input, not a verdict — a human still approves. See
[AI-assisted development](ai-assisted-development.md#ai-review-supplements-human-review).

## Merging

- Squash merge. A feature or fix branch merges into the default branch — we do not use
  release branches ([engineering workflow](../standards/engineering-workflow.md)).
- The author merges. Reviewers approve, they don't merge for you.
- Never merge with red CI or a bypassed branch protection.
- Delete the branch after merge.

## Prohibited

- Pushing directly to the default branch or any protected branch.
- Approving your own PR, or trading rubber-stamp approvals.
- Disabling, weakening or working around branch protection and required checks.
