import path from 'node:path'
import ts from 'typescript'

/** Inspect syntax, not source regexes (comments and strings aren't imports). */
export function boundaryViolations(filename: string, source: string): string[] {
  const file = ts.createSourceFile(
    filename,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const normalized = filename.replaceAll('\\', '/')
  const isClient = file.statements.some(
    (node) =>
      ts.isExpressionStatement(node) &&
      ts.isStringLiteral(node.expression) &&
      node.expression.text === 'use client',
  )
  const restricted = isClient || normalized.startsWith('src/components/')
  const violations: string[] = []
  function check(specifier: string) {
    if (
      specifier === 'cloudflare:workers' &&
      normalized !== 'src/server/cloudflare/env.ts'
    ) {
      violations.push('Cloudflare bindings must be imported through env.ts')
    }
    const resolved = specifier.startsWith('@/')
      ? `src/${specifier.slice(2)}`
      : specifier.startsWith('.')
        ? path.posix.normalize(
            path.posix.join(path.posix.dirname(normalized), specifier),
          )
        : specifier
    if (
      restricted &&
      (resolved === 'src/server' || resolved.startsWith('src/server/'))
    ) {
      violations.push(`Server import in component/client: ${specifier}`)
    }
  }
  function visit(node: ts.Node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    )
      check(node.moduleSpecifier.text)
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === 'require'))
    ) {
      const arg = node.arguments[0]
      if (arg && (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)))
        check(arg.text)
    }
    if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference) &&
      node.moduleReference.expression &&
      ts.isStringLiteral(node.moduleReference.expression)
    )
      check(node.moduleReference.expression.text)
    ts.forEachChild(node, visit)
  }
  visit(file)
  return violations
}
