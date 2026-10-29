# Smoke Signals pilot article package

Three original, business-to-business drafts for the initial Smoke Signals launch.
The package contains no publication timestamps, review records or approval claims.
Every article requires owner and counsel review before import approval.

## Contents

| Manifest | Category | Editorial purpose |
| --- | --- | --- |
| `write-a-wholesale-order-brief.json` | Wholesale | Help buyers prepare a focused first conversation. |
| `compare-all-in-one-vape-hardware.json` | Vapes | Provide a repeatable hardware evaluation framework. |
| `wholesale-shipment-receiving-checklist.json` | Retail tips | Support consistent receiving and discrepancy records. |

`homepage.json` places all three stories across the compatible homepage slots. The
vapes article is eligible for On the shelf; the receiving article is eligible for
Compliance & Retail. Latest lists remain automatic.

The manifests intentionally omit covers and inline images. They are complete and
valid without media. If licensed images are added later, follow the image format,
alt-text and rights requirements in `docs/BLOG_PUBLISHING.md` and
`docs/BLOG_COMPLIANCE.md`, then review the changed revisions again.

## Offline validation

Use Node 22 and run these commands from the repository root. Neither validation
command contacts an API or requires credentials.

```sh
corepack pnpm build:blog-tools
corepack pnpm blog validate \
  articles/pilot/write-a-wholesale-order-brief.json \
  articles/pilot/compare-all-in-one-vape-hardware.json \
  articles/pilot/wholesale-shipment-receiving-checklist.json
corepack pnpm blog curate articles/pilot/homepage.json --dry-run
```

Validation checks the production manifest and curation schemas. It is not a
substitute for editorial, factual, legal or image review.

## Import and approve

1. Complete `articles/pilot/REVIEW.md` and the repository-wide compliance review.
2. Follow `docs/BLOG_PUBLISHING.md` to configure an individual administrator
   credential. Never use the website's read-only token.
3. Run the validation commands above, then import the three article manifests in
   one command by replacing `validate` with `import`. Do not pass `--update` for
   their initial import.
4. Inspect each slug and its exact draft revision. Record the returned version and
   revision ID in the owner-controlled review record.
5. Have the owner inspect the exact content, complete the checklist and approve
   each revision using the publishing CLI. Validation or importing never grants
   approval.
6. Run `corepack pnpm blog inspect-homepage`, set `HOMEPAGE_VERSION` to the
   returned current version, then apply the curated selection:

   ```sh
   corepack pnpm blog curate articles/pilot/homepage.json --version "$HOMEPAGE_VERSION"
   ```

7. Verify the three article pages, category sections, homepage slots and media
   behavior in staging before website rollout. Allow for the documented five-
   minute article cache after later changes.

If an article already exists, inspect it and follow the explicit one-at-a-time
update process in `docs/BLOG_PUBLISHING.md`; do not rerun the initial import
command as an update. Curation affects approved stories only, so approve all three
before evaluating the final homepage arrangement.
