# AI-Assisted Development Policy

AI tooling is encouraged. Accountability does not transfer to the tool.

## The rule that matters

**You own everything you submit.** If you can't explain it, review it, or defend it in a PR,
don't ship it. "The AI wrote it" is not a defense and not an explanation.

## Allowed

- AI assistants for writing, refactoring, explaining and testing code.
- AI review agents on pull requests — see [.claude/agents/](../.claude/agents/).
- Agent-generated issues, docs and test scaffolding, reviewed by a human before merge.

## Not allowed without technical-admin approval

- Sending company source, customer data, secrets, or production data to any AI service that
  technical admins haven't approved. If you're unsure whether a tool is approved, ask before
  you paste — the list is maintained by technical admins, not in this repository.
- Connecting third-party AI tools, agents or integrations to company repositories or
  infrastructure. Company-authored agents committed to a repository — such as the ones in
  [.claude/agents/](../.claude/agents/) — are already approved.
- Installing MCP servers, plugins or external skills into company repositories.
  In governance repositories these are never permitted
  ([CONTRIBUTING.md](../CONTRIBUTING.md#what-does-not-belong-here)).

## Never allowed

- Autonomous agents that push to protected branches, merge PRs, or deploy to production.
  A human is in the loop at every gate the [engineering
  workflow](../standards/engineering-workflow.md) defines.

## Prompts are not enforcement

Instructions inside an agent definition, a `CLAUDE.md` or a skill — "never deploy",
"never exploit", "never touch production" — are **behavioural instructions**. They steer what
an agent attempts. They do not mechanically prevent anything, and an agent that ignores one
has broken no technical control. The same goes for local Claude Code state such as
`.claude/settings.local.json`: it is per-machine, gitignored, and not a committed control.

Deterministic enforcement lives in GitHub permissions, repository rules and branch
protection, CI/CD, deployment controls, and later in managed Claude controls configured in
the company-controlled Claude environment. When you need a guarantee, put it there.
Company-wide Claude deny rules are not configured yet — they land once they've been tested
in that environment.

So: give an agent only the access its work needs
([repository access](repository-access.md)), and never let a prompt be the only thing
standing between an agent and something it must not do. Agent definitions link here rather
than claim enforcement they don't have.

## AI review supplements human review

Where automated review is configured on a repository, it never counts as the required
human approval. Treat findings as input: triage them, act on the real ones, and say why you
dismissed the rest. Security-sensitive areas still require technical-admin review
([pull request policy](pull-request-policy.md#additional-review-requirements)).

This is the canonical statement of the rule. Other documents link here rather than restate it.

## Disclosure

Note substantial AI involvement in the PR description — enough that a reviewer knows
where to look harder. We're not counting AI usage; we're calibrating review depth.

## Data handling

- Never paste secrets, credentials, tokens or customer PII into an AI tool.
- Prefer minimal context: the file you're working on, not the whole repository.
- Assume anything you send to an external service has left our control.
  If it shouldn't leave, don't send it.

## Quality expectations

AI-assisted code meets the same bar as everything else —
[coding standards](../standards/coding-standards.md) apply unchanged. The one failure mode
worth naming: verify that every API and dependency an AI suggests actually exists and is
already one we use.
