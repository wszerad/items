import { defineConfig } from 'vite-plus'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts']
  },
  pack: {
    entry: {
      index: 'src/index.ts'
    },
    outDir: 'dist',
    format: ['esm'],
    fixedExtension: false,
    dts: true,
    sourcemap: true,
    clean: true
  },
  fmt: {
    semi: false,
    singleQuote: true,
    tabWidth: 2,
    printWidth: 120,
    arrowParens: 'avoid',
    endOfLine: 'lf',
    trailingComma: 'none'
  },
  lint: {
    env: {
      es2022: true,
      node: true
    },
    plugins: ['typescript'],
    rules: {
      'eslint/no-unused-vars': 'error',
      'typescript/no-explicit-any': 'warn'
    }
  }
})
