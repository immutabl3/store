import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import gzipPlugin from 'rollup-plugin-gzip';

export default {
  input: './src/index.js',
  output: {
    file: 'dist/bundle.min.js',
    format: 'cjs',
  },
  plugins: [
    resolve(),
    commonjs(),
    terser({
      toplevel: true,
      module: true,
      mangle: {
        toplevel: true,
        properties: true,
      },
      nameCache: {},
    }),
    gzipPlugin(),
  ],
};