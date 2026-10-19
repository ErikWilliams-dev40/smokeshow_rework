import { describe, expect, it } from 'vitest'

import {
  catalogueProduct,
  hardwareProduct,
  packagingProduct,
  quoteConfig,
  quoteEstimate,
  quoteSelection,
  terpeneProduct,
} from '../../src/domain'

/**
 * The domain schemas exist to parse the handoff's real numbers. These tests
 * pin that contract: each fixture is a verbatim transcription from
 * design_handoff_wholesale_b2b/README.md, and `parse` must succeed. If a schema
 * drifts from the spec, these fail — which is the point.
 */
describe('domain / catalogue', () => {
  it('parses the All-in-One 2g catalogue row', () => {
    const row = {
      sku: 'AIO-2000-C',
      name: 'SSL All-in-One 2g',
      format: 'all-in-one',
      core: 'Ceramic, 1.2Ω',
      capacity: '2.0 mL',
      moq: 1000,
      stock: 'in-stock',
      tierPrices: { '1k': 4.35, '5k': 3.95, '25k': 3.6 },
    }
    expect(catalogueProduct.parse(row)).toEqual(row)
  })

  it('parses a battery row whose core and capacity are absent', () => {
    const row = {
      sku: 'BAT-510-V3',
      name: 'Battery · 510 Vari',
      format: 'battery',
      core: null,
      capacity: null,
      moq: 1000,
      stock: 'lead-time',
      tierPrices: { '1k': 2.2, '5k': 1.95, '25k': 1.7 },
    }
    expect(catalogueProduct.parse(row)).toEqual(row)
  })
})

describe('domain / product detail', () => {
  it('parses the hardware detail (1g) with tiers, colourways and bench bars', () => {
    const hardware = {
      kind: 'hardware',
      sku: 'AIO-2000-C',
      name: 'SSL All-in-One 2g',
      categoryEyebrow: 'Hardware',
      intro: 'Filled by us, ready to brand.',
      legalNote: 'Legal note.',
      specs: [
        { label: 'Tank', value: '2.0 mL borosilicate' },
        { label: 'Heating', value: '1.2Ω porous ceramic, wickless' },
      ],
      certifications: [
        { title: 'Heavy metal migration', caption: 'Compliant', href: '/certs/hm' },
      ],
      addOns: [
        {
          title: 'Laser etch',
          copy: 'One-colour mark on the body. No plate charge, 1,000 minimum.',
          delta: 0.14,
        },
        {
          title: 'UV print',
          copy: 'Full-colour wrap, Pantone matched. 5,000 minimum per artwork.',
          delta: 0.31,
        },
        {
          title: 'Custom mouthpiece',
          copy: 'Your tool, our line. 6-week first article, 25,000 minimum.',
          delta: 0.9,
        },
      ],
      pairsWith: [
        {
          category: 'Terpenes',
          name: 'Blue Dream',
          copy: 'Cultivar-true, holds its top note through the full tank.',
          href: '/catalogue/terpenes/blue-dream',
        },
        {
          category: 'Oil',
          name: 'Live resin fill',
          copy: 'Cold-cured base filled on our line, 4% loading.',
          href: '/quote-builder',
        },
      ],
      volumeTiers: [
        { units: 1000, perUnit: 4.35, leadTime: '3 weeks', isDefault: false },
        { units: 5000, perUnit: 3.95, leadTime: '3–4 weeks', isDefault: true },
        { units: 25000, perUnit: 3.6, leadTime: '4–5 weeks', isDefault: false },
        { units: 100000, perUnit: 3.28, leadTime: '6–7 weeks', isDefault: false },
      ],
      colourways: [
        { label: 'Matte black', hex: '#1b1b1b', isDefault: true },
        { label: 'Bone', hex: '#e9e7e3', isDefault: false },
      ],
      benchResults: [
        { label: 'Tank emptied', value: '98.2%', barPct: 98.2, tone: 'violet' },
        { label: 'Clog rate', value: '0.4%', barPct: 8, tone: 'ember' },
      ],
    }
    expect(hardwareProduct.parse(hardware)).toEqual(hardware)
  })

  it('parses the terpene detail (1e) with size tiers and composition', () => {
    const terpenes = {
      kind: 'terpenes',
      sku: 'TRP-BLD-CT',
      name: 'Blue Dream',
      categoryEyebrow: 'Terpenes',
      intro: 'Cultivar-true botanical blend.',
      legalNote: 'Legal note.',
      specs: [{ label: 'Strain', value: 'Blue Dream' }],
      certifications: [
        { title: 'GC/MS profile', caption: 'Compliant', href: '/certs/gcms' },
      ],
      pairsWith: [
        {
          category: 'Hardware',
          name: 'SSL All-in-One 2g',
          copy: 'Ceramic core holds the berry top note through the full tank.',
          href: '/catalogue/hardware/all-in-one-2g',
        },
      ],
      sizeTiers: [
        {
          label: '10 mL sample',
          pricePerMl: 1.9,
          packLabel: '1 bottle',
          leadTime: '3–5 days',
          isDefault: false,
        },
        {
          label: '100 mL',
          pricePerMl: 0.94,
          packLabel: '$94.00',
          leadTime: '1 week',
          isDefault: false,
        },
        {
          label: '1 L',
          pricePerMl: 0.62,
          packLabel: '$620.00',
          leadTime: '1–2 weeks',
          isDefault: true,
        },
        {
          label: '5 L drum',
          pricePerMl: 0.48,
          packLabel: '$2,400.00',
          leadTime: '2–3 weeks',
          isDefault: false,
        },
      ],
      composition: [
        { compound: 'Myrcene', pct: 38.4, tone: 'violet' },
        { compound: 'α-Pinene', pct: 19.1, tone: 'azure' },
        { compound: 'β-Caryophyllene', pct: 14.6, tone: 'violet-light' },
        { compound: 'Limonene', pct: 11.2, tone: 'ember' },
        { compound: 'Linalool', pct: 7.8, tone: 'blush' },
        { compound: 'Terpinolene', pct: 5.3, tone: 'faded' },
      ],
      compositionNote:
        'The remaining 3.6% is minor terpenes below the 1% reporting threshold. ' +
        'Variance held within ±2% per compound.',
    }
    expect(terpeneProduct.parse(terpenes)).toEqual(terpenes)
  })

  it('parses the packaging detail (1h) with run sizes, print methods and preflight', () => {
    const packaging = {
      kind: 'packaging',
      sku: 'PKG-BOX-04',
      name: 'CR Box 04',
      categoryEyebrow: 'Packaging',
      intro: 'Child-resistant folding carton.',
      legalNote: 'Legal note.',
      specs: [{ label: 'Style', value: 'CR box' }],
      certifications: [
        { title: 'Child-resistant', caption: 'CR-123', href: '/certs/cr' },
      ],
      pairsWith: [
        {
          category: 'Hardware',
          name: 'All-in-One 2g',
          copy: 'The device this tray was moulded around.',
          href: '/catalogue/hardware/all-in-one-2g',
        },
      ],
      runTiers: [
        { units: 5000, perBox: 0.62, leadTime: '3 weeks', isDefault: false },
        { units: 10000, perBox: 0.55, leadTime: '3–4 weeks', isDefault: true },
        { units: 50000, perBox: 0.44, leadTime: '4–5 weeks', isDefault: false },
        { units: 200000, perBox: 0.36, leadTime: '6 weeks', isDefault: false },
      ],
      printMethods: [
        {
          name: '4-colour litho',
          note: 'CMYK, matte varnish',
          delta: 0,
          included: true,
        },
        {
          name: 'Litho + spot Pantone',
          note: 'Two spots, soft-touch laminate',
          delta: 0.09,
          included: false,
        },
        {
          name: 'Foil + emboss',
          note: 'One foil pass, blind emboss',
          delta: 0.21,
          included: false,
        },
      ],
      preflight: [
        {
          check: 'Bleed and safe area',
          detail: '3 mm bleed present on all panels',
          status: 'pass',
        },
        {
          check: 'State warning panel',
          detail: 'CA panel is 6.4 pt — 8 pt minimum',
          status: 'fix',
        },
      ],
    }
    expect(packagingProduct.parse(packaging)).toEqual(packaging)
  })
})

describe('domain / quote builder', () => {
  it('parses the four groups and volume selector from 1c', () => {
    const config = {
      volumes: [
        { units: 1000, label: '1,000', isDefault: false },
        { units: 5000, label: '5,000', isDefault: true },
        { units: 25000, label: '25,000', isDefault: false },
        { units: 100000, label: '100,000+', isDefault: false },
      ],
      groups: [
        {
          key: 'hardware',
          numeral: '01',
          title: 'Hardware',
          hint: 'Filled by us',
          defaultOptionKey: 'aio-2g',
          options: [
            {
              key: 'aio-2g',
              name: 'All-in-one 2g',
              tag: 'AIO',
              note: 'Ceramic core, rechargeable',
              unitPrice: 4.35,
            },
            {
              key: 'cart-510-1g',
              name: '510 cart 1g',
              tag: '510',
              note: 'Glass body, ceramic core',
              unitPrice: 1.35,
            },
            {
              key: 'pod-2g',
              name: 'Pod system 2g',
              tag: 'Pod',
              note: 'Mesh coil, magnetic',
              unitPrice: 5.1,
            },
          ],
        },
        {
          key: 'oil',
          numeral: '02',
          title: 'Oil',
          hint: 'Yours or ours',
          defaultOptionKey: 'distillate',
          options: [
            {
              key: 'client-oil',
              name: 'Send us your oil',
              tag: 'Client',
              note: 'Blend + fill service only',
              unitPrice: 0.85,
            },
            {
              key: 'distillate',
              name: 'Distillate',
              tag: 'Ours',
              note: 'Lab-tested, 88%+',
              unitPrice: 3.2,
            },
            {
              key: 'live-resin',
              name: 'Live resin',
              tag: 'Ours',
              note: 'Cold-cured, cultivar-true',
              unitPrice: 6.4,
            },
          ],
        },
        {
          key: 'terpenes',
          numeral: '03',
          title: 'Terpenes',
          hint: '5% loading',
          defaultOptionKey: 'botanical',
          options: [
            {
              key: 'none',
              name: 'No terpenes',
              tag: '—',
              note: 'Straight fill',
              unitPrice: 0,
            },
            {
              key: 'botanical',
              name: 'Botanical blend',
              tag: 'Botanical',
              note: '12 profiles in stock',
              unitPrice: 0.35,
            },
            {
              key: 'cultivar',
              name: 'Cultivar-true',
              tag: 'Cultivar',
              note: 'Steam-distilled, single source',
              unitPrice: 0.9,
            },
          ],
        },
        {
          key: 'packaging',
          numeral: '04',
          title: 'Packaging',
          hint: 'Child-resistant',
          defaultOptionKey: 'cr-box',
          options: [
            {
              key: 'bulk',
              name: 'Bulk, unbranded',
              tag: 'Bulk',
              note: 'Bagged, 100 per case',
              unitPrice: 0,
            },
            {
              key: 'cr-box',
              name: 'CR box + label',
              tag: 'Print',
              note: '4-colour, your artwork',
              unitPrice: 0.55,
            },
            {
              key: 'identity',
              name: 'Identity + box',
              tag: 'Design',
              note: 'We design the brand',
              unitPrice: 1.1,
            },
          ],
        },
      ],
    }
    expect(quoteConfig.parse(config)).toEqual(config)
  })

  it('validates a selection and the estimate the server returns', () => {
    const selection = {
      hardware: 'aio-2g',
      oil: 'distillate',
      terpenes: 'botanical',
      packaging: 'cr-box',
      volume: 5000,
    }
    expect(quoteSelection.parse(selection)).toEqual(selection)

    const estimate = {
      unitPrice: 7.77,
      total: 38870,
      lineItems: [
        { label: 'Hardware', name: 'All-in-one 2g', amount: 4.0 },
        { label: 'Oil', name: 'Distillate', amount: 2.94 },
        { label: 'Terpenes', name: 'Botanical blend', amount: 0.32 },
        { label: 'Packaging', name: 'CR box + label', amount: 0.51 },
      ],
      discountLine: '−8%',
      leadTime: '2–3 weeks',
    }
    expect(quoteEstimate.parse(estimate)).toEqual(estimate)
  })
})
