# Coding Standards

Language-agnostic. Developers choose their language and IDE unless project requirements
dictate otherwise — these expectations apply either way.

## Code

- Match the conventions of the code around you before introducing your own.
- Every repository has a formatter and linter configured, run in CI. The tool decides style;
  don't argue about it in review.
- Prefer clarity over cleverness. Prefer deleting over adding.
- Name things for what they are. Comment *why*, not *what*.
- No dead code, commented-out blocks or unused abstractions "for later".

## Dependencies

- Add a dependency only when it's meaningfully better than writing it yourself.
- Pin versions. Note new dependencies in the PR description with a one-line justification.
- Never add a dependency an AI tool suggested without verifying it exists and is maintained
  ([AI-assisted development](../policies/ai-assisted-development.md)).

## Tests

- New or changed behaviour ships with tests.
- Tests must be deterministic. A flaky test is a broken test — fix or delete it.
- Test behaviour, not implementation details.
- No production credentials or real customer data in tests or fixtures.

## Security by default

- Validate input at trust boundaries. Encode output for its destination.
- Parameterized queries only. No string-built SQL.
- Never log secrets, tokens or PII.
- Fail closed: on error, deny.
- Configuration and secrets come from the environment, never hardcoded
  ([secrets handling](../security/secrets-handling.md)).

## Commits

- Small, focused, and buildable at each commit where practical.
- Message format: `<type>(<scope>): <imperative summary>` — e.g. `fix(auth): refresh token before expiry`.
- Reference the issue: `Refs #412`.
- Never commit generated artifacts, local config or anything from `.gitignore`.

## Documentation

- A repository's README explains how to run it, test it and deploy it. Keep it current.
- Non-obvious architectural decisions get an ADR — [templates/adr.md](../templates/adr.md).
- Operational procedures get a runbook — [templates/runbook.md](../templates/runbook.md).
