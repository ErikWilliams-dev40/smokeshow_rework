// Product-detail fixtures.
//
// The three detail data sets from design_handoff_wholesale_b2b (1g, 1e, 1h),
// parsed by the productDetail union. One component, three data sets. Copy is
// transcribed from the handoff; only the hardware page has a "Make it yours"
// decoration band, so addOns is optional and omitted for terpenes/packaging.
import { z } from 'zod'

import { productDetail } from '../domain'

export const productDetails = z.array(productDetail).parse([
  {
    kind: 'hardware',
    sku: 'AIO-2000-C',
    name: 'SSL All-in-One 2g',
    categoryEyebrow: 'Hardware · all-in-one',
    intro:
      'A 2 mL rechargeable with a 1.2Ω ceramic core, tuned for live resin and heavy distillate. Draw-activated, USB-C, wickless.',
    legalNote:
      'Samples ship free to registered accounts. Sold empty; filling quoted separately.',
    specs: [
      { label: 'Tank', value: '2.0 mL, borosilicate glass, centre post' },
      { label: 'Heating', value: '1.2Ω porous ceramic, wickless' },
      { label: 'Battery', value: '400 mAh Li-po, USB-C, 500 cycles' },
      { label: 'Airflow', value: 'Draw-activated, 1.1 mm dual intake' },
      { label: 'MOQ', value: '1,000 units per colourway' },
      { label: 'Lead time', value: 'From the volume tier — add 1 week if we fill' },
    ],
    secondarySpecs: [
      { label: 'Warranty', value: 'DOA replacement, 12 months from ship' },
      { label: 'State filings', value: 'CA, CO, MI, NV registration on file' },
      { label: 'Traceability', value: 'Batch code lasered on the base' },
    ],
    certifications: [
      {
        title: 'Heavy metal migration',
        caption: 'PDF · non-detect at 30 days',
        href: '#1g',
      },
      {
        title: 'UN38.3 battery transport',
        caption: 'PDF · air freight cleared',
        href: '#1g',
      },
      { title: 'CE / RoHS declaration', caption: 'PDF · rev. 2026-03', href: '#1g' },
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
        href: '#1e',
      },
      {
        category: 'Oil',
        name: 'Live resin fill',
        copy: 'Cold-cured base filled on our line, 4% loading.',
        href: '#1c',
      },
      {
        category: 'Hardware',
        name: 'All-in-One 1g',
        copy: 'Same core and shell in a half-size tank.',
        href: '#1b',
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
      { label: 'Ultraviolet', hex: '#5f4b8b', isDefault: false },
      { label: 'Ember', hex: '#f48120', isDefault: false },
    ],
    benchResults: [
      { label: 'Tank emptied', value: '98.2%', barPct: 98, tone: 'violet' },
      { label: 'Charge retention', value: '94%', barPct: 94, tone: 'azure' },
      { label: 'Terpene retained', value: '91%', barPct: 91, tone: 'violet-light' },
      { label: 'Clog rate', value: '0.4%', barPct: 8, tone: 'ember' },
      { label: 'Leak at pressure', value: '0.2%', barPct: 4, tone: 'faded' },
    ],
  },
  {
    kind: 'terpenes',
    sku: 'TRP-BLD-CT',
    name: 'Blue Dream',
    categoryEyebrow: 'Terpenes · cultivar-true',
    intro:
      'Single-source Blue Dream, reconstructed to the live plant’s ratios. Sweet berry over soft pine — holds its top notes at a 5% load.',
    legalNote:
      'Samples ship free to registered wholesale accounts. Research and manufacturing use only.',
    specs: [
      { label: 'Format', value: 'Neat liquid, amber glass or HDPE drum' },
      { label: 'Terpene load', value: '3–6% by weight, 5% recommended' },
      { label: 'Viscosity', value: '12 cP at 25°C — no thinner required' },
      { label: 'Composition', value: '100% botanically derived, no PG/VG/MCT' },
      { label: 'Lead time', value: 'From order confirmation — see size tier' },
    ],
    secondarySpecs: [
      { label: 'Pesticides', value: 'Non-detect, CA Phase III panel' },
      { label: 'Heavy metals', value: 'Non-detect (Pb, As, Cd, Hg)' },
      { label: 'Diluents', value: 'None added' },
    ],
    certifications: [
      {
        title: 'Certificate of analysis',
        caption: 'PDF · batch 26-0418 · 2 Sep 2026',
        href: '#1e',
      },
      { title: 'Safety data sheet', caption: 'PDF · GHS rev. 4', href: '#1e' },
      {
        title: 'Allergen & residual solvent',
        caption: 'PDF · non-detect',
        href: '#1e',
      },
    ],
    pairsWith: [
      {
        category: 'Hardware',
        name: 'SSL All-in-One 2g',
        copy: 'Ceramic core holds the berry top note through the full tank.',
        href: '#1b',
      },
      {
        category: 'Oil',
        name: 'Live resin fill',
        copy: 'Cold-cured base, cultivar-matched at 4% loading.',
        href: '#1c',
      },
      {
        category: 'Terpenes',
        name: 'Strawberry Cough',
        copy: 'Brighter, sharper berry — same distillation process.',
        href: '#1e',
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
      'The remaining 3.6% is minor terpenes below the 1% reporting threshold. Variance held within ±2% per compound.',
  },
  {
    kind: 'packaging',
    sku: 'PKG-BOX-04',
    name: 'CR Box 04',
    categoryEyebrow: 'Packaging · child-resistant',
    intro:
      'A certified push-tab carton for one all-in-one or 510 cart. 350 gsm board, soy inks, no plastic insert.',
    legalNote: 'Blanks ship free. Printed proofs $180, credited against the first run.',
    specs: [
      { label: 'Board', value: '350 gsm FSC SBS, 30% post-consumer' },
      { label: 'Interior', value: 'Moulded pulp tray, no PET clamshell' },
      { label: 'Size', value: '104 × 42 × 22 mm, fits AIO 2g and 510' },
      { label: 'Case pack', value: '100 per case, 24 cases per pallet layer' },
      { label: 'MOQ', value: '5,000 per artwork' },
      { label: 'Lead time', value: 'From artwork approval — see run size' },
    ],
    secondarySpecs: [
      { label: 'State panels', value: 'CA, CO, MI warning copy pre-set' },
      { label: 'Variable data', value: 'Batch, THC%, QR — inkjet at fill' },
      { label: 'Recyclability', value: 'Curbside, no separation required' },
    ],
    certifications: [
      { title: 'CR certification', caption: 'PDF · 16 CFR 1700.20, F=1', href: '#1h' },
      { title: 'FSC chain of custody', caption: 'PDF · mill + converter', href: '#1h' },
      {
        title: 'Prop 65 & ink safety',
        caption: 'PDF · low-migration inks',
        href: '#1h',
      },
    ],
    pairsWith: [
      {
        category: 'Hardware',
        name: 'All-in-One 2g',
        copy: 'The device this tray was moulded around.',
        href: '#1g',
      },
      {
        category: 'Packaging',
        name: 'Pre-roll tube',
        copy: 'CR pop-top in the same board and ink set.',
        href: '#1b',
      },
      {
        category: 'Service',
        name: 'Identity design',
        copy: 'We draw the brand and set the dieline for you.',
        href: '#1c',
      },
    ],
    runTiers: [
      { units: 5000, perBox: 0.62, leadTime: '3 weeks', isDefault: false },
      { units: 10000, perBox: 0.55, leadTime: '3–4 weeks', isDefault: true },
      { units: 50000, perBox: 0.44, leadTime: '4–5 weeks', isDefault: false },
      { units: 200000, perBox: 0.36, leadTime: '6 weeks', isDefault: false },
    ],
    printMethods: [
      { name: '4-colour litho', note: 'CMYK, matte varnish', delta: 0, included: true },
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
      { check: 'Resolution', detail: 'All raster art above 300 dpi', status: 'pass' },
      {
        check: 'State warning panel',
        detail: 'CA panel is 6.4 pt — 8 pt minimum',
        status: 'fix',
      },
      {
        check: 'Ink coverage',
        detail: 'Max 284% — within press limit',
        status: 'pass',
      },
      {
        check: 'Spot colours',
        detail: '3 spots supplied, 2 included in this method',
        status: 'fix',
      },
    ],
  },
])
