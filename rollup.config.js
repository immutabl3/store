import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  input: {
    store: './src/index.js',
    debug: 'src/debug/index.js',
    react: 'src/react/index.js',
    StoreError: './src/StoreError.js',
    consts: './src/consts.js',
    types: './src/types.js',
    utils: './src/utils/index.js',
  },
  output: {
    chunkFileNames: '[name].js',
    entryFileNames: '[name].js',
    dir: 'dist',
    format: 'cjs',
    sourcemap: true,
  },
  external: [
    'react',
  ],
  plugins: [
    resolve(),
    commonjs(),
  ],
};