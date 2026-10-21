import 'server-only'

/** Never serialize exceptions: their properties can include bindings or bodies. */
export function safeError(error: unknown): { name: string; message: string } {
  if (!(error instanceof Error)) return { name: 'Error', message: 'Unknown failure' }
  const clean = (value: string) =>
    value
      .replace(/[\r\n\t]/g, ' ')
      .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
      .replace(/https?:\/\/\S+/gi, '[url]')
      .replace(/[\w.+-]+@[\w.-]+/g, '[email]')
      .replace(
        /\b(token|password|secret|authorization)\s*[:=]\s*\S+/gi,
        '$1=[redacted]',
      )
      .slice(0, 200)
  return { name: clean(error.name), message: clean(error.message) }
}
