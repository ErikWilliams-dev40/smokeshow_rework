// Quote-builder fixtures.
//
// The four option groups, their per-unit base prices, and the volume selector
// from design_handoff_wholesale_b2b (1c). Base prices are data; the discount
// map and the arithmetic stay server-side in src/server/pricing/.
import { quoteConfig } from '../domain'

export const quote = quoteConfig.parse({
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
})
