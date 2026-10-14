# Contractor and BYOD Development Rules

Applies to contractors, and to anyone developing on a personally owned device.

## Your device

You may use your own hardware, OS, IDE and language toolchain. In exchange, the device must:

- Have full-disk encryption enabled.
- Have a screen lock with a password, timeout under 15 minutes.
- Be running a supported, patched OS and browser.
- Have the local account password-protected and not shared with anyone.
- Not be a shared or family device for company work.

We do not install monitoring, screenshot or activity-tracking software on your machine.
We evaluate deliverables, quality, communication and business value.

Because nothing is installed to check it, this baseline is self-attested: you confirm it at
onboarding and at each [quarterly access review](repository-access.md#review-and-revocation),
and you tell us if it stops being true. Attestation is the control — treat it that way.

## Company data on your device

- Keep company code inside a dedicated directory or user account.
- No company code, credentials, exports or customer data on removable media,
  personal cloud storage, or personal email.
- No production data pulled to a local machine. Use synthetic or anonymized data.
- Secrets stay in the approved secret store, never in dotfiles or plaintext notes.
  See [secrets handling](../security/secrets-handling.md).

## Accounts and access

- Use your own individual GitHub account with MFA. Never a shared identity.
- Access is per-assignment and time-bound — see [repository access](repository-access.md).
- Do not add company repositories to third-party services, bots or integrations
  without technical-admin approval — AI tools included
  ([AI-assisted development](ai-assisted-development.md#not-allowed-without-technical-admin-approval)).

## Working agreement

- Follow the [engineering workflow](../standards/engineering-workflow.md) like everyone else.
- Work in GitHub: issues, branches, PRs. Status lives on the issue, not in chat.
- Communicate blockers early. Silence is the only real problem.
- Deliverables and any work product created for the company belong to the company.

## Ending an engagement

At the end of an engagement, delete local copies of company code and data, confirm deletion
in writing, and return any company-issued hardware or licenses.
See [offboarding](../onboarding/developer-offboarding.md).

## Prohibited

- Bypassing access controls, or accessing anything you weren't granted.
- Subcontracting work or sharing access with anyone not approved by the company.
- Running company code on infrastructure you control without approval.
