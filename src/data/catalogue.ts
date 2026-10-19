// Catalogue fixtures.
//
// The seven hardware seed rows from design_handoff_wholesale_b2b (1b), parsed
// by the catalogue schema. The header claims 18 models; the prototype seeds 7.
// Stock state is decorative in the handoff — wire it to real inventory later.
import { z } from 'zod'

import { catalogueProduct } from '../domain'

export const catalogueProducts = z.array(catalogueProduct).parse([
  {
    sku: 'AIO-2000-C',
    name: 'SSL All-in-One 2g',
    format: 'all-in-one',
    core: 'Ceramic, 1.2Ω',
    capacity: '2.0 mL',
    moq: 1000,
    stock: 'in-stock',
    tierPrices: { '1k': 4.35, '5k': 3.95, '25k': 3.6 },
  },
  {
    sku: 'AIO-1000-C',
    name: 'SSL All-in-One 1g',
    format: 'all-in-one',
    core: 'Ceramic, 1.2Ω',
    capacity: '1.0 mL',
    moq: 1000,
    stock: 'in-stock',
    tierPrices: { '1k': 3.8, '5k': 3.45, '25k': 3.1 },
  },
  {
    sku: 'C510-G-100',
    name: 'Cart 510 · Glass',
    format: '510-cart',
    core: 'Ceramic, 1.6Ω',
    capacity: '1.0 mL',
    moq: 2000,
    stock: 'in-stock',
    tierPrices: { '1k': 1.35, '5k': 1.15, '25k': 0.98 },
  },
  {
    sku: 'C510-Q-100',
    name: 'Cart 510 · Quartz',
    format: '510-cart',
    core: 'Quartz rod',
    capacity: '1.0 mL',
    moq: 2000,
    stock: 'in-stock',
    tierPrices: { '1k': 1.6, '5k': 1.38, '25k': 1.2 },
  },
  {
    sku: 'POD-2000-M',
    name: 'Pod System · 2g',
    format: 'pod',
    core: 'Mesh, 1.0Ω',
    capacity: '2.0 mL',
    moq: 2500,
    stock: 'in-stock',
    tierPrices: { '1k': 5.1, '5k': 4.6, '25k': 4.15 },
  },
  {
    sku: 'BAT-510-V3',
    name: 'Battery · 510 Vari',
    format: 'battery',
    core: '350 mAh',
    capacity: null,
    moq: 1000,
    stock: 'lead-time',
    tierPrices: { '1k': 2.2, '5k': 1.95, '25k': 1.7 },
  },
  {
    sku: 'PKG-TUB-01',
    name: 'Infused Pre-Roll Tube',
    format: 'packaging',
    core: 'CR pop-top',
    capacity: null,
    moq: 5000,
    stock: 'lead-time',
    tierPrices: { '1k': 0.42, '5k': 0.36, '25k': 0.3 },
  },
])
