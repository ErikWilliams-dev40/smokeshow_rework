# Secrets Handling

A secret is anything that grants access: passwords, API keys, tokens, private keys,
connection strings, webhook URLs, signing keys.

## Rules

1. **No production secrets in source control.** Ever. Not in code, config, tests, fixtures,
   comments, commit messages, issues or PR descriptions.
2. **Secrets live in the approved secret store** for their environment — GitHub Actions
   secrets for CI, and the runtime secret manager named in the project's README.
   If a project hasn't named one, ask a technical admin before inventing a place to put it.
3. **Per-environment secrets.** Development, staging and production never share a secret.
4. **Per-identity secrets.** No shared keys between developers or services.
5. **Least privilege.** Scope each credential to what it actually needs.
6. **Local development uses local, non-production values** in an untracked `.env`.
   Commit a `.env.example` with keys and empty values only.
7. **Rotate on suspicion, not on proof.** Rotation is cheap; a leak isn't.

## In this and every repository

These hold on every repository, with or without tooling:

- `.gitignore` excludes `.env`, `*.pem`, `*.key` and credential files.
- CI never prints secrets. Mask them and avoid `set -x` around them.
- Read your own diff before you push. This is the control we always have.

## Scanning tools

Secret scanning and push protection come from GitHub Secret Protection, a paid product that
is not licensed on every repository. Where it **is** licensed, technical admins enable it at
repository creation and confirm it during the
[quarterly access review](../policies/repository-access.md#review-and-revocation);
turning it off requires technical-admin approval recorded on an issue.

Where it is not available, the rules above are the whole control. A missing scanner is never
a reason to commit a secret, and a passing scanner is not evidence that you didn't.

## If a secret is exposed

Treat it as leaked the moment it lands anywhere it shouldn't — a public repo, a chat message,
a log, a screenshot, an AI prompt.

1. **Rotate the credential immediately.** This is step one, always.
2. **Revoke the old value** at the provider.
3. **Report it** — [incident reporting](incident-reporting.md).
4. **Check for use** in access logs during the exposure window.
5. **Remove it from history** only after rotation, and only with technical-admin help.
   Deleting a commit does not un-leak a secret.

## Prohibited

- Emailing, messaging or pasting secrets to anyone, including teammates.
  Share access, not credentials.
- Storing secrets in personal password managers, notes apps or dotfiles.
- Pasting secrets into AI tools ([AI-assisted development](../policies/ai-assisted-development.md)).
- Using production credentials on a local machine.
