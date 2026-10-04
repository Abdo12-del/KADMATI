import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['tests/open-slide/entry.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: '.tmp-verify/open-slide-test.mjs',
  logLevel: 'warning',
  define: { 'import.meta.env': '{"VITE_AUROVA_API_URL":""}' },
  plugins: [
    {
      name: 'raw-open-slide-runtime',
      setup(build) {
        build.onResolve({ filter: /openSlideRuntime\.tsx\?raw$/ }, (args) => ({
          path: resolve(args.resolveDir, args.path.replace(/\?raw$/, '')),
          namespace: 'open-slide-runtime',
        }))
        build.onLoad({ filter: /.*/, namespace: 'open-slide-runtime' }, async (args) => ({
          contents: await readFile(args.path, 'utf8'),
          loader: 'text',
        }))
      },
    },
  ],
})
console.log('bundled -> .tmp-verify/open-slide-test.mjs')
