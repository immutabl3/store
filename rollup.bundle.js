import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import minify from 'rollup-plugin-babel-minify';
import gzipPlugin from 'rollup-plugin-gzip';

export default {
  input: './store.js',
  output: {
    file: 'dist/bundle.min.js',
    format: 'cjs',
  },
  plugins: [
    resolve(),
    commonjs(),
    minify({
      comments: false,
      sourceMap: false,
    }),
    gzipPlugin(),
  ],
};