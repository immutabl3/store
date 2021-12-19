import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import gzipPlugin from 'rollup-plugin-gzip';

export default {
  input: './src/index.js',
  output: {
    file: 'dist/bundle.min.cjs',
    format: 'cjs',
  },
  plugins: [
    resolve(),
    commonjs(),
    terser({
      toplevel: true,
      module: true,
      nameCache: {},
    }),
    gzipPlugin(),
  ],
};