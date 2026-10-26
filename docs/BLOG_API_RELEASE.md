# Blog API release runbook

Merge the backend, publishing integration, and deployment workflow PRs in that
order. Retarget dependent PRs to main after their prerequisites merge and obtain
the normal automated and human reviews. All workflows run with `contents: read`;
no repository or organization-wide deployment credential is needed.

## Provisioning and environments

Before first deployment, an administrator provisions separate D1 databases and
private R2 buckets for staging and production using the cf CLI. Do not reuse lead
databases or enable R2 public access. Discover the installed commands with
`cf cli search "create a D1 database"` and `cf cli search "create a private R2 bucket"`,
inspect their schema, then preview resource creation without secrets before applying.
Select the intended account explicitly. No resource provisioning occurs during deploy.

On each GitHub Environment (`staging`, `production`), configure:

| Kind | Name | Purpose |
| --- | --- | --- |
| Variable | `CLOUDFLARE_ACCOUNT_ID` | Intended account |
| Variable | `BLOG_DB_ID` | That environment's dedicated blog D1 UUID |
| Variable | `BLOG_BUCKET_NAME` | Private media bucket |
| Variable | `BLOG_DEPLOY_URL` | HTTPS API origin, no path/query |
| Secret | `CLOUDFLARE_API_TOKEN` | Account-scoped Worker deploy, D1 migration and R2 binding access |
| Secret | `BLOG_API_TOKEN` | Random website read token; match the website's Worker secret |
| Secret | `BLOG_ADMIN_CREDENTIALS` | JSON digest registry with distinct named editor and owner credentials |

Keep deployment secrets only on their Environments. Required reviewers and main-only
deployment restrictions must be enabled on `production`; verify those settings before
first dispatch. The workflow files cannot establish that account setting by themselves.
The existing production environment also protects website releases.

## Reviewed release

After the target code merges, add the append-only `releases/<commit_sha>.json`
record through its own review, following `docs/RELEASE_METADATA.md`. The record
must identify this repository and target commit, successful tests/security review,
an independent human reviewer, required business approval, and rollback safety.
The initial API schema release has `database_migration: true`. Never claim pending
reviews or a local-only test run is a completed production approval.

Dispatch **Deploy blog API** from main with matching `commit-sha` and `approved-sha`.
Leave `deploy-production` false for staging-only verification. The workflow reads
the release record from main, checks the target is on main, and builds the exact
target commit. It validates resource configuration, applies additive blog migrations,
deploys with `cf --provision=false`, and probes `/health` with the read credential.
Readiness requires the exact SHA and healthy D1 and R2; redirects and cached health
responses are rejected. Deploys are serialized and never cancelled in progress.

First-stage editorial acceptance uses only explicitly approved staging content.
Verify import, draft invisibility, owner approval, website homepage/search/detail,
image access, replacement drafts, withdrawal and persistence. Previously generated
fixture approvals are not editorial sign-off. Configure the website's `BLOG_API_URL`
to that API's origin and its matching read secret; the deployment configuration
binds `BLOG_API` to `smokeshow-blog-api-staging` or `smokeshow-blog-api`.

Production is attempted only when explicitly selected, staging health has passed,
and the production Environment reviewer approves. Deploy the API before the matching
website release. Neither this runbook nor an open PR triggers a deployment.

## Credentials, rollback and recovery

The workflow writes only the two Worker secrets to a mode-0600 temporary file for
`cf deploy --secrets-file`; it removes the file on exit. Builds and installs do not
receive those secrets. Do not enable shell tracing or print that file. Updating
the GitHub Environment secrets takes effect on the next API deployment. Coordinate
read-token rotation with the website; revoke editor/owner tokens by removing their
registry entries and redeploying the approved API code.

Use the same guarded pipeline with an earlier reviewed, merged SHA for application
rollback, provided that SHA supports this independent API and the current additive
schema. Never target a commit from before the service existed. Keep D1/R2 data;
do not reverse migrations or delete buckets as part of rollback. A content rollback
instead approves an earlier revision through the owner CLI with the current version.

Before migration, take restricted D1 and R2 exports and verify restore into isolated
resources as documented in `services/blog-api/README.md`. Investigate failed migration
or readiness checks before retrying; do not bypass them with a manual production
deploy. Article cache expiry and already-cached images still apply to withdrawal.
