import { defineConfig } from 'vite'
import { builtinModules } from 'node:module'

export default defineConfig({
  build: {
    target: 'node22',
    outDir: 'dist/cli',
    lib: { entry: 'src/cli.ts', formats: ['es'], fileName: () => 'blog.mjs' },
    rolldownOptions: {
      external: [
        ...builtinModules,
        ...builtinModules.map((name) => `node:${name}`),
        'zod',
      ],
    },
  },
})
