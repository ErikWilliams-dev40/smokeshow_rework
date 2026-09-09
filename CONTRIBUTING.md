# Contributing

How work moves through this repository. The full gate-by-gate description is in
[`docs/LIFECYCLE.md`](docs/LIFECYCLE.md); this is the practical version.

---

## 1. Start from an issue

Open an issue using one of the forms under `.github/ISSUE_TEMPLATE/`. Every
branch traces back to an issue number.

## 2. Branch

Branch from the default branch:

```
<type>/<issue-number>-<short-slug>
```

`type` is one of `feat`, `fix`, `chore`, `docs`, `refactor`. Example:
`fix/207-stale-session-cookie`.

Direct commits to the default branch are not permitted.

## 3. Commit

- Present tense, imperative subject: `Add token refresh on 401`.
- Subject under ~72 characters, no trailing period.
- Body explains *why*, not *what* — the diff already says what.
- Reference the issue: `Refs #207`, or `Closes #207` if it fully resolves it.
- Keep commits reviewable. Unrelated cleanups go in their own commit.

## 4. Open a pull request

Fill in `.github/PULL_REQUEST_TEMPLATE.md` honestly. In particular:

- **Database migration** — say whether this changes schema.
- **Rollback safety** — say whether the previous version can be redeployed over
  this one without data loss.
- **New secrets or permissions** — call them out; do not add them silently.

Mark the PR as a draft until you want review.

## 5. Automated checks

`lint`, `test`, `build`, and `security-check` run on every PR. All four must
pass. Do not merge with a failing check and a note saying it is unrelated —
either fix it or fix the check.

## 6. AI and security review

An AI review pass runs against the diff using
`.claude/agents/security-reviewer.md`. It is an additional signal, not a
substitute for a human reviewer, and it does not have approval authority.

## 7. Peer approval

At least one human owner must approve. Authors cannot approve their own PR.

Code-owner enforcement is not yet switched on — `CODEOWNERS.example` becomes
`.github/CODEOWNERS` once teams and repository access are assigned. Until then,
getting the right reviewer is a human responsibility, not something GitHub will
enforce for you.

## 8. Merge

Squash merge into the default branch unless the PR is a curated commit series
worth preserving. Delete the branch after merge.

---

## Deployment

Contributors do not deploy. Deploys are triggered by a maintainer through the
`Deploy` workflow (`workflow_dispatch`) and follow:

```
staging-deploy → staging-health-check → [business approval] → production-deploy → production-health-check
```

The business-approval gate is a required reviewer on the `production` GitHub
Environment. It refers to a specific `commit_sha` recorded in the release
metadata, and that SHA never changes — see
[`docs/RELEASE_METADATA.md`](docs/RELEASE_METADATA.md).

If a production deploy goes wrong and the release is marked `rollback_safe`,
a maintainer runs the `rollback` workflow with the previous good SHA.

---

## Working on the workflows themselves

Changes to `.github/workflows/` ship in their own pull request, never bundled
with a feature change. If a change widens a `permissions:` block, say so in the
PR title.

## Local setup

**Prerequisites:** Node 24 (the version in `.nvmrc`) and pnpm. pnpm is pinned by
the `packageManager` field, so you do not need to choose a version:

```sh
corepack enable pnpm     # or: npm install -g pnpm
```

If `corepack enable` fails with a permission error, it is trying to write a shim
into the Node installation directory. Either run `npm install -g pnpm` instead,
or prefix commands with `corepack ` — `corepack pnpm install`. CI takes the
latter route for the same reason.

**Install and run:**

```sh
pnpm install            # --frozen-lockfile in CI
pnpm dev                # http://localhost:3000
```

**Before opening a pull request**, run what CI runs:

```sh
pnpm lint               # tsc --noEmit, ESLint, Stylelint, Prettier --check
pnpm test               # Vitest
pnpm build              # next build
pnpm audit --audit-level=high
```

`pnpm format` writes Prettier's changes rather than only checking them. Note that
Prettier is scoped away from Markdown and `.github/`: prose here is hard-wrapped
by hand, and a formatter that rewrites workflow YAML on every run would breach
the rule against editing `.github/workflows/` as a side effect.

**Verifying a screen against the design.** The specification is
`design_handoff_wholesale_b2b/README.md`, and `screenshots/` holds one capture
per screen. Two things to know before you compare:

- Every capture is the light **Editorial** theme, while the shipping default is
  dark **Brand**. Force the Editorial root class when comparing.
- The animated screens are frozen at an arbitrary frame. Read the motion spec
  rather than the still, and open the `.dc.html` in a browser to see the live
  effect and both themes.

The handoff screenshots are a human review reference, not a pixel baseline — a
different renderer produces different output, so treating them as CI baselines
would produce a permanently red check that everyone learns to ignore.
