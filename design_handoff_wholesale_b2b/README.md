# Handoff: Smoke Show Labs — B2B Wholesale Storefront

## Overview
Thirteen screens for **Smoke Show Labs**, a white-label vape brand developer selling to licensed
cannabis operators. The flow is trade-only but **not price-gated**: a licence gate guards entry,
a two-step registration captures the lead before it asks for paperwork, and tiered per-unit
pricing is visible without an account. Three product detail pages (hardware, terpenes,
packaging) feed a quote builder; returning accounts land on a reorder dashboard.

| id | Screen | Step | Width | Screenshot |
| --- | --- | --- | --- | --- |
| 2a | Home — editorial landing, countdown band over the smoke hero | 1 | 1080 | `2a-home.png` |
| 1d | Licence gate — full-window doorway | 2 | 1080 | `1d-licence-gate.png` |
| 1i | Wholesale registration — split, two steps | 3 | 1080 | `1i-registration.png`, `1i-registration-step2.png` |
| 1b | Hardware catalogue — filterable, tiered pricing | 4 | 1080 | `1b-catalogue.png` |
| 1g | Hardware product detail — All-in-One 2g | 5 | 1080 | `1g-hardware-detail.png` |
| 1e | Terpene product detail — Blue Dream | 6 | 1080 | `1e-terpene-detail.png` |
| 1h | Packaging detail — CR Box 04 | 7 | 1080 | `1h-packaging-detail.png` |
| 1c | Quote builder — live estimate | 8 | 1080 | `1c-quote-builder.png` |
| 1f | Reorder dashboard — returning account | return visit | 1080 | `1f-reorder-dashboard.png` |
| 1j | About — credentials, co-packing pitch, operator reviews | company | 1080 | `1j-about.png` |
| 1k | How it works — six-step brand build | company | 1080 | `1k-how-it-works.png` |
| 1l | Additional services — gummies, bulk sales | company | 1080 | `1l-additional-services.png` |
| 1m | Shows — trade calendar | company | 1080 | `1m-shows.png` |

The four company screens (1j–1m) are content pages reached from the footer's Company column,
not steps in the purchase flow. Their copy is drawn from the client's live site (about-us, how it
works, additional services, shows) and condensed; the substance is theirs, the typesetting ours.

## About the Design Files
The files in this bundle are **design references authored in HTML** — prototypes that demonstrate
the intended look, motion, and behaviour. They are **not production code to copy**. The single
`.dc.html` file uses a bespoke in-house template runtime (`<x-dc>`, `{{ holes }}`, `<sc-for>`,
a `DCLogic` class) that will not exist in your codebase and should not be ported.

**The task is to recreate these designs in the target codebase's existing environment** — React,
Vue, Svelte, SwiftUI, native, whatever is already established — using its own component library,
routing, styling solution, and state management. If no environment exists yet, pick the most
appropriate framework for the product (a marketing site + authenticated quote tool suggests
Next.js or Remix with server rendering) and implement there.

What *should* be lifted verbatim: the design tokens, the exact copy, the pricing logic, and the
animation parameters. Everything else is structure to re-express.

## Fidelity
**High-fidelity (hifi).** Colours, typography, spacing, radii, motion timings and copy are final.
Recreate at the stated widths, then apply the responsive guidance below. Two complete themes ship
side by side and both are intended to be real (see *Theming*).

Not final: **product photography**. The three detail pages currently pull images from
`smokeshowlabs.com/cdn/...`; the catalogue and home media wells are placeholders. Real hardware
and packaging photography is outstanding and is the one thing to expect to slot in later.

---

## Theming

One markup tree, two token sets. The client's live Shopify theme is the dark one; the light one
is an editorial alternative that was explored and kept. Implement as a theme attribute/class on
the root, not as two codebases. The prototype's default is **Brand**.

**Theme A — "Editorial"** (light, the `:root` values)
Bodoni Moda display serif, square corners (`0px` everywhere), hairline borders, no shadows.

**Theme B — "Brand"** (dark, matches smokeshowlabs.com — the shipping default)
Applied via a `.brand` class on the root. Overrides: charcoal grounds, **Jost reassigned to
`--serif`** (the brand has no serif; the display face is heavier sans at weight 650), pill
buttons (`150px`), 12px card radius, filled form fields, and a card shadow
`0 20px 70px rgba(0,0,0,.28)`.

> Note for design-system purists: Theme B deliberately breaks the house rules of zero radius and
> no shadows. That is the brand, not an oversight.

### Token table

| Token | Editorial (light) | Brand (dark) | Used for |
| --- | --- | --- | --- |
| `--paper` | `#ffffff` | `#292929` | Card ground |
| `--paper-raised` | `#ffffff` | `#343434` | Cards on cards |
| `--paper-tint` | `#e3f0f7` | `#393939` | Filter bars, aside panels, media wells |
| `--paper-well` | `#eeeeee` | `#252131` | Selected option, thumbnails |
| `--slab` | `#111111` | `#000000` | Inverted bands (header, footer, order bar) |
| `--ink` | `#2b2b2b` | `#ffffff` | Body text |
| `--faded` | `#565656` | `#bdbdbd` | Secondary text, labels |
| `--violet` (accent) | `#006ebc` | `#78d6f1` | Eyebrows, numerals, active state |
| `--violet-light` | `#78d6f1` | `#78d6f1` | Accent + status dots on dark bands |
| `--uv` / `--uv-light` | `#5f4b8b` / `#b9a8e0` | `#8f7ec4` / `#b9a8e0` | Ambient haze behind cards |
| `--ember` | `#f48120` | `#f7b829` | Primary CTA fill |
| `--stock` | `#2e3191` | `#78d6f1` | Verified / pass indicator **on light grounds only** |
| `--promo` | `#f00036` | `#f00036` | Promo chip (use `#c8002c` on `--slab` for 6.6:1) |
| `--blush` | `#ec8ebe` | `#ec8ebe` | Hero rule accent, halo |
| `--azure` | `#3086c8` | `#3086c8` | Figure captions, secondary bars |
| `--coal` | `#231f20` | `#231f20` | Deep ground |
| `--inv-fg` | `#ffffff` | `#ffffff` | Text on `--slab` |
| `--line` | `rgba(95,75,139,.16)` | `#474252` | Hairline dividers |
| `--line-strong` | `rgba(95,75,139,.24)` | `#645d74` | Field underlines, section rules |
| `--line-card` | `rgba(95,75,139,.18)` | `#524c60` | Card borders |
| `--line-slab` | `rgba(255,255,255,.16)` | `rgba(255,255,255,.2)` | Dividers on dark bands |
| `--line-slab-quiet` | `rgba(255,255,255,.1)` | `rgba(255,255,255,.12)` | Secondary dividers on dark |
| `--on-slab` | `rgba(255,255,255,.72)` | `#c8c8c8` | Body text on dark |
| `--on-slab-quiet` | `rgba(255,255,255,.62)` | `#b5b5b5` | Tertiary text on dark |
| `--r-card` | `0px` | `12px` | Card radius |
| `--r-btn` | `0px` | `150px` | Button radius (pill) |
| `--r-badge` | `0px` | `150px` | Badge radius (pill) |
| `--r-input` | `0px` | `6px` | Field radius |
| `--sh-input` | `none` | `none` | Field depth |
| `--fld-bg` | `transparent` | `#242424` | Field fill |
| `--fld-pad` | `0px` | `14px` | Field left padding |

**`--stock` warning:** at `#2e3191` it is a navy that reads at ~1.5:1 on `--slab` and is
effectively invisible. Use it only on light grounds (account header, order status, artwork
pre-flight passes). Status dots inside the dark order bars use `--violet-light`.

### Spacing scale
`--band: 96px` (Editorial) / `80px` (Brand) — vertical section rhythm ·
`--gutter: 72px` / `56px` · `--gap-col: 56px` / `44px` (major column gap) ·
`--gap-card: 24px` / `16px` (card grid gap) · `--pad-card: 34px` / `26px` (card interior).
Screen padding on the 1080 pages is `48px` horizontal, `44–52px` vertical per section.
Ad-hoc values in components: 10, 12, 13, 14, 16, 18, 20, 22, 26, 28, 34, 38, 44.

### Typography

Faces: **Bodoni Moda** (400 normal + 400 italic, display only) and **Jost** (variable 100–900).
Both are SIL OFL — self-host; do not add a CDN request. Expected paths:
`fonts/bodoni-moda-400.woff2`, `fonts/bodoni-moda-400-italic.woff2`, `fonts/jost-variable.woff2`
(**not bundled** — source from Google Fonts and self-host).

`--serif: "Bodoni Moda", Didot, Baskerville, "Times New Roman", serif`
`--sans: Jost, "Helvetica Neue", Arial, sans-serif`

Base `18px / 1.6`, antialiased. Headings are `font-weight: 400` in Editorial, forced to `650`
with `letter-spacing: -.025em` in Brand.

| Role | Spec |
| --- | --- |
| Hero h1/h2 (2a) | serif 52px / 1.02–1.04, `-.025em` |
| Detail-page h1 (1g/1e/1h) | serif 52px / 1.04, `-.022em` |
| Screen h1 (1b, 1f) | serif 52–56px / 1.04, `-.022em` |
| Screen h1 (1i, 1c) | serif 44–46px / 1.05–1.06, `-.02em` |
| Section h2 | serif 42px / 1.06–1.08, `-.02em` |
| Estimate figure | serif 58px / 1, `-.02em` |
| Price figure (detail) | serif 40px / 1 |
| Stat figure | serif 26–36px / 1.2 |
| Card h3 | serif 19–23px / 1.2–1.3 |
| Row title | serif 17–21px / 1.25 |
| Wordmark | serif 16–22px, `.16em`, uppercase |
| Body | sans 16.5px / 1.7 (hero), 15.3px / 1.65–1.7 (default), 14.5px (card copy) |
| Small body | 12.5px; legal 11.5px / 1.6 |
| Overline `.ov` | sans 10px / 1, weight 600, `.3em`, uppercase |
| Micro label `.sl` | sans 9px, weight 600, `.2em`, uppercase |
| Nav / button label | sans 10–11px, weight 600, `.18em`–`.28em`, uppercase |

### Global typographic detail (applies to every screen)
```css
h1, h2                 { text-wrap: balance }
p                      { text-wrap: pretty }
[serif elements]       { font-kerning: normal;
                         font-feature-settings: "kern" 1, "liga" 1;
                         font-variant-numeric: tabular-nums lining-nums }
.sl, dd, dt            { font-variant-numeric: tabular-nums lining-nums }
dl > div:last-child    { border-bottom: 0 }
a img                  { transition: scale 700ms cubic-bezier(.2,.6,.2,1) }
a:hover img            { scale: 1.025 }
::selection            { background: var(--violet); color: #fff }
input, textarea        { font-size: 16px; min-height: 44px }   /* iOS zoom guard */
button                 { min-height: 42px }
:focus-visible         { outline: 2px solid var(--violet); outline-offset: 4px }
```
Tabular figures are load-bearing — prices, spec tables and the countdown all rely on them to
align in columns.

---

## Screens

### 2a — Home (1080 px)

**Purpose:** convert a licensed operator into a quote request. Sells the programme and the process.

1. **Header** — black (`#000`), `22px 36px`, flex space-between, `gap: 24px`, bottom border
   `rgba(255,255,255,.14)`. Left: the neon wordmark (see *Assets*). Centre: 4-item nav
   (Hardware, Terpenes, Filling, Packaging) at 11px, `.1em`, weight 700, `gap: 24px`. Right:
   "Register" text link + "Request a quote" `--ember` button (`13px 20px`, `--r-btn`).
   *Constraint:* at 1080 these three tracked groups only just fit — keep the nav at 4 items and
   11px, or the row breaks. Everything in the header is `white-space: nowrap`.
   **Nav hover:** 1px `currentColor` underline 7px below baseline, `scaleX(0) → 1`,
   origin right → left, `400ms ease`; colour to `--violet` over 400ms.
2. **Countdown band** — split left/right over the hero: deadline copy and a live
   `DD d HH h MM m SS s` clock in tabular figures, "Held through the January run", and a
   full-width `--ember` CTA. Ticks once per second from a single interval.
3. **Hero — animated smoke stage.** Full-bleed, `isolation: isolate`, ground `#0d070d` under a
   `radial-gradient(140% 88% at 28% 6%, #31112b 0%, #180a18 46%, #0a050a 100%)`. Grid
   `minmax(0,1.06fr) minmax(0,.94fr)`, `--gap-col`. Left: `.ov` eyebrow in `#78d6f1`, h1
   "Thinking of starting your own brand?", a 200px four-segment rule (2px, flex 4/2/2/1,
   `--violet-light` / `#b9a8e0` / `--ember` / `--blush`), 16.5px body at `max-width: 520px` in
   `rgba(255,255,255,.78)`, CTA row ("Get started" `--ember`; "See how it works" text link in
   `#78d6f1`), then a 3-up `<dl>` — Min. order **1,000** · Fill to freight **2–3 wk** ·
   Slots left **6**. Right: 1:1 figure with the brand mark breathing over a blurred halo,
   no caption — the figure is the mark alone.
   Motion spec below.
4. **Catalogue teaser / how it works / reasons / contact / footer** — see the screenshot; the
   patterns match the shared vocabulary described under *Shared patterns*.

### 1d — Licence gate (1080 px)

**Purpose:** the trade-only doorway; blocks consumers before anything else renders.

`--slab` card, grid `minmax(0,1fr) minmax(0,.86fr)`, `96px 48px`, white text. Left: wordmark
(serif 20px `.16em` uppercase), a 120px two-segment rule (`--violet-light` flex 2 / `--blush`
flex 1, 2px, `28px 0`), h2 "Trade access only." at 52px, body copy. Right: confirmation panel
with **Enter** (`--paper` ground, `--ink` text) and **Exit** (transparent, `--line-slab` border)
in a 2-up grid (`gap: 14px`, `17px 0`, `--r-btn`), plus a `.sl` footnote in `--on-slab-quiet`.

Behaviour: gate on first visit, persist acceptance (cookie or `localStorage`), send **Exit** to a
neutral off-site destination.

**Recommended change, not yet designed:** render the catalogue behind the gate blurred with
prices masked, so the doorway sells the reason to register rather than showing a blank wall.

### 1i — Wholesale registration, split (1080 px)

**Purpose:** capture the lead in 40 seconds, defer the paperwork. This screen exists because a
single long form (name → EIN → resale cert → address → rep picker) loses buyers before they see
a price.

Grid `minmax(0,1.25fr) minmax(0,.75fr)`; left column `48px 44px` with a right hairline, right
rail `--paper-tint`.

**Progress:** two `border-top: 2px` markers side by side — "Step 1 · Who you are / 40 seconds, no
documents" and "Step 2 · Paperwork / Before your first order ships". Active marker + label in
`--violet`; a completed step 1 turns `--stock`; an inactive step 2 is `--line-strong`.

**Step 1** — h1 "Two fields and you're in." A 2×2 field grid (Your name*, Company*, Work email*,
Phone), then interest chips (Hardware, Terpenes, Blending & filling, Packaging, White label —
multi-select, selected = `--violet` border/label on `--paper-well`), then a single-select order
band (Under 5,000 / 5,000–25,000 / 25,000–100,000 / 100,000+ — selected inverts to `--slab`
ground with `--inv-fg` text). Full-width `--ember` submit "Create my account" advances to step 2.

**Step 2** — h1 "Now the paperwork." Opens with a success card (`--stock` border, ✓ mark,
"Account created — pricing is unlocked", account summary, "Browse now" link), then State licence
number*, Company EIN*, a dashed-border resale-certificate upload slot, and a
`2fr 1fr 1fr` address row. Actions: `--slab` "Submit for approval" + a bordered "Back".

Right rail: "What you get straight away" (Tier pricing / Free samples / Batch COAs / One rep),
"Needed later, not now" (01–04 numbered list), and a phone card. Footer bar on `--slab` shows
"Step N of 2" and a "Skip for now, browse the catalogue" link.

**Deliberately omitted:** the public sales-rep dropdown from the reference site. Publishing rep
names on an open form is a lead-poaching gift to competitors — replaced by a single
"have you spoken with a rep?" question if it is needed at all.

### 1b — Hardware catalogue (1080 px)

- **Header** 76px, `0 48px`: wordmark, 4-item nav (active in `--violet`), "Quote (3)" link with
  a `--violet` bottom border.
- **Title block** `56px 48px 26px`: eyebrow "Catalogue 01", h1 "Hardware" baseline-aligned with a
  330px-max faded paragraph.
- **Filter bar** — `--paper-tint`, hairlines both edges, `20px 48px`, flex/wrap `gap: 12px`.
  Left: "Format" + 6 pills (All, All-in-one, 510 cart, Pod, Battery, Packaging). Right
  (`margin-left: auto`): "Tier" + 3 buttons (1k / 5k / 25k). Active label `--violet`, inactive
  `--faded`, 200ms colour transition, border `--line-strong`, `--r-btn`.
- **Table** — `grid-template-columns: 1.6fr 1fr 1fr .8fr .9fr`, `gap: 20px`, rows `22px 48px`.
  Head row `16px 48px` over a `--line-strong` rule, all `.sl` faded, Unit and MOQ right-aligned.
  Row: 44×56 thumbnail well, model name (serif 21px) over SKU, core/coil, a 7×7 stock dot +
  capacity, right-aligned price (serif 21px), right-aligned MOQ. Row hover → `--paper-tint`.
- **Table foot** — `--slab`, `28px 48px`: "Showing N of 18 models · tier X", an in-stock key
  (dot in `--violet-light`), a "3-week lead" key in `--ember`, and an `--ember` "Build a quote".

**Catalogue seed data (per unit at 1k / 5k / 25k):**

| Model | SKU | Core / coil | Capacity | MOQ | Format | 1k | 5k | 25k |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SSL All-in-One 2g | AIO-2000-C | Ceramic, 1.2Ω | 2.0 mL | 1,000 | All-in-one | 4.35 | 3.95 | 3.60 |
| SSL All-in-One 1g | AIO-1000-C | Ceramic, 1.2Ω | 1.0 mL | 1,000 | All-in-one | 3.80 | 3.45 | 3.10 |
| Cart 510 · Glass | C510-G-100 | Ceramic, 1.6Ω | 1.0 mL | 2,000 | 510 cart | 1.35 | 1.15 | 0.98 |
| Cart 510 · Quartz | C510-Q-100 | Quartz rod | 1.0 mL | 2,000 | 510 cart | 1.60 | 1.38 | 1.20 |
| Pod System · 2g | POD-2000-M | Mesh, 1.0Ω | 2.0 mL | 2,500 | Pod | 5.10 | 4.60 | 4.15 |
| Battery · 510 Vari | BAT-510-V3 | 350 mAh | — | 1,000 | Battery | 2.20 | 1.95 | 1.70 |
| Infused Pre-Roll Tube | PKG-TUB-01 | CR pop-top | — | 5,000 | Packaging | 0.42 | 0.36 | 0.30 |

The header claims 18 models; the prototype seeds 7. Stock state is decorative — wire to real
inventory.

### Shared product-detail template (1g, 1e, 1h)

All three detail pages are the same skeleton. Build one component, three data sets.

1. **Header** 76px — as 1b, with the current category active in `--violet`.
2. **Breadcrumb bar** — `--paper-tint`, hairlines, `16px 48px`: Catalogue / Category / Product,
   with the SKU pushed right in `--faded`.
3. **Two-column body** — `minmax(0,1fr) minmax(0,1.08fr)`, `align-items: start`, hairline between.
   - *Left (gallery):* a 1:1 hero image, a 3-up row of 1:1 thumbnails divided by hairlines, then
     a `22px 28px` note block with a `.sl` label, a right-aligned meta `.sl`, and 14.5px copy.
   - *Right (buy column), `48px 48px 44px`:* `.ov` category eyebrow in `--violet`; h1 52px;
     15.3px intro; a price row over a `--line-strong` rule (serif 40px price, `.sl` unit
     qualifier, right-aligned order value); the option controls; a spec `<dl>` (rows
     `display:flex; gap:20px; padding:13px 0`, `dt` `.sl --faded` fixed at `150px`, `dd` 15.3px,
     hairline between rows, none on the last); a CTA row (`--ember` "Add to quote" flex:1 +
     a bordered sample request); 11.5px legal note.
4. **Evidence section** — `minmax(0,1.15fr) minmax(0,1fr)`, `52px 48px`. Left: measured results
   as labelled bars (`170px minmax(0,1fr) 66px` grid, 6px track in `--paper-well` with a
   `--line` border, fill in `--violet` / `--azure` / `--violet-light` / `--ember`) or a
   composition table. Right: certification cards (`--paper-raised`, `--line-card`, `--r-card`,
   `18px 20px`, title serif 19px over a `.sl` caption, "Open" in `--violet`, hover →
   `--paper-tint`) plus a secondary `<dl>`.
5. **Options / add-on band** — `--paper-tint`, `44px 48px`, 3-up cards with a `--violet` price
   delta, serif 23px title, 14.5px copy.
6. **Pairs-with band** — `44px 48px`, 3-up linked cards, hover → `--paper-tint`.
7. **Sticky order bar** — `--slab`, `28px 48px`: live product summary
   ("{product} · {option} · {volume} units · {price} ea"), a status dot + label, and an
   `--ember` "Add to quote".

Every section is introduced by the same head: a `--line-strong` top rule, a `.sl` title, and a
`.sl --faded` qualifier pushed right.

#### 1g — All-in-One 2g (hardware)
Volume tiers and colourway both reprice live.

| Volume | Per unit | Lead time |
| --- | --- | --- |
| 1,000 | $4.35 | 3 weeks |
| 5,000 *(default)* | $3.95 | 3–4 weeks |
| 25,000 | $3.60 | 4–5 weeks |
| 100,000 | $3.28 | 6–7 weeks |

Colourways (18px swatch + label, selected = `--violet` border/label): Matte black `#1b1b1b`
*(default)*, Bone `#e9e7e3`, Ultraviolet `#5f4b8b`, Ember `#f48120`.

Spec rows: Tank 2.0 mL borosilicate · Heating 1.2Ω porous ceramic, wickless · Battery 400 mAh
Li-po USB-C 500 cycles · Airflow draw-activated 1.1 mm dual intake · MOQ 1,000 per colourway ·
Lead time (from the volume tier).

Bench bars: Tank emptied 98.2% · Charge retention 94% · Terpene retained 91% · Clog rate 0.4%
(bar 8%) · Leak at pressure 0.2% (bar 4%). Certifications: heavy metal migration, UN38.3 battery
transport, CE/RoHS. Decoration add-ons: laser etch +$0.14, UV print +$0.31, custom mouthpiece
+$0.90.

#### 1e — Blue Dream (terpenes)

| Size | Price | Pack | Lead |
| --- | --- | --- | --- |
| 10 mL sample | $1.90 /mL | 1 bottle | 3–5 days |
| 100 mL | $0.94 /mL | $94.00 | 1 week |
| 1 L *(default)* | $0.62 /mL | $620.00 | 1–2 weeks |
| 5 L drum | $0.48 /mL | $2,400.00 | 2–3 weeks |

Carries the GC/MS profile as composition bars and three certificates. Note: "The remaining 3.6%
is minor terpenes below the 1% reporting threshold. Variance held within ±2% per compound."

#### 1h — CR Box 04 (packaging)

| Run size | Per box | Lead |
| --- | --- | --- |
| 5,000 | $0.62 | 3 weeks |
| 10,000 *(default)* | $0.55 | 3–4 weeks |
| 50,000 | $0.44 | 4–5 weeks |
| 200,000 | $0.36 | 6 weeks |

Print method is a stacked radio list (9px dot, serif 19px name, `.sl` note, price delta right):
4-colour litho *(included, default)* · Litho + spot Pantone **+$0.09** · Foil + emboss **+$0.21**.
`price = runSize.per + finish.delta`.

**Artwork pre-flight** replaces the bench bars — five rows, each a `--paper-raised` card with a
22px status square (✓ in `--stock`, ! in `--ember`), label, detail and status word:

| Check | Detail | Status |
| --- | --- | --- |
| Bleed and safe area | 3 mm bleed present on all panels | Pass |
| Resolution | All raster art above 300 dpi | Pass |
| State warning panel | CA panel is 6.4 pt — 8 pt minimum | **Fix** |
| Ink coverage | Max 284% — within press limit | Pass |
| Spot colours | 3 spots supplied, 2 included in this method | **Fix** |

### 1c — Quote builder (1080 px)

- **Step bar** — `--slab`, 64px, `0 44px`: "Quote builder · Step 2 of 3" in `--violet-light`,
  "Ref. SSL-2026-0418" right.
- **Body** grid `minmax(0,1.55fr) minmax(0,1fr)`, hairline divider.
- **Left, `48px 44px`:** h1 "Configure your fill.", four option groups and a volume selector.
  Each group: top-hairline head (`--violet` numeral, `.sl` title, faded hint right), then a 3-up
  option grid (`gap: 14px`). Option button: `20px` padding, left-aligned, border `--line-card` →
  `--violet` selected, ground `--paper-raised` → `--paper-well` selected, 200ms; contents are an
  8×8 dot, a faded `.sl` tag, a serif 20px name, a 12.5px note. Volume row is four equal-flex
  buttons; selected inverts to `--slab` / `--inv-fg`.
- **Right aside, `48px 40px`, `--paper-tint`, `align-self: start`:** "Estimate" eyebrow, serif
  58px total, `.sl` "{per unit} per unit · {qty} units", a line-item `<dl>` (Hardware / Oil /
  Terpenes / Packaging / Volume discount), a "Lead time" row on a `--line-strong` rule, an
  `--ember` "Send to my rep", a bordered "Order sample kit", and 11.5px legal copy.

**Option data (per unit, before discount):**

| Group | Option | Tag | Note | Price |
| --- | --- | --- | --- | --- |
| 01 Hardware — "Filled by us" | All-in-one 2g *(default)* | AIO | Ceramic core, rechargeable | 4.35 |
| | 510 cart 1g | 510 | Glass body, ceramic core | 1.35 |
| | Pod system 2g | Pod | Mesh coil, magnetic | 5.10 |
| 02 Oil — "Yours or ours" | Send us your oil | Client | Blend + fill service only | 0.85 |
| | Distillate *(default)* | Ours | Lab-tested, 88%+ | 3.20 |
| | Live resin | Ours | Cold-cured, cultivar-true | 6.40 |
| 03 Terpenes — "5% loading" | No terpenes | — | Straight fill | 0.00 |
| | Botanical blend *(default)* | Botanical | 12 profiles in stock | 0.35 |
| | Cultivar-true | Cultivar | Steam-distilled, single source | 0.90 |
| 04 Packaging — "Child-resistant" | Bulk, unbranded | Bulk | Bagged, 100 per case | 0.00 |
| | CR box + label *(default)* | Print | 4-colour, your artwork | 0.55 |
| | Identity + box | Design | We design the brand | 1.10 |

**Pricing logic (implement exactly):**

```
volumes       = [1000, 5000, 25000, 100000]        // labels "1,000" … "100,000+"
discount      = {1000: 1, 5000: 0.92, 25000: 0.84, 100000: 0.76}
unitPrice     = (hw + oil + terp + pkg) * discount[qty]
total         = unitPrice * qty                     // displayed with cents stripped
lineItem      = optionName + "  " + money(optionPrice * discount[qty])
discountLine  = discount === 1 ? "—" : "−" + round((1 - discount) * 100) + "%"
leadTime      = qty >= 25000 ? "4–5 weeks" : "2–3 weeks"
money(n)      = "$" + n.toLocaleString("en-US", {minimumFractionDigits: 2, maximumFractionDigits: 2})
```

Default on load: All-in-one 2g, Distillate, Botanical blend, CR box + label, 5,000 units.

### 1f — Reorder dashboard (1080 px)

**Purpose:** repeat purchase in two clicks — most of the revenue in this category.

Header 76px; welcome block with the account eyebrow ("Account · SSL-2291"), h1 "Welcome back,
Nova Botanicals.", and a right-aligned status pair (a `--stock` dot + "Licence C11-0004821 ·
verified", "Net 30 · renews 12 Mar 2027"). Below: an in-flight order strip, then the reorder
table — each row a checkbox square (`--violet` fill + `--inv-fg` ✓ when selected, row ground →
`--paper-tint`), product name over SKU, last-ordered date, quantity, unit price and line total,
all tabular. A `--slab` bar shows the account terms, the selected line count and an `--ember`
"Reorder selected"; a "Clear" button resets the selection.

**Reorder seed data:**

| Line | SKU | Last ordered | Qty | Unit |
| --- | --- | --- | --- | --- |
| SSL All-in-One 2g · Blue Dream | AIO-2000-C / TRP-BLD-CT | 12 Aug 2026 | 24,000 | $4.86 |
| Cart 510 · Glass 1g | C510-G-100 | 12 Aug 2026 | 40,000 | $2.14 |
| Blue Dream terpenes · 5 L drum | TRP-BLD-CT | 29 Jul 2026 | 4 | $2,400.00 |
| CR box + label · Nova artwork | PKG-BOX-04 | 29 Jul 2026 | 24,000 | $0.55 |
| Battery · 510 Vari | BAT-510-V3 | 04 Jun 2026 | 12,000 | $1.95 |

Selected by default: rows 1, 3, 4. Total = Σ(qty × unit); the unit count excludes lines priced
above $100 (drums are not units). Empty selection shows "Select lines to rebuild your last order".

### 1j — About (1080 px)

Header 76px (as 1b). Then, top to bottom:

1. **Split hero** — grid `minmax(0,1.02fr) minmax(0,.98fr)`, hairline below, left cell
   `64px 44px 60px`. `.ov` eyebrow "About us · Los Angeles" in `--violet`; h1 52px / 1.03,
   `-.025em`; two 16.5px paragraphs at `max-width: 480px` (the second carries the client's
   co-packing line in `font-weight: 600`); a 3-up `<dl>` on a `--line-strong` top rule —
   Experience **25 yrs** · Facility **FDA-reg.** · Model **Co-pack** (serif 28px). Right cell:
   full-bleed `object-fit: cover` photograph, left hairline, `--paper-well` behind.
2. **Compliance slab** — `--slab`, `34px 48px`, flex baseline: a `.sl` "Compliance" label in
   `--violet-light` beside the regulated line, re-typeset at serif 23px uppercase,
   `max-width: 760px`. **This sentence may be re-typeset, not reworded** (see *Compliance copy*).
3. **Two-up story** — `72px 48px`, `--gap-col`. Each column: a 4:3 media frame
   (`--line-card`, `--r-card`, `--paper-well`), h2 serif 30px, 15.5px body. The right column
   adds a four-row capability list (label left, `.sl --faded` sourcing right — In-house ×3,
   Partnered for freight).
4. **Reviews** — `--paper-tint`, `72px 48px`, standard section head ("Reviews from customers" /
   "Four operators"), then a 2×2 grid of `<figure>` cards (`--paper-raised`, `--line-card`,
   `--r-card`, `26px 24px`): h3 serif 22px, blockquote 15px / 1.7 in `--faded`, `figcaption`
   `.sl` in `--violet`. Reviewer names are the client's, abbreviated to first name + initial.
   Closes with the `--ember` "Request a quote" CTA + a `--violet` catalogue text link.

### 1k — How it works (1080 px)

1. **Dark photo hero** — `isolation: isolate`, ground `#0d070d`, a cover photograph at
   `opacity: .5` under `linear-gradient(90deg, rgba(9,5,9,.94) 0%, rgba(9,5,9,.72) 52%,
   rgba(9,5,9,.44) 100%)`; content `64px 48px 60px` at `max-width: 640px`, eyebrow in
   `#78d6f1`, h1 52px "Build your brand with us.", body in `rgba(255,255,255,.8)`,
   `--ember` CTA. Bottom border `rgba(185,168,224,.26)`.
2. **Six steps** — `72px 48px`, `grid-template-columns: repeat(3, minmax(0,1fr))`,
   `column-gap: --gap-col`. Each cell: `border-top: 1px --line`, `20px 0 24px`, a `--violet`
   `.sl` numeral beside an h3 serif 22px, then 14.5px `--faded` copy. Steps: 01 Select your
   hardware (CCELL® — the client is an official distributor) · 02 Choose flavours & terpenes ·
   03 Design the packaging · 04 Pack & label in the lab · 05 Ship to your location · 06 Own the
   brand.
3. **Consultation slab** — `--slab`, `48px`, two columns. Left: eyebrow, h2 serif 34px
   "In person, Zoom, or phone.", body in `--on-slab`. Right: two stacked `.sl` action rows
   (space-between) — a `--paper`-ground "Book a call" carrying the phone number, and a
   `--line-slab` bordered "Start with hardware".

### 1l — Additional services (1080 px)

1. **Split hero** — `minmax(0,1.04fr) minmax(0,.96fr)`, left `60px 44px 56px`: eyebrow, h1
   48px "If it isn't on the site, call us.", body with the phone number in `--ink` /
   `font-weight: 600`, `--slab` CTA "Book a free call". Right: **the animated gummy stage**
   (below).
2. **Two services** — `72px 48px`, two columns, `align-items: start`. Left: `.sl` "01",
   h2 serif 32px "Gummies manufacturing", body, then a five-row spec list (Shapes · Pectin ·
   Testing · Minimums · Turnaround). Both columns are `align-items: stretch` and the list is a
   `flex: 1` column whose rows each take `flex: 1` — so the rules distribute down the full
   column height and the last rule lands level with the Bulk sales copy. Right: **the animated smoke frame** (below), then `.sl` "02",
   h2 "Bulk sales", body.
3. **Phone slab** — `--slab`, `40px 48px`, space-between: serif 26px "Volume discounts quoted
   by phone." and `.sl` "+1 213 943 9000 · Mon–Fri 9:00–17:30 PT" in `--violet-light`.

### 1m — Shows (1080 px)

1. **Title block** — `60px 48px 40px`: eyebrow "Shows", h1 48px "Meet us on the floor.",
   16.5px body at `max-width: 520px`.
2. **Next-show card** — full-width `--paper-raised` card (`--line-card`, `--r-card`),
   `34px 32px`: `.sl` "Next show" in `--violet`, h2 serif 34px, body, a 3-up `<dl>`
   (Dates **17–19 Nov** · City **Ft. Lauderdale** · Year **2026**, serif 22px tabular), then an
   `--ember` "Book a booth slot" + a `--violet` outbound "Get event info" link to
   `champstradeshows.com`.
3. **Calendar list** — section head, then rows on
   `grid-template-columns: 120px minmax(0,1fr) auto`, `gap: 20px`, `18px 0`, hairline between:
   date `.sl` tabular in `--violet` (`--faded` when TBA), serif 19px venue, right-aligned
   `.sl` status (`Confirmed` / `Pending`, `white-space: nowrap`). Pending rows render the
   venue in `--faded`.

**Show seed data:**

| Date | Show | Venue | Status |
| --- | --- | --- | --- |
| 17–19 Nov 2026 | CHAMPS Fort Lauderdale | Broward County Convention Center | Confirmed |
| TBA | CHAMPS Las Vegas | — | Pending |
| TBA | West coast trade dates | — | Pending |

Only the Fort Lauderdale date is real; the other two are placeholders for the client's calendar
and should be driven by data, not hard-coded.

---

## Interactions & Behavior

### Hero smoke stage (2a) — the signature effect
Four layered copies of `ss-mark.webp` drift behind the hero, all `mix-blend-mode: screen`,
`background-size: contain`, `pointer-events: none`, `will-change: translate,rotate,scale`.

| Layer | Position / size | Filter | Opacity | Animation |
| --- | --- | --- | --- | --- |
| p1 | `left:-26%; top:-38%; width:98%`, 1:1 | `blur(64px) saturate(1.75) contrast(1.1)` | 1 | `ss-a 46s ease-in-out infinite` |
| p2 | `right:-30%; top:-24%; width:112%`, 1:1 | `blur(104px) saturate(1.9)` | .92 | `ss-b 67s ease-in-out infinite` |
| p3 | `left:14%; bottom:-52%; width:66%`, 1:1 | `blur(30px) saturate(1.5)` | keyframed | `ss-c 34s linear infinite` |
| p4 | `right:6%; bottom:-58%; width:52%`, 1:1 | `blur(46px) saturate(1.4)` | keyframed | `ss-d 41s linear infinite`, `-14s` delay |

These animate the **`rotate` / `scale` / `translate` longhands**, never `transform` — that is
what lets ambient drift compose with other transforms instead of one overwriting the other.

```css
@keyframes ss-a{0%{translate:-3% 3%;rotate:0deg;scale:1.1}  50%{translate:7% -5%;rotate:9deg;scale:1.28} 100%{translate:-3% 3%;rotate:0deg;scale:1.1}}
@keyframes ss-b{0%{translate:6% -4%;rotate:0deg;scale:1.34} 50%{translate:-8% 6%;rotate:-11deg;scale:1.14}100%{translate:6% -4%;rotate:0deg;scale:1.34}}
@keyframes ss-c{0%{translate:0 18%;scale:.96;opacity:0} 18%{opacity:.62} 100%{translate:0 -26%;scale:1.4;opacity:0}}
@keyframes ss-d{0%{translate:0 22%;scale:1.02;opacity:0} 22%{opacity:.5}  100%{translate:-6% -30%;scale:1.46;opacity:0}}
@keyframes ss-breathe{0%,100%{scale:1;rotate:-1.4deg} 50%{scale:1.05;rotate:1.4deg}}
@keyframes ss-halo{0%,100%{opacity:.5;scale:1} 50%{opacity:.95;scale:1.12}}
@keyframes ss-grain{0%{translate:0 0}25%{translate:-2% 2%}50%{translate:2% -2%}75%{translate:-2% -1%}100%{translate:0 0}}
```

Above the plumes, in order: **grain** (`inset:-6%`, `mix-blend-mode: overlay`, `opacity:.22`,
`ss-grain 9s steps(4) infinite`, an inline-SVG `feTurbulence` tile —
`fractalNoise`, `baseFrequency=".9"`, `numOctaves="3"`, 220×220); a **vertical scrim**
`linear-gradient(180deg, rgba(9,5,9,.86) 0%, rgba(9,5,9,.42) 34%, rgba(9,5,9,.5) 72%,
rgba(9,5,9,.94) 100%)` — this is what keeps the copy legible, do not weaken it; the
**cursor-trail canvas** (`inset:0`, `pointer-events:none`, `mix-blend-mode:screen`, sized at
`min(devicePixelRatio, 2)`); then content at `z-index: 1`.

The right-hand figure holds the crisp mark with `ss-breathe 13s ease-in-out infinite` over an 88%
circle `radial-gradient(circle, rgba(236,142,190,.55) 0%, rgba(120,214,241,.18) 42%,
rgba(9,5,9,0) 70%)`, `filter: blur(24px)`, `ss-halo 11s ease-in-out infinite`.

### Cursor smoke trail (2a hero only)
A canvas particle system, deliberately **subtle** — the client tuned it down twice. The alphas
are spec, not suggestion.

- **Sprite:** built once on load — a 256×256 offscreen canvas with the mark drawn at
  `(12, 12, 232, 232)` under `ctx.filter = "blur(38px) saturate(1.1)"`.
- **pointermove:** one particle, only when the pointer has travelled `> 26px` since the last
  sample. Jitter ±6px; velocity `(dx*0.11 ± 7, dy*0.11 − 16 … − 38)` px/s; size `52–98`;
  life `1300–2000ms`; **alpha `0.40`**.
- **pointerdown (the wisp):** 9 particles on a circle, angle `i/9 * 2π + random(0.4)`, speed
  `70–170` px/s, `y` velocity scaled `0.62` and offset `−30`; size `30–64`; life `900–1500ms`;
  **alpha `0.06`**. Plus one slow rising puff at `(x, y−10)`, velocity `(0, −60)`, size `120`,
  life `1500ms`, **alpha `0.05`**.
- **Per frame** (`dt` clamped to 64ms): integrate position, damp velocity `×0.975`, apply
  `−6 px/s²` buoyancy to `vy`, advance rotation by `spin` (`±0.25 rad/s`), grow size by
  `1 + grow*k*2.1` where `grow ∈ [0.34, 0.84]` and `k = t/life`, and set
  `globalAlpha = alpha * sin(min(1, k*3.2) * π/2) * (1 − k)^1.35`. Clear the canvas each frame;
  cap the pool at 260 (oldest dropped). Reset the last-position sample on `pointerleave`.
  Resize via `ResizeObserver` on the stage.

### Motion control
A three-value setting governs all hero motion — expose it as a prop/setting, not a constant:
**Immersive** (default) · **Soft** (plumes to `opacity:.42`, `blur(96px) saturate(1.2)`) ·
**Paused** (all plume/mark/halo/grain animations paused, plumes at `opacity:.5`, trail ignores
pointer events).

`@media (prefers-reduced-motion: reduce)` pauses plumes, mark, halo and grain. **The trail should
also be suppressed under reduced motion** — the prototype does not do this and it is a known gap
worth fixing in implementation.

### Gummy hop (1l hero figure)
The stage is a `position: relative` grid cell, `place-items: end center`, `36px 36px 44px`,
`min-height: 340px`, `--paper-well` ground. The product cut-out sits at `max-width: 300px`
with `transform-origin: 50% 100%`; an ellipse shadow (`150 × 16`, `border-radius: 50%`,
`radial-gradient(closest-side, rgba(31,26,45,.5), rgba(31,26,45,0))`) sits `34px` from the
bottom, centred by `translate: -50% 0`.

Both run `3.6s cubic-bezier(.4,0,.5,1) infinite` on the same clock so the contact frames line up.
Hovering the stage drops both to `1.5s`; `prefers-reduced-motion` sets `animation: none`.

```css
@keyframes ss-gummy{0%{translate:0 0;rotate:-2.5deg;scale:1 1} 18%{translate:0 -26px;rotate:2deg;scale:.96 1.05} 34%{translate:0 0;rotate:-1deg;scale:1.07 .9} 44%{translate:0 -9px;rotate:1deg;scale:.98 1.02} 58%{translate:0 0;rotate:0deg;scale:1.03 .96} 70%{translate:0 0;rotate:0deg;scale:1 1} 100%{translate:0 0;rotate:-2.5deg;scale:1 1}}
@keyframes ss-gummy-shadow{0%{scale:1 1;opacity:.34} 18%{scale:.72 1;opacity:.16} 34%{scale:1.12 1;opacity:.4} 44%{scale:.9 1;opacity:.24} 58%{scale:1.06 1;opacity:.36} 70%,100%{scale:1 1;opacity:.34}}
```

The 70%→100% hold is the rest beat — without it the bear hops continuously and reads as nervous.
Squash (`scale: 1.07 .9`) lands on the contact frame at 34%, stretch (`.96 1.05`) on the apex at
18%; the shadow narrows to `.72` and fades to `.16` at the apex. Longhands again, never
`transform`.

### Smoke frame drift (1l, second service column)
The 16:10 media frame gets `background: #0a050a`, `isolation: isolate`, and two layers:

- the photograph absolutely filling the frame, `filter: saturate(1.15) contrast(1.05)`,
  `ss-drift 26s ease-in-out infinite`;
- above it a `mix-blend-mode: screen` bloom,
  `radial-gradient(60% 70% at 42% 60%, rgba(120,214,241,.5), rgba(9,5,9,0) 70%)`,
  `ss-drift-glow 13s ease-in-out infinite` — half the drift period, so the bloom peaks twice per
  pan and the loop never reads as a cycle.

```css
@keyframes ss-drift{0%{translate:-2% 1%;scale:1.06;rotate:0deg} 33%{translate:2% -2%;scale:1.14;rotate:.8deg} 66%{translate:1% 2%;scale:1.1;rotate:-.6deg} 100%{translate:-2% 1%;scale:1.06;rotate:0deg}}
@keyframes ss-drift-glow{0%,100%{opacity:.18} 50%{opacity:.42}}
```

Scale never drops below `1.06` — the frame must stay covered through the whole pan. Both
suppressed under `prefers-reduced-motion`.

### Other interaction states
- **Nav links:** 400ms colour transition to `--violet` + the 400ms `scaleX` underline.
- **Buttons/CTAs:** `--ember` primaries invert to `#2b2b2b` ground / `#ffffff` text on hover and
  lift `translate: 0 -2px` over 200ms.
- **Cards:** ground `--paper-raised` → `--paper-tint`; linked cards lift `translate: 0 -3px`.
- **Product imagery:** `scale: 1.025` over 700ms `cubic-bezier(.2,.6,.2,1)` on link hover.
- **Table rows (1b, 1f):** ground → `--paper-tint` on hover.
- **Filter / tier / volume buttons:** label colour only, 200ms; selection is single-choice.
- **Option cards (1c, 1h):** 200ms background transition; selection switches border and reveals
  the dot.
- **Registration (1i):** step 1 → step 2 on submit, "Back" returns; chips are multi-select, the
  order band is single-select.
- **Reorder (1f):** rows are multi-select; totals derive from the selection; "Clear" empties it.
- **Loading / error / empty states are not designed.** Needed: an empty-filter state on 1b,
  submit-in-flight and failure states on "Send to my rep" and "Submit for approval", upload
  progress and rejection on the resale certificate, and field-level validation on both forms
  (starred fields are required; nothing else is).

### Responsive behaviour
Not designed. All thirteen screens are fixed-width 1080 desktop artboards. Sensible reductions:
collapse horizontal padding toward 24–32px; the hero grid to one column with the smoke stage
full-bleed below the copy; card grids 4-up → 2-up → 1-up; the 1b/1f tables to stacked rows with
the price promoted; the detail-page two-column body to gallery-over-buy-column; the 1c and 1i
splits to stacked with the estimate/rail becoming a sticky bottom summary. Confirm breakpoints
with design before shipping.

---

## State Management

| State | Screen | Type / values | Default | Trigger |
| --- | --- | --- | --- | --- |
| `fmt` | 1b | "All" \| "All-in-one" \| "510 cart" \| "Pod" \| "Battery" \| "Packaging" | "All" | Format button |
| `tier` | 1b | 0 \| 1 \| 2 (→ 1k / 5k / 25k) | 1 | Tier button |
| `hwv` | 1g | 0–3 (1k / 5k / 25k / 100k) | 1 | Volume button |
| `hwc` | 1g | 0–3 colourway index | 0 | Swatch button |
| `tsz` | 1e | 0–3 (10 mL / 100 mL / 1 L / 5 L) | 2 | Size button |
| `pkv` | 1h | 0–3 (5k / 10k / 50k / 200k) | 1 | Run-size button |
| `pkf` | 1h | 0–2 print method | 0 | Method row |
| `regStep` | 1i | 1 \| 2 | 1 | Submit / Back |
| `ri` | 1i | string[] of interests | ["Hardware","Packaging"] | Chip toggle |
| `rb` | 1i | order band string | "5,000–25,000" | Band button |
| `hw` `oil` `terp` `pkg` | 1c | option ids | aio2 / dist / bot / box | Option card |
| `qty` | 1c | 1000 \| 5000 \| 25000 \| 100000 | 5000 | Volume button |
| `reo` | 1f | string[] of line ids | ["aio","terp","box"] | Row checkbox |
| `now` | 2a | epoch ms, 1s interval | — | Countdown tick |
| theme | global | "editorial" \| "brand" | brand | Root class/attribute |
| motion | 2a | "immersive" \| "soft" \| "paused" | immersive | Setting + `prefers-reduced-motion` |
| gate accepted | 1d | boolean, persisted | false | Enter button |

The company screens (1j–1m) hold no state — they are static content. Their only dynamic
requirement is the show calendar, which should come from data.

All totals are derived — never stored.

**Data the real implementation needs:** a hardware catalogue endpoint (18 models claimed, 7
seeded), per-SKU inventory and lead times, the volume discount table as server-owned config
(never client-trusted), COA/certificate documents per batch, an artwork pre-flight service for
1h, a quote-submission endpoint that emails the account's assigned rep, registration
(two-stage: lead, then verification) and order-history endpoints.

## Assets

| Asset | Path | Notes |
| --- | --- | --- |
| Brand mark ("SS" smoke) | `assets/ss-mark.webp` | 512×512 WebP with alpha, supplied by the client. Used three ways: four blurred drifting plumes, the crisp hero figure, and the blurred source of the trail sprite. A transparent PNG/WebP is required — the blur relies on the alpha edge. |
| Neon wordmark | CSS only | Three `<span>`s with `-webkit-text-stroke` (1.7px `#4cc7ef` / `#e0117c`, 1.2px `#7fd8f2`) and layered `text-shadow` glows; `color: transparent`. No image. |
| Product photography | `smokeshowlabs.com/cdn/...` | Referenced live in the prototype for the three detail pages. **Replace with owned assets** — see `site-images.json` for the URLs used. |
| Bodoni Moda 400 + italic | `fonts/bodoni-moda-400.woff2`, `fonts/bodoni-moda-400-italic.woff2` | Bundled. SIL OFL — self-host, no CDN. |
| Jost variable 100–900 | `fonts/jost-variable.woff2` | Bundled. SIL OFL — self-host, no CDN. |

No icons anywhere — every indicator is a coloured square, dot, bar or rule. No emoji. No CDN,
no analytics, no external requests beyond the placeholder photography; keep it that way.

## Compliance copy — may be re-typeset, may not be reworded

- Licence gate: "Confirm you are 21+ and buying for a licensed business."
- Gate footnote: "Licence number requested at registration"
- Gate legal: "Products are sold to licensed cannabis manufacturers and distributors, unfilled or
  filled to specification."
- Quote legal: "Excludes freight, excise and state testing. Final pricing confirmed by your rep."
- About (1j) slab: "Our federally legal hemp-derived products are made in an FDA-registered
  facility." — a regulatory claim from the client's own site; re-typeset only.
- Footer: "Products are intended for licensed cannabis manufacturers and distributors only, and
  are sold unfilled or filled to the purchaser's specification. Nothing on this page is an offer
  to sell cannabis products to consumers."

## Accessibility notes already resolved
- Status dots on `--slab` bars use `--violet-light`, not `--stock` (`#2e3191` reads ~1.5:1 on
  `#111` and is invisible). `--stock` is for light grounds only.
- Selected order-band buttons use `--inv-fg` on the `--slab` fill, never `--paper` (which is
  `#292929` in the Brand theme and would vanish).
- Promo chips on `--slab` use `#c8002c`, not `--promo` `#f00036`, to reach 6.6:1.
- Hero copy over the smoke stage relies on the vertical scrim; text is full-opacity white or
  `rgba(255,255,255,.72)`+ — never alpha-muted below that on the animated ground.
- Inputs are `16px` minimum with `min-height: 44px`; buttons `min-height: 42–44px`.
- Focus ring: `2px solid var(--violet)` at `4px` offset on all interactive elements.
- Keep `.sl` labels at 9px / weight 600 — they are at the legibility floor; do not go smaller.

## Files

| File | What |
| --- | --- |
| `Smoke Show Labs.dc.html` | All thirteen screens, both themes, the smoke stage and trail system. Reference only — see *About the Design Files*. |
| `support.js` | The prototype's template runtime. Needed only to open the HTML locally; **do not port**. |
| `hero-three.js` | The hero smoke stage module the prototype loads. Reference for the effect's parameters. |
| `fonts/*.woff2` | The three self-hosted faces (Bodoni Moda 400 + italic, Jost variable). Ship these. |
| `assets/ss-mark.webp` | The brand mark (ship this). |
| `site-images.json` | The placeholder photography URLs used by the detail pages. |
| `screenshots/*.png` | Full-page captures, 1080 px wide, one per screen (plus registration step 2). Animated screens (2a hero, 1l gummy + smoke) are frozen mid-loop. |
| `README.md` | This document. |

### Screenshot index

| File | Screen |
| --- | --- |
| `2a-home.png` | 2a Home |
| `1d-licence-gate.png` | 1d Licence gate |
| `1i-registration.png` | 1i Registration step 1 |
| `1i-registration-step2.png` | 1i Registration step 2 |
| `1b-catalogue.png` | 1b Catalogue |
| `1g-hardware-detail.png` | 1g Hardware detail |
| `1e-terpene-detail.png` | 1e Terpene detail |
| `1h-packaging-detail.png` | 1h Packaging detail |
| `1c-quote-builder.png` | 1c Quote builder |
| `1f-reorder-dashboard.png` | 1f Reorder dashboard |
| `1j-about.png` | 1j About |
| `1k-how-it-works.png` | 1k How it works |
| `1l-additional-services.png` | 1l Additional services |
| `1m-shows.png` | 1m Shows |

All captures are of the light (Editorial) theme. For the dark (Brand) theme, open the
`.dc.html` — both are live in the same file.

Screenshots are static captures; the smoke stage is frozen at an arbitrary frame, so read the
motion spec rather than the still. Open the `.dc.html` in a browser for both themes and the live
effect.

The prototype renders all thirteen screens on one canvas, each wrapped in a labelled `#2a`, `#1b`…
frame with a badge; that scaffolding (`.dv-*` classes) is review chrome and is not part of the
product.
