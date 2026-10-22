# Wholesale launch release and rollback runbook

Status: implementation prepared; production is not provisioned or deployed.
Use [CONFIGURATION.md](CONFIGURATION.md) for the outstanding values. No secrets
belong in the repository, chat or release record.

## Prepare resources

Use the installed `cf` CLI. Run `corepack pnpm exec cf cli search "<operation>"`
and inspect the matching schema/help before account-specific operations. The
project has no Wrangler configuration. Confirm the selected account and active
zone before provisioning; do not replace existing DNS or mail records blindly.

Provision separate staging and production D1 databases, record their IDs in the
corresponding GitHub Environment variables, and configure the Worker secrets
`BLOG_API_TOKEN` and `LEAD_TOKEN_SECRET`. Generate the latter securely with at
least 32 random characters; do not reuse the local simulation key. Provision
Email Sending and its verified sender domain before enabling live leads.
Cloudflare Email Sending uses the Worker binding, not a separate email API key.

The deployment token belongs only in its GitHub Environment. It needs access to
the intended Worker, D1 migration operations and Worker route changes in the
intended zone. Do not create a repository-wide fallback token. Configure required
production reviewers; the workflow cannot establish those rules itself.

## Migrations and staging

`0001_leads.sql` creates leads, verification state and delivery jobs additively.
It uses `IF NOT EXISTS`; it does not delete or overwrite existing records. The
local integration tests apply it on empty storage and reapply it with stored leads.

The deploy workflows run the matching command after building and before deploying:

```sh
corepack pnpm db:migrate:staging
corepack pnpm db:migrate:prod
```

These commands require the corresponding D1 ID and scoped Cloudflare credentials.
The workflows use `cf deploy --prebuilt --provision=false`: deployment never
creates missing resources implicitly. Configuration validation rejects placeholders
and mismatched production origins before any migration. Worker secrets must be
provisioned separately and verified in staging; a build does not prove they exist.

Trigger Actions → Deploy with the full merged SHA, the same approved SHA from the
release record, and production unchecked. Staging is always `noindex`; it never
publishes fixtures. Test the live blog, all article images, and the entire signup
flow using allowlisted customer and sales recipients. Confirm that opening the
verification URL alone does not confirm, and that sales receives nothing until
confirmation. Verify retries after a controlled delivery failure.

## Release approval and production

Complete the established automated, security, peer and business gates. The
implementation author's self-review does not replace independent review. Write an
append-only release record for the exact merged SHA with `database_migration: true`
and `rollback_safe: true` for this additive schema; record the previous known-good
SHA and the actual human approvals. Do not invent approval or deployment evidence.

Production is a separate Environment approval after staging health succeeds.
Both the preflight and production job compare the approved and requested SHAs.
The deploy job also requires that SHA to be an ancestor of `main`. Health checks
require HTTP 200, the exact requested commit, `status: ok`, and `checks.d1: ok`.
Builds are environment-specific, using the same reviewed source and frozen lockfile;
the production artifact is not byte-identical to the staging artifact.

After deployment, check:

- HTTP→HTTPS and any `www`→apex redirects without loops.
- Public overview, policies, blog and approved articles are indexable; `/`,
  `/wholesale`, verification and internal search remain `noindex` as designed.
- Canonicals use `https://smokeshowlabs.com`; pagination/category canonicals retain
  meaningful filters; no staging/fixture/draft URLs appear in the sitemap.
- `/robots.txt` allows public HTML and article images; `/sitemap.xml` is complete.
- A controlled customer verifies, and receives the acknowledgment; sales receives
  exactly one logical notification job. See LEADS.md for transport retry limits.
- Health reports the release SHA and D1 readiness. Check redacted Worker logs for
  retry failures without exporting contact details.

Register the property with Search Console and Bing Webmaster Tools, using their
provided ownership verification records. Submit the sitemap and monitor coverage,
search errors and confirmed lead delivery. These account actions remain pending.

## Application rollback

Choose the last observed healthy, merged release SHA, and confirm compatibility
with the current schema and current configuration. Dispatch Rollback with that SHA,
`rollback-safe=true`, the intended environment, and a reason. Production rollback
uses the same Environment approval and shares the deployment concurrency lock.

The workflow rebuilds that exact SHA with its pinned dependencies and current
Environment configuration, redeploys with `cf`, then checks the restored SHA and
D1 readiness. It never runs reverse migrations, drops tables, or deletes leads.
The target must contain the Cloudflare deployment/check scripts; older template
commits are not valid automated rollback targets. Record a known-good release
before relying on this workflow. Rebuild availability depends on its pinned
packages remaining available; preserve release artifacts according to the project
release policy.

If schema compatibility is uncertain, a migration was destructive, or the previous
release has incompatible bindings, stop automated rollback and plan recovery with
the owner. Do not mark it rollback-safe merely to pass the guard. Pending outbox
records survive application rollback; resume with compatible code. A signing-key
rotation invalidates pending verification links, so plan resends if rotation is
necessary. Never reverse schema to make an old application pass a health check.
