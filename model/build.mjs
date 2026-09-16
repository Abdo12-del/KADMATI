/** Bundle + run the dataset builder with esbuild (the app sources use Vite-style imports). */
import esbuild from 'esbuild'
import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'

mkdirSync('.tmp-verify', { recursive: true })
await esbuild.build({
  entryPoints: ['model/build-dataset.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: '.tmp-verify/build-dataset.mjs',
  external: ['pdfjs-dist', 'tesseract.js', 'pptxgenjs', 'jszip', 'animejs', 'react', 'react-dom', 'zustand'],
  loader: { '.css': 'empty', '.svg': 'dataurl', '.woff2': 'dataurl' },
  plugins: [
    {
      name: 'vite-url-shim',
      setup(build) {
        build.onResolve({ filter: /\?url$/ }, (args) => ({ path: args.path, namespace: 'vite-url' }))
        build.onLoad({ filter: /.*/, namespace: 'vite-url' }, (args) => ({ contents: `export default ${JSON.stringify('data:,' + args.path)}`, loader: 'js' }))
      },
    },
  ],
  define: { 'import.meta.env.VITE_AUROVA_API_URL': 'undefined', 'import.meta.env': '{}' },
})
const r = spawnSync(process.execPath, ['.tmp-verify/build-dataset.mjs'], { stdio: 'inherit' })
process.exit(r.status ?? 1)
