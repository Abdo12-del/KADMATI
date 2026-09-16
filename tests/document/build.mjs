/** esbuild bundler for the document-model tests — bundles the TS under test for Node. */
import esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['tests/document/entry.ts'],
  bundle: true,
  platform: 'neutral',
  format: 'esm',
  outfile: '.tmp-verify/document-test.mjs',
  logLevel: 'warning',
})
console.log('bundled -> .tmp-verify/document-test.mjs')
