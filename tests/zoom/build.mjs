/** esbuild bundler for the zoom-navigation tests — bundles the TS under test for Node. */
import esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['tests/zoom/entry.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: '.tmp-verify/zoom-test.mjs',
  logLevel: 'warning',
})
console.log('bundled -> .tmp-verify/zoom-test.mjs')
