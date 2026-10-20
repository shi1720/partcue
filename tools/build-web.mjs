import { build } from 'esbuild';
await build({ entryPoints: ['web/app.js'], bundle: true, outfile: 'web/app.bundle.js', platform: 'browser', format: 'esm', target: ['es2020'], minify: true, sourcemap: false, legalComments: 'eof', logLevel: 'info' });
