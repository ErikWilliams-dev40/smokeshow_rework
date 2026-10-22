import js from '@eslint/js'
import next from 'eslint-config-next'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      '.next/**',
      // Cloudflare build output, generated Worker types and local state.
      '.cloudflare/**',
      '.vinext/**',
      '.wrangler/**',
      'dist/**',
      'node_modules/**',
      'next-env.d.ts',
      // Reference material from the design handoff: a prototype built on a
      // bespoke template runtime, deliberately not part of the build.
      'design_handoff_wholesale_b2b/**',
      'design_handoff_smoke_signals_blog/**',
      'smokeshow-dev-handoff/**',
    ],
  },

  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/server/cloudflare/env.ts'],
    rules: { 'no-restricted-imports': ['error', { paths: ['cloudflare:workers'] }] },
  },
  {
    files: ['src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: ['cloudflare:workers', '@/server'],
          patterns: ['@/server/**', '**/server/**'],
        },
      ],
    },
  },
  js.configs.recommended,
  ...next,

  // Type-aware linting, TypeScript sources only. The rules below need a type
  // checker, so they cannot apply to the config files at the repo root — hence
  // the explicit `files` scope and the parser override (eslint-config-next
  // installs its own parser, which does not forward project information).
  {
    files: ['src/**/*.ts', 'src/**/*.tsx', 'tests/**/*.ts'],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
)
