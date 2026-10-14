# Agent Harness Standard

Every repository that permits AI-assisted work must expose one neutral repository contract
through thin tool-specific entry points. The contract is the harness: it supplies durable
project context and boundaries without making one agent product the source of truth.

## Required structure

1. **One neutral contract.** Keep shared rules in a plainly named repository document that
   any supported agent can read.
2. **Thin entry points.** Each tool-specific instruction file links to the neutral contract
   and contains only routing that applies to that tool.
3. **One canonical home.** Entry points and agent definitions link to policy; they do not
   copy it. When the same rule appears twice, remove the duplicate.
4. **Repository-local context.** The contract travels with the code and is reviewed through
   the same pull-request controls.

Names may vary where a tool requires a fixed filename. File naming never changes which
document owns the shared rules.

## Contract contents

Each repository contract must identify:

- the project purpose and prohibited scope;
- local documentation that must be read before work starts;
- build, lint, test, and validation commands that actually exist;
- repository, environment, and production boundaries;
- actions requiring human or technical-admin approval;
- project-specific routing for specialist agents or review responsibilities; and
- which controls are behavioral instructions and which are mechanically enforced.

Do not claim a command, environment, integration, or enforcement mechanism that the
repository does not have.

## Tool-specific entry points

An entry point must be short enough to inspect at a glance. It may:

- require loading the neutral contract;
- route to tool-specific agents, skills, or local documentation; and
- add constraints imposed by that tool or execution environment.

It must not restate common rules, loosen the contract, or claim authority to approve, merge,
deploy, or change protected state.

## Enforcement boundary

Prompts, contracts, agent definitions, and local tool settings guide agent behavior; they are
not access controls. The canonical distinction is in
[AI-assisted development](../policies/ai-assisted-development.md#prompts-are-not-enforcement).
Use permissions, protected branches, required reviews, CI checks, and deployment controls
for guarantees.

## Adoption checklist

- [ ] Select or create the neutral contract.
- [ ] Link every supported tool entry point to it.
- [ ] Remove duplicated common rules from tool-specific files.
- [ ] Record real commands, boundaries, approval gates, and routing.
- [ ] Label behavioral and mechanical controls accurately.
- [ ] Validate links and exercise the repository's documented checks.
- [ ] Obtain the reviews required for policy or agent-instruction changes.
