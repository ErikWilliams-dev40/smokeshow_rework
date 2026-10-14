# Developer Onboarding

Target: productive first pull request within your first three days.

## Day 1 — Access and setup

Owner: hiring manager + technical admin.

- [ ] Individual GitHub account added to the org. **MFA enabled.** No shared identities.
- [ ] Added to the repositories required for your first assignment — and only those
      ([repository access](../policies/repository-access.md)).
- [ ] Access to the internal communication and security channels.
- [ ] Device meets the baseline in [contractor/BYOD rules](../policies/contractor-byod.md)
      (disk encryption, screen lock, patched OS) — applies to company hardware too.
- [ ] Secret store access for your assigned repositories, if needed.
- [ ] Onboarding buddy named on the onboarding issue.
- [ ] Access grants recorded on your onboarding issue.

## Day 1 — Read this (about 20 minutes)

Owner: the new developer.

- [ ] [README](../README.md) — the non-negotiables.
- [ ] [Engineering workflow](../standards/engineering-workflow.md) — how work flows.
- [ ] [Pull request policy](../policies/pull-request-policy.md).
- [ ] [Secrets handling](../security/secrets-handling.md).
- [ ] [Incident reporting](../security/incident-reporting.md) — know how to raise a flag.
- [ ] [AI-assisted development](../policies/ai-assisted-development.md).
- [ ] [Coding standards](../standards/coding-standards.md).

## Day 2 — Local environment

Owner: the new developer, with the onboarding buddy unblocking.

- [ ] Clone your assigned repository; follow its README to build and run it.
- [ ] Run the test suite locally and get it green.
- [ ] Configure your IDE with the repository's formatter and linter. Your IDE, our formatter.
- [ ] Local `.env` from `.env.example`. Non-production values only.
- [ ] Confirm you can reach staging.

## Day 3 — First contribution

Owner: the new developer + onboarding buddy.

- [ ] Pick up a starter issue with your onboarding buddy.
- [ ] Branch, develop, open a PR, get it through review and merge.
- [ ] Watch it reach staging.

## Week 1 — Context

Owner: hiring manager.

- [ ] Walkthrough of the system you'll work on ([architecture/](../architecture/)).
- [ ] Meet the people you'll depend on; know who your technical admin is.
- [ ] Know what "done" means here: deliverables, quality, communication, business value.
      We don't track keystrokes or screenshots.

## Onboarding complete when

First PR merged, environment working, access correct and recorded, and the reading list done.
Close the onboarding issue.
