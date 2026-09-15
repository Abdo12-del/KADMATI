/** esbuild bundler for the pipeline test — shims Vite's `?url` imports for Node. */
import esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['tests/pdf/pipeline.test.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: '.tmp-verify/pdf-test.mjs',
  external: ['pdfjs-dist', 'tesseract.js', 'pdfjs-dist/legacy/build/pdf.mjs'],
  plugins: [
    {
      name: 'vite-url-shim',
      setup(build) {
        build.onResolve({ filter: /\?url$/ }, (args) => ({ path: args.path, namespace: 'vite-url' }))
        build.onLoad({ filter: /.*/, namespace: 'vite-url' }, (args) => ({
          contents: `export default ${JSON.stringify('data:,' + args.path)}`,
          loader: 'js',
        }))
      },
    },
  ],
})
console.log('bundled -> .tmp-verify/pdf-test.mjs')
