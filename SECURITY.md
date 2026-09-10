# Security Policy

## Reporting a vulnerability

Do **not** open a public issue for a security vulnerability. This repository is
public, so an issue discloses the problem to everyone before there is a fix.

Use GitHub's private vulnerability reporting:
**[Security → Advisories → Report a vulnerability](https://github.com/ErikWilliams-dev40/smokeshow_rework/security/advisories/new)**.
It is enabled on this repository, the report stays private to the maintainers
until an advisory is published, and it needs no mailbox to be monitored.

Include, as far as you can:

- what the issue is and the impact you believe it has,
- the affected version or commit SHA,
- steps to reproduce,
- any logs or proof of concept.

### What to expect

This project is maintained by a small team, so these targets are deliberately
modest rather than aspirational — an unmet promise here is worse than a longer
one that holds.

| Stage | Target |
| --- | --- |
| Acknowledgement | within 5 business days |
| Initial assessment | within 10 business days |
| Fix or mitigation plan | communicated after assessment |

We will keep you informed while the issue is open and credit you in the advisory
unless you ask us not to.

## Supported versions

This project is pre-release and not yet deployed. There are no released versions,
so there is no support matrix to honour: only the current `main` is in scope, and
fixes land there rather than being backported.

| Version | Supported |
| --- | --- |
| `main` | Yes |
| Any tag or release | None exist yet |

## Scope

**In scope:** this repository, at the current `main`.

**Out of scope, because it does not exist yet:** any deployed host or domain.
Nothing is deployed. `staging` and `production` GitHub Environments are
configured, but the deploy workflows are unconfigured placeholders that exit
non-zero, so there is no running instance to test against. There is also no
database, no session authentication, and no real licence verification — see
"Known limitations" below, and please do not report their absence as a
vulnerability.

**Out of scope:** third-party services, and the placeholder product photography
whose source URLs are recorded in
[`design_handoff_wholesale_b2b/site-images.json`](design_handoff_wholesale_b2b/site-images.json).

Do not test against production. Do not run denial-of-service tests, and do not
access data belonging to anyone other than yourself.

---

## Sensitive data this application handles

Stated here, ahead of the code that will handle it, so a reviewer knows what is
worth protecting before there is anything to review. Smoke Show Labs sells to
licensed cannabis operators, which means the sign-up path collects regulatory
identity documents rather than just an email address.

**The resale-certificate upload is the highest-severity surface in the project.**
Step 2 of wholesale registration accepts an uploaded document that carries, in
one file:

- a **state cannabis licence number**,
- an **EIN** (federal taxpayer identification number),
- a **registered business address**, and
- the operator's legal business name and signature.

That combination identifies a regulated business and its filing identity. Treat
it as the most sensitive thing this system holds.

Rules the implementation must follow, and which a reviewer should check:

- Allowlist accepted types by **magic bytes**, never by file extension or by the
  client-supplied `Content-Type`.
- Enforce a hard size cap.
- Store outside the webroot, under an **opaque random key with no
  user-controlled path segment**.
- Serve only through a handler that checks ownership, with
  `Content-Disposition: attachment` and `X-Content-Type-Options: nosniff`.
- **Do not run an image-processing library over the untrusted bytes.** Thumbnail
  generation is deferred deliberately; decoding attacker-supplied images in-process
  is an RCE-shaped dependency for a cosmetic feature.
- Never echo the uploaded filename back unsanitised.
- Log access to these documents.

Also PII, at lower severity: lead-capture contact details, and the licence
number, EIN, address and credit terms attached to a wholesale account.

### Retention

- **Resale certificates are retained only as long as the account they verify is
  active**, and are deleted within **90 days** of an account being closed or a
  registration being abandoned or rejected.
- **Abandoned registrations** — an uploaded document whose registration is never
  completed is deleted after **30 days**.
- **Lead-capture details** are retained for **24 months** from last contact.
- **Access logs** for certificate reads are retained for **12 months**.
- In the current build these documents are written to a gitignored `.uploads/`
  directory by a fixture implementation. That store is **local, unencrypted, and
  not a production control.** No production retention job exists yet; it lands
  with the real storage backend.

A request to delete personal data should be sent through the same reporting
channel above.

---

## Known limitations of the current build

Stated so nobody mistakes a documented gap for a finding, and so nobody mistakes
this build for one that is safe to put in front of real operators:

- **There is no authentication.** No sessions, no passwords, no accounts.
- **The licence gate is not access control.** `/gate` is a consent interstitial
  backed by a cookie any visitor can set. Nothing behind it is protected by it,
  and it must never be treated as authorization.
- **There is no database.** Screens render from typed fixtures, and the account
  dashboard shows synthetic records, not anyone's real orders.
- **Nothing is deployed.** See Scope.

Reports that authentication is missing are not vulnerabilities. Reports that
something *depends* on the gate cookie for authorization are, and are welcome.

---

## Practices this repository enforces

Summarized here for reporters. The rules and the reasoning behind them live in
one place each, so they cannot drift out of sync:

- **Pipeline hardening** — least-privilege workflow permissions, no third-party
  GitHub Actions, `persist-credentials: false` on checkout, no `secrets: inherit`,
  and environment-scoped deploy credentials.
  → [`docs/WORKFLOWS.md`](docs/WORKFLOWS.md)
- **Repository settings** — branch protection, required status checks, required
  code-owner review, and the `staging` / `production` Environments that carry the
  approval gate.
  → [`docs/LIFECYCLE.md`](docs/LIFECYCLE.md#configuration-checklist)
- **Review gates** every change passes before production.
  → [`docs/LIFECYCLE.md`](docs/LIFECYCLE.md)
- **Third-party action recommendations**, documented rather than installed.
  → [`docs/RECOMMENDED_ACTIONS.md`](docs/RECOMMENDED_ACTIONS.md)

Two rules worth stating outright, because a reporter may be checking for them:
no secret is ever committed to this repository, and widening a workflow's token
scope is treated as a security change requiring its own reviewed pull request.
