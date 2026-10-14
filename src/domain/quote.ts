// Quote-builder domain.
//
// The four option groups, their per-unit base prices, the volume selector, and
// the selection a client sends to the server. Base prices are data, but the
// discount map and the arithmetic that turn a selection into a total live in
// src/server/pricing/ — the client never computes money. See design_handoff
// 1c and CLAUDE.md rule 1.
import { z } from 'zod'

/** Allowed fill volumes. Labels ("1,000" … "100,000+") live in the data layer. */
export const quoteVolumeUnits = z.union([
  z.literal(1000),
  z.literal(5000),
  z.literal(25000),
  z.literal(100000),
])
export type QuoteVolumeUnits = z.infer<typeof quoteVolumeUnits>

/** A volume option with its display label and preselected default. */
export const quoteVolumeOption = z.object({
  units: quoteVolumeUnits,
  label: z.string().min(1),
  isDefault: z.boolean(),
})
export type QuoteVolumeOption = z.infer<typeof quoteVolumeOption>

export const quoteOptionGroupKey = z.enum(['hardware', 'oil', 'terpenes', 'packaging'])
export type QuoteOptionGroupKey = z.infer<typeof quoteOptionGroupKey>

/** One option within a group (e.g. "All-in-one 2g"). */
export const quoteOption = z.object({
  /** Stable key sent to the server; must be unique within its group. */
  key: z.string().min(1),
  name: z.string().min(1),
  /** A faded tag ("AIO", "—", …). */
  tag: z.string().min(1),
  note: z.string().min(1),
  /** Per-unit USD before discount. */
  unitPrice: z.number().nonnegative(),
})
export type QuoteOption = z.infer<typeof quoteOption>

export const quoteOptionGroup = z.object({
  key: quoteOptionGroupKey,
  /** The violet numeral ("01" … "04"). */
  numeral: z.string().min(1),
  title: z.string().min(1),
  hint: z.string().min(1),
  options: z.array(quoteOption).min(2),
  defaultOptionKey: z.string().min(1),
})
export type QuoteOptionGroup = z.infer<typeof quoteOptionGroup>

/** The full quote-builder configuration, keyed by group. */
export const quoteConfig = z.object({
  volumes: z.array(quoteVolumeOption).min(1),
  groups: z.array(quoteOptionGroup).length(4),
})
export type QuoteConfig = z.infer<typeof quoteConfig>

/** A client selection: option keys per group plus a volume. Sent to the server. */
export const quoteSelection = z.object({
  hardware: z.string().min(1),
  oil: z.string().min(1),
  terpenes: z.string().min(1),
  packaging: z.string().min(1),
  volume: quoteVolumeUnits,
})
export type QuoteSelection = z.infer<typeof quoteSelection>

/** A quote reference such as "SSL-2026-0418". */
export const quoteReference = z.string().regex(/^SSL-\d{4}-\d{4}$/)
export type QuoteReference = z.infer<typeof quoteReference>
