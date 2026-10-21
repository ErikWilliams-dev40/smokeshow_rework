# Blog compliance checklist (DRAFT — owner and counsel review required)

**Sign-off:** the site owner. This is the same review that product copy gets. Run through the checklist for every article, and again for every edit, before setting `review.status` to `approved` in the blog API.

This checklist is drafted from the site's existing compliance copy (`src/content/compliance.ts`) and the hemp notice. It isn't legal advice. Have counsel confirm it before the first article goes live.

## Audience and age
- [ ] The article speaks to licensed businesses and adults 21+. It doesn't appeal to minors: no cartoon or youth-oriented imagery, no school or holiday-candy framing.
- [ ] Nothing in it suggests the site sells to consumers or to unlicensed buyers.

## Health and efficacy claims
- [ ] It makes no claim that a product diagnoses, treats, cures or prevents any disease. This matches the hemp notice.
- [ ] It makes no dosage, medical, or "safe"/"healthy" claims.

## Legal status
- [ ] Any mention of legality is consistent with the notice: federal hemp definition (2018 Farm Bill), and products subject to federal, state and local law, with availability varying by jurisdiction.
- [ ] It doesn't promise shipping to, or legality in, any specific jurisdiction.

## Copy hygiene
- [ ] It doesn't reword or paraphrase the site's frozen compliance strings. If you quote them, quote them verbatim.
- [ ] Prices, lead times and specs match the current quote data. If they might drift, leave them out.
- [ ] Plain text only: no emoji, no HTML.
- [ ] Every image has accurate alt text.

## Images
- [ ] Every image is owned or licensed.
- [ ] No people who appear under 25.
- [ ] No consumption by anyone who appears to be a minor.

## Record
- [ ] `approvedBy` and `approvedAt` are set. An edit after approval needs a fresh approval.


## Publishing and withdrawal

Approval takes place in the separate API, never in this website. Local fixture
review records are test data, not approval to publish those examples.
The site checks article approval before rendering or caching. Approval withdrawal and
edits can take up to five minutes to become visible because article data is
cached for 300 seconds. Immutable image IDs remain publicly cacheable: replace
an ID whenever its bytes change. Do not put private material in blog media.

Before enabling the real API, its owner must verify that the site's credential
can retrieve only approved public media; draft-only, rejected and private assets
must return 404 (#74). The media proxy's type checks do not establish publication
approval. Previously published images may remain in browser caches for up to a
year, even after they are removed upstream.
