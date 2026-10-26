import { HttpError } from './http'

const invalid = () =>
  new HttpError(422, 'invalid_image', 'Invalid or unsupported image metadata')
/** Bounded header inspection only: never decode untrusted pixel data. */
export function imageMetadata(bytes: Uint8Array, mime: string) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const ascii = (start: number, count: number) =>
    String.fromCharCode(...bytes.subarray(start, start + count))
  let width = 0,
    height = 0
  try {
    if (mime === 'image/png') {
      if (
        ![137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v) ||
        ascii(12, 4) !== 'IHDR' ||
        view.getUint32(8) !== 13 ||
        bytes.length < 33
      )
        throw invalid()
      width = view.getUint32(16)
      height = view.getUint32(20)
    } else if (mime === 'image/jpeg') {
      if (bytes[0] !== 255 || bytes[1] !== 216) throw invalid()
      let i = 2
      while (i < bytes.length) {
        if (bytes[i++] !== 255) throw invalid()
        while (bytes[i] === 255) i++
        const marker = bytes[i++]!
        if (marker === 0xda || marker === 0xd9) break
        if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue
        const length = view.getUint16(i)
        if (length < 2 || i + length > bytes.length) throw invalid()
        if (
          [
            0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce,
            0xcf,
          ].includes(marker)
        ) {
          if (length < 8) throw invalid()
          height = view.getUint16(i + 3)
          width = view.getUint16(i + 5)
          break
        }
        i += length
      }
    } else if (mime === 'image/webp') {
      if (
        ascii(0, 4) !== 'RIFF' ||
        ascii(8, 4) !== 'WEBP' ||
        view.getUint32(4, true) + 8 !== bytes.length
      )
        throw invalid()
      const tag = ascii(12, 4),
        size = view.getUint32(16, true)
      if (20 + size > bytes.length) throw invalid()
      const uint24 = (i: number) =>
        bytes[i]! + (bytes[i + 1]! << 8) + (bytes[i + 2]! << 16)
      if (tag === 'VP8X' && size >= 10) {
        width = 1 + uint24(24)
        height = 1 + uint24(27)
      } else if (tag === 'VP8 ' && size >= 10 && ascii(23, 3) === '\x9d\x01\x2a') {
        width = view.getUint16(26, true) & 0x3fff
        height = view.getUint16(28, true) & 0x3fff
      } else if (tag === 'VP8L' && size >= 5 && bytes[20] === 0x2f) {
        const packed = view.getUint32(21, true)
        width = (packed & 0x3fff) + 1
        height = ((packed >>> 14) & 0x3fff) + 1
      } else throw invalid()
    } else if (mime === 'image/avif') {
      const ftypSize = view.getUint32(0)
      if (
        ascii(4, 4) !== 'ftyp' ||
        ftypSize < 16 ||
        ftypSize > bytes.length ||
        ftypSize > 4096
      )
        throw invalid()
      const brands = [ascii(8, 4)]
      for (let i = 16; i + 4 <= ftypSize; i += 4) brands.push(ascii(i, 4))
      if (!brands.some((brand) => ['avif', 'avis'].includes(brand))) throw invalid()
      // ispe lives under meta/iprp/ipco. Reject contradictory dimensions rather
      // than guessing which image property an unsupported container uses.
      function boxes(start: number, end: number, depth: number) {
        if (depth > 5) throw invalid()
        for (let i = start; i < end;) {
          if (end - i < 8) throw invalid()
          const size = view.getUint32(i),
            tag = ascii(i + 4, 4)
          if (size < 8 || i + size > end) throw invalid()
          if (tag === 'ispe') {
            if (size !== 20) throw invalid()
            const w = view.getUint32(i + 12),
              h = view.getUint32(i + 16)
            if (width && (width !== w || height !== h)) throw invalid()
            width = w
            height = h
          } else if (['meta', 'iprp', 'ipco'].includes(tag))
            boxes(i + (tag === 'meta' ? 12 : 8), i + size, depth + 1)
          i += size
        }
      }
      boxes(ftypSize, bytes.length, 0)
    } else
      throw new HttpError(415, 'unsupported_type', 'Expected JPEG, PNG, WebP or AVIF')
  } catch (error) {
    if (error instanceof HttpError) throw error
    throw invalid()
  }
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1 ||
    width > 32768 ||
    height > 32768 ||
    width * height > 100_000_000
  )
    throw invalid()
  return { width, height, mime }
}
