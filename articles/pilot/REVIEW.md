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

### How to read a hemp product lab report

Manifest: `how-to-read-a-hemp-lab-report.json`. Converted from the owner's draft,
last fact-checked 2026-10-29. First approved on staging on 2026-10-29 as revision
`fd41aa5d-a075-4388-b8bb-73db634e2020`, at the operator's instruction and before
these items were resolved. #139 revised the article to resolve them. Any edit
needs a fresh approval.

- [x] Audience: reframed for licensed businesses and trade buyers (#139). The
      shopper wording, "before you buy" and "from us or anyone else" are gone,
      and the opening note names the audience.
- [ ] Legal status: #139 checked every federal-law statement against the enacted
      laws (P.L. 119-37, P.L. 119-103), CRS IF13136 and LSB11496, and current
      bill status, as of 2026-10-28. Corrections: November 12 products lose hemp
      status (not "classified as marijuana"); the container definition is the
      statute's, not CRS's; the December 11 cap covers total THC and similar
      cannabinoids. Counsel still confirms accuracy and agrees a re-review date,
      at the latest December 11, 2026.
- [x] Company claim: removed at the owner's decision (#139).
- [ ] Disclaimer: the closing disclaimer is the author's own, not the frozen
      hemp notice in `src/content/compliance.ts`. #139 widened it from "your
      state" to every jurisdiction where the reader operates. Confirm that is
      intended.
- [ ] Sources: #139 replaced the mislinked and weak citations. ANAB now links
      to its directory, the USDA formula to 7 CFR 990.1, and the hardware claim
      to McDaniel et al. (2021). ACS Laboratory replaces the Yahoo Finance and
      THD Wholesale sources, and the JAMA Network Open study replaces the Hopkins
      press release. Wording now matches the evidence: the FDA figures, the
      97-product third-party testing study, and no "imported" hardware. ANAB,
      congress.gov and the USDA AMS page refuse automated requests, so open
      those links once in a browser.
- [ ] Confirm that URLs shown as plain text, without links, are acceptable.
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
