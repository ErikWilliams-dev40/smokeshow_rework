import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { imageMetadata } from '../../services/blog-api/src/images'

describe('bounded media metadata inspection', () => {
  it.each([
    ['public/brand/ss-logo.png', 'image/png'],
    ['public/brand/ss-logo-450.webp', 'image/webp'],
    ['public/brand/house-of-helix-vertical-light.jpg', 'image/jpeg'],
  ])('accepts the real %s image and rejects truncated headers', (filename, mime) => {
    const bytes = readFileSync(filename)
    expect(imageMetadata(bytes, mime)).toMatchObject({ mime })
    expect(imageMetadata(bytes, mime).width).toBeGreaterThan(0)
    expect(() => imageMetadata(bytes.subarray(0, 16), mime)).toThrow()
  })
  it('reads bounded AVIF ispe boxes and rejects malformed box lengths and missing dimensions', () => {
    function box(name: string, content: Buffer) {
      const header = Buffer.alloc(8)
      header.writeUInt32BE(content.length + 8)
      header.write(name, 4, 4, 'ascii')
      return Buffer.concat([header, content])
    }
    const dimensions = Buffer.alloc(12)
    dimensions.writeUInt32BE(640, 4)
    dimensions.writeUInt32BE(480, 8)
    const ftyp = box('ftyp', Buffer.from('avif\0\0\0\0avif', 'ascii'))
    const meta = box(
      'meta',
      Buffer.concat([
        Buffer.alloc(4),
        box('iprp', box('ipco', box('ispe', dimensions))),
      ]),
    )
    expect(imageMetadata(Buffer.concat([ftyp, meta]), 'image/avif')).toMatchObject({
      width: 640,
      height: 480,
    })
    expect(() => imageMetadata(ftyp, 'image/avif')).toThrow()
    meta.writeUInt32BE(0xffffffff, 0)
    expect(() => imageMetadata(Buffer.concat([ftyp, meta]), 'image/avif')).toThrow()
  })
})
