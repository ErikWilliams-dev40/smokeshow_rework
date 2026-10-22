# Worker mobile laboratory measurements

Measured 2026-10-22 against the built local Worker. Three fresh-browser samples
per route: Chromium, 390×844, device scale 1, CPU slowdown 4×, 150 ms latency,
200,000 B/s download, cache disabled, normal motion, intro already seen. Homepage
and signup have the consent cookie. Medians follow; these are laboratory results,
not production field Core Web Vitals or a Lighthouse score. Local asset encoding,
network/cache behavior and hardware differ from a deployed edge.

| Route | LCP baseline → final | CLS baseline → final | Resource body bytes baseline → final |
| --- | --- | --- | --- |
| gate | 480 → 596 ms | 0.0166 → 0.0000 | 850,138 → 609,099 B |
| homepage | 2232 → 1044 ms | 0.0004 → 0.0000 | 1,089,425 → 848,306 B |
| blog | 912 → 988 ms | 0.0000 → 0.0000 | 1,122,026 → 881,761 B |
| overview | 484 → 552 ms | 0.0523 → 0.0000 | 1,074,645 → 834,380 B |
| signup | 608 → 732 ms | 0.1219 → 0.0000 | 1,097,238 → 856,119 B |

Changes based on measurement:

- Preload the existing local Jost font. Trace evidence showed fallback heading
  wrapping moving the signup introduction/form by about 84px when the font arrived.
- Replace the supplied 2,400px PNG only in the visible wordmark with responsive
  450px/900px WebP derivatives, encoded losslessly after resizing. The 900px asset
  covers the largest 440px display at 2×. Preserve the original for metadata and
  source artwork. The measured 1× viewport selects 43,364 bytes rather than
  284,895 bytes. Above-fold wordmarks request high fetch priority.
- Keep the no-JavaScript form message inside `noscript`, avoiding its removal on
  hydration. Retain disabled pre-hydration submission protection.
- Wrap the expanded blog legal-navigation row at narrow widths.

All final samples had no horizontal overflow. The complete browser suite covers
keyboard focus, both themes, reduced motion, consent and 320px layouts. No shader
change was justified by these loading measurements; existing off-screen/hidden/
reduced-motion WebGL controls remain. These samples do not measure interaction
latency under real user traffic. The blog uses local approved fixtures for this lab;
repeat with representative live articles/media on staging before launch.

Reproduce after a local migration/build and starting Worker preview:

```sh
PLAYWRIGHT_BASE_URL=http://localhost:4173 node scripts/measure-launch.mjs /tmp/performance.json
```

Raw baseline and final samples are preserved in `performance-results.json`.
Repeat on production after release and use field data when available.
