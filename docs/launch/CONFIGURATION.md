# Launch configuration checklist

The implementation uses placeholders at the owner's request. No production
resources, DNS records, secrets, outbound emails or deployment were created.
The connected Cloudflare accounts did not return a zone for smokeshowlabs.com.

## Required non-secret information

| Value | Where configured | Needed for |
| --- | --- | --- |
| Production Cloudflare account ID | GitHub `production` Environment variable `CLOUDFLARE_ACCOUNT_ID` | Resource ownership and deployment |
| Production zone ID for smokeshowlabs.com | `PRODUCTION_ZONE_ID` Environment variable | Worker route and DNS verification |
| Production D1 database ID | `DB_ID_PRODUCTION` Environment variable | Persistent production leads |
| Staging Cloudflare account ID | GitHub `staging` Environment variable `CLOUDFLARE_ACCOUNT_ID` | Explicit account selection for deployment |
| Staging D1 database ID | `DB_ID_STAGING` Environment variable | Binding and migration command; existing staging ID can be reused |
| Production origin | `SITE_URL` is already https://smokeshowlabs.com | Canonicals and verification links; confirm ownership/DNS |
| Deployed base URL for each environment | `DEPLOY_URL` Environment variable | Release health checks |
| Verified sender address | `MAIL_FROM` Environment variable | Transactional email sender |
| Sales inbox | `SALES_INBOX` Environment variable | Verified lead notifications |
| Controlled staging recipients | Comma-separated `LEAD_TEST_RECIPIENTS` Environment variable | Recipient allowlist, including the staging sales inbox |
| Live approved-content API URL | `BLOG_API_URL` Environment variable, separately per environment | Blog articles, images and production sitemap |
| Lead activation | `LEADS_ENABLED=true` only after setup | Enables deployed submission and scheduled mail delivery |
| Human reviewers | GitHub team/user names | CODEOWNERS and required production Environment approval |

## Required credentials

| Secret | Location | Requirement |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | GitHub staging/production Environment secrets, separately scoped | Worker deployment and D1 migrations; never a repository-wide fallback |
| `LEAD_TOKEN_SECRET` | Worker secret, separately per environment | Cryptographically random value, at least 32 characters; signs 24-hour verification links |
| `BLOG_API_TOKEN` | Worker secret, separately per environment | Private blog API access; no browser exposure |

Do not paste secret values into chat, source, issues, PRs or logs. There is no
separate email API key when using the native Cloudflare email binding. Local
verification uses a local-only signing key and simulated delivery.

## Account and DNS prerequisites

- Workers Paid and Email Sending enabled for the sender domain.
- Sender-domain authentication records verified; configure the provider-supplied
  DKIM/SPF records and an appropriate DMARC policy without guessing record values.
- The production zone must be active in the chosen account with proxied DNS for
  the apex hostname. Review existing DNS before adding or replacing records.
- Confirm canonical apex handling and arrange a redirect from `www` if that host
  is used. Preserve unrelated DNS and mail records.
- Confirm that the blog API enforces the documented approval/media contract.
- Obtain Search Console and Bing Webmaster ownership/access. Their verification
  values are account-specific and must come from those services.

## Release sequence

1. Provision the production D1 database in the chosen account and record its ID.
2. Configure Environment variables, scoped deployment credentials and Worker
   secrets. Keep `LEADS_ENABLED=false` until the mail settings are verified.
3. Apply the additive migration; deploy staging through the established workflow.
4. Verify signup with allowlisted test addresses, confirmation, sales notification,
   acknowledgment and retry behavior. Verify blog access with the live API.
5. Complete peer, security and business approval for the exact merged SHA. Create
   its append-only release record from observed CI/review evidence.
6. Deploy production through the guarded workflow. Check the reported SHA, D1,
   canonical URLs, robots headers, sitemap, redirects and a controlled signup.
7. Submit `https://smokeshowlabs.com/sitemap.xml` to Search Console and Bing.
   Monitor index coverage, search performance and confirmed lead counts.

Application rollback retains the D1 schema and lead records. See LEADS.md for
outbox recovery. A live release and ownership verification remain incomplete until
these prerequisites and actual delivery checks are satisfied.

Email setup follows the [Cloudflare Email Sending Workers API](https://developers.cloudflare.com/email-service/api/send-emails/workers-api/) and [send-binding restrictions](https://developers.cloudflare.com/email-service/configuration/send-bindings/).
