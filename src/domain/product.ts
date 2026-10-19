// Product domain.
//
// Zod schemas and the types inferred from them for the catalogue and the three
// product-detail data sets (hardware, terpenes, packaging) in
// design_handoff_wholesale_b2b. These schemas are isomorphic: they are used to
// parse the typed fixtures in src/data/ and to validate any client-supplied
// product references. They must not import `server-only` — pricing lives in
// src/server/pricing/ and is the only place that owns money arithmetic.
import { z } from 'zod'

/** Catalogue format filters. The "All" pill is a UI state, not a format. */
export const productFormat = z.enum([
  'all-in-one',
  '510-cart',
  'pod',
  'battery',
  'packaging',
])
export type ProductFormat = z.infer<typeof productFormat>

/** Catalogue price-tier buckets shown in the filter bar (1k / 5k / 25k). */
export const catalogueTier = z.enum(['1k', '5k', '25k'])
export type CatalogueTier = z.infer<typeof catalogueTier>

/**
 * Stock state for a catalogue row. Decorative in the handoff; the table foot
 * renders an "in-stock" key (violet) and a "lead time" key (ember). Wire to
 * real inventory later.
 */
export const stockState = z.enum(['in-stock', 'lead-time'])
export type StockState = z.infer<typeof stockState>

/** A catalogue row: one SKU with its per-unit price at each tier. */
export const catalogueProduct = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  format: productFormat,
  /** "Ceramic, 1.2Ω" — null renders as "—" (batteries have no core). */
  core: z.string().min(1).nullable(),
  /** "2.0 mL" — null renders as "—" (batteries have no capacity). */
  capacity: z.string().min(1).nullable(),
  moq: z.number().int().positive(),
  stock: stockState,
  /** Per-unit USD at each catalogue tier. Presentational; the server owns live pricing. */
  tierPrices: z.object({
    '1k': z.number().nonnegative(),
    '5k': z.number().nonnegative(),
    '25k': z.number().nonnegative(),
  }),
})
export type CatalogueProduct = z.infer<typeof catalogueProduct>

/** A labelled value pair used for spec `<dl>` rows. */
export const specRow = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
})
export type SpecRow = z.infer<typeof specRow>

/** A certification card ("Open" in violet). */
export const certification = z.object({
  title: z.string().min(1),
  caption: z.string().min(1),
  href: z.string().min(1),
})
export type Certification = z.infer<typeof certification>

/** An options/add-on band card: title, copy, and a violet price delta. */
export const addOn = z.object({
  title: z.string().min(1),
  copy: z.string().min(1).optional(),
  delta: z.number().nonnegative(),
})
export type AddOn = z.infer<typeof addOn>

/** A linked "pairs with" card: category eyebrow, title, and copy. */
export const pairCard = z.object({
  category: z.string().min(1),
  name: z.string().min(1),
  copy: z.string().min(1),
  href: z.string().min(1),
})
export type PairCard = z.infer<typeof pairCard>

/** Semantic tone for an evidence bar; a token reference, never a hex. */
export const evidenceTone = z.enum([
  'violet',
  'azure',
  'violet-light',
  'ember',
  'blush',
  'faded',
])
export type EvidenceTone = z.infer<typeof evidenceTone>

/** A measured-result bar in the evidence section. */
export const benchResult = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  /** Visual fill as a percentage (0–100). May differ from the measured value. */
  barPct: z.number().min(0).max(100),
  tone: evidenceTone,
})
export type BenchResult = z.infer<typeof benchResult>

/** A GC/MS composition bar for terpene products. */
export const compositionBar = z.object({
  compound: z.string().min(1),
  pct: z.number().min(0).max(100),
  tone: evidenceTone,
})
export type CompositionBar = z.infer<typeof compositionBar>

/** An artwork pre-flight check for packaging products. */
export const preflightCheck = z.object({
  check: z.string().min(1),
  detail: z.string().min(1),
  status: z.enum(['pass', 'fix']),
})
export type PreflightCheck = z.infer<typeof preflightCheck>

/** Fields shared by all three product-detail variants. */
const detailBase = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  categoryEyebrow: z.string().min(1),
  intro: z.string().min(1),
  legalNote: z.string().min(1),
  specs: z.array(specRow).min(1),
  secondarySpecs: z.array(specRow).optional(),
  certifications: z.array(certification).min(1),
  addOns: z.array(addOn).optional(),
  pairsWith: z.array(pairCard).min(1),
})

/** Hardware: volume tiers reprice live; colourways reprice the unit price. */
export const hardwareVolumeTier = z.object({
  units: z.number().int().positive(),
  perUnit: z.number().nonnegative(),
  leadTime: z.string().min(1),
  isDefault: z.boolean(),
})
export type HardwareVolumeTier = z.infer<typeof hardwareVolumeTier>

export const colourway = z.object({
  label: z.string().min(1),
  /** A physical product colour, not a theme token. */
  hex: z.string().regex(/^#[0-9a-f]{6}$/i),
  isDefault: z.boolean(),
})
export type Colourway = z.infer<typeof colourway>

export const hardwareProduct = detailBase.extend({
  kind: z.literal('hardware'),
  volumeTiers: z.array(hardwareVolumeTier).min(1),
  colourways: z.array(colourway).min(1),
  benchResults: z.array(benchResult).min(1),
})
export type HardwareProduct = z.infer<typeof hardwareProduct>

/** Terpenes: size tiers priced per mL; GC/MS composition as bars. */
export const terpeneSizeTier = z.object({
  label: z.string().min(1),
  pricePerMl: z.number().nonnegative(),
  /** The handoff "Pack" cell is inconsistent (a count vs a price) — keep it verbatim. */
  packLabel: z.string().min(1),
  leadTime: z.string().min(1),
  isDefault: z.boolean(),
})
export type TerpeneSizeTier = z.infer<typeof terpeneSizeTier>

export const terpeneProduct = detailBase.extend({
  kind: z.literal('terpenes'),
  sizeTiers: z.array(terpeneSizeTier).min(1),
  composition: z.array(compositionBar).min(1),
  compositionNote: z.string().min(1),
})
export type TerpeneProduct = z.infer<typeof terpeneProduct>

/** Packaging: run sizes priced per box; a print method reprises the unit price. */
export const packagingRunTier = z.object({
  units: z.number().int().positive(),
  perBox: z.number().nonnegative(),
  leadTime: z.string().min(1),
  isDefault: z.boolean(),
})
export type PackagingRunTier = z.infer<typeof packagingRunTier>

export const printMethod = z.object({
  name: z.string().min(1),
  note: z.string().min(1),
  /** Added to the run-size per-box price. */
  delta: z.number().nonnegative(),
  included: z.boolean(),
})
export type PrintMethod = z.infer<typeof printMethod>

export const packagingProduct = detailBase.extend({
  kind: z.literal('packaging'),
  runTiers: z.array(packagingRunTier).min(1),
  printMethods: z.array(printMethod).min(1),
  preflight: z.array(preflightCheck).min(1),
})
export type PackagingProduct = z.infer<typeof packagingProduct>

/** The product-detail union — one component, three data sets. */
export const productDetail = z.discriminatedUnion('kind', [
  hardwareProduct,
  terpeneProduct,
  packagingProduct,
])
export type ProductDetail = z.infer<typeof productDetail>
