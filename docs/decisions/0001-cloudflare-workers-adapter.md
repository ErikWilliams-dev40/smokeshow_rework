# ADR-0001: Host on Cloudflare Workers with vinext, D1 and Email Service

- **Status:** accepted
- **Date:** 2026-10-14
- **Deciders:** project lead (Erik Williams); platform direction set by the client's launch memo

## Context

The 2026-10-14 brief replaced the priced configurator with a one-page lead-capture
site whose only server work is an age-gate cookie, a signup form that must save a
record, email sales and acknowledge the buyer, and a password-protected CSV export.
Server rendering, server actions and route handlers are required, so a static host
is out. The client's stated goal is to reduce reliance on Shopify, and the launch
memo (approved 2026-10-14) chose Cloudflare: Workers for the app, D1 for records,
Email Service for mail. The page itself makes no external requests.

Two ways exist to run Next.js 16 on Workers. `@opennextjs/cloudflare` wraps the
output of `next build`; its Next 16.3 support was unconfirmed at decision time
(open issues on `proxy.js` and `setImmediate`). `vinext` reimplements the Next.js
API surface on Vite and is what Cloudflare now documents as the default path; it
is in beta, and it ships with Cloudflare's new `cf` CLI and a typed
`cloudflare.config.ts` instead of `wrangler.jsonc`.

## Decision

We run the app on Cloudflare Workers through vinext (`vinext`, `@vinext/cloudflare`,
`@cloudflare/vite-plugin`), configured by `cloudflare.config.ts` and operated with
the `cf` CLI. Records live in D1 (one database per environment, migrations in
`migrations/`), transactional mail goes through the `send_email` binding, and form
abuse is throttled with a rate-limit binding. Environments are Vite modes:
`cloudflare.config.ts` exports a factory on `ctx.mode`, and the deploy workflow
builds with `--mode staging` or `--mode production` and deploys the prebuilt output
tagged with the commit SHA.

All binding access goes through `src/server/cloudflare/env.ts`, so the adapter is a
one-file dependency. Worker secrets are set with `cf workers secrets update`; the
tracked `.dev.vars.example` lists their names with empty values.

The decision was de-risked on a throwaway branch (Helix issue #9): age gate with
JavaScript off, cookie read in a server component, a server action writing to local
D1, `server-only` enforced at build, global CSS order preserved, `/api/health`
uncached, lint and tests green.

## Alternatives considered

| Option | Why not |
|---|---|
| `@opennextjs/cloudflare` | Stable, but Next 16.3 support unconfirmed and Cloudflare's own docs now steer new apps to vinext. Named fallback: swap `env.ts` to `getCloudflareContext()` and the build scripts to `opennextjs-cloudflare`. |
| Keep Shopify, add a form app | Contradicts the client's goal of reducing Shopify reliance; a second platform for one form. |
| Vercel or another Node host | Needs a separate database and mail vendor and a second account to govern; the memo chose a single Cloudflare account owned by the client. |
| Third-party form service | Adds an external request from the page and moves lead data to a vendor the client does not control. |

## Consequences

Easier: one account, one CLI, local simulation of D1, email and rate limits in
`vite preview`; the deploy is a prebuilt upload with rollback to a prior version.

Harder: vinext, `cf` and `@cloudflare/config` are beta; `next dev` is no longer
proof that the Workers build works, so `pnpm preview` is part of every runtime
change. `compatibilityDate` can never exceed what the installed workerd supports.
Local D1 state lives in `.cloudflare/state`, and migrations are applied there by id.
Each environment is a separate build (`--mode`), so the health check's `commit`
field is what proves the tested SHA is the one serving. Email Service is beta and
arbitrary recipients need the Workers Paid plan.

Reversal cost: moderate. The app code is plain Next.js; the adapter is isolated to
`env.ts`, the Vite config and the scripts. Moving off Cloudflare entirely means a new
database and mail provider and a data export from D1.

## Revisit when

vinext leaves beta or regresses on a Next minor we need; OpenNext confirms Next 16.3
support and vinext blocks something we need; Email Service deliverability fails the
staging review; or the client changes platform direction.
