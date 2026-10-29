# Pilot editorial review record

Status: drafts awaiting owner and counsel review. This file records review tasks;
it does not approve any article. Complete the full checklist in
`docs/BLOG_COMPLIANCE.md` for every exact revision after import and again after
any edit.

## Shared editorial checks

- [ ] Confirm the author name, titles, excerpts, slugs and categories.
- [ ] Verify all operational and product-process statements with the responsible
      business owner.
- [ ] Confirm that no price, lead time or changing product specification needs to
      be added, removed or qualified.
- [ ] Confirm that the copy addresses licensed businesses and contains no
      consumer-sales direction, health or efficacy claim, or jurisdiction-specific
      legality claim.
- [ ] Confirm that all text renders correctly as plain text and contains no HTML,
      Markdown or emoji.
- [ ] If media is added, verify ownership or licensing, image content, accurate
      alt text and captions, and repeat the complete review.
- [ ] Inspect the exact imported revision IDs and confirm that they match the
      reviewed content before using `--checklist` with the approval command.

## Article reviews

### Write a wholesale order brief your team can use

Manifest: `write-a-wholesale-order-brief.json`

- [ ] Confirm the suggested brief fields match the wholesale intake process.
- [ ] Confirm the signup and salesperson follow-up description remains accurate.
- [ ] Complete every item in the shared checks and repository compliance checklist.
- [ ] Owner approves the exact imported revision through the publishing API.

### How to compare all-in-one vape hardware

Manifest: `compare-all-in-one-vape-hardware.json`

- [ ] Have the product or production owner verify the evaluation criteria.
- [ ] Confirm that no statement implies universal oil or hardware compatibility.
- [ ] Complete every item in the shared checks and repository compliance checklist.
- [ ] Owner approves the exact imported revision through the publishing API.

### A receiving checklist for wholesale shipments

Manifest: `wholesale-shipment-receiving-checklist.json`

- [ ] Have operations verify the receiving, escalation and partial-receipt workflow.
- [ ] Add any business-specific controls outside this generic checklist where
      needed, then review the resulting revision again.
- [ ] Complete every item in the shared checks and repository compliance checklist.
- [ ] Owner approves the exact imported revision through the publishing API.

## Homepage and staging acceptance

- [ ] Confirm that all three slugs resolve to their approved revisions.
- [ ] Confirm the lead, rail, featured, shelf and Compliance & Retail placements
      represented in `homepage.json`.
- [ ] Confirm automatic Latest lists and category navigation show eligible stories.
- [ ] Check desktop and mobile layouts, metadata, breadcrumbs and 404 behavior.
- [ ] Record owner acceptance separately through the project's normal release and
      business-approval gates.
