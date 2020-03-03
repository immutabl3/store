const path = require('path');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    store: {
      import: './src/index.js',
      dependOn: ['err', 'consts', 'types', 'utils'],
    },
    debug: {
      import: './src/debug/index.js',
      dependOn: ['consts', 'types'],
    },
    react: {
      import: './src/debug/index.js',
      dependOn: ['err', 'types', 'utils'],
    },
    types: {
      import: './src/types.js',
      dependOn: ['consts'],
    },
    utils: {
      import: './src/utils/index.js',
      dependOn: ['consts', 'types'],
    },
    consts: './src/consts.js',
    err: './src/StoreError.js',
  },
  externals: {
    react: 'react',
  },
  output: {
    library: 'store',
    libraryTarget: 'umd',
    globalObject: 'this',
    filename: '[name].js',
    chunkFilename: '[name].js',
    publicPath: 'dist/',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: [
            ['@babel/preset-env', {
              targets: {
                edge: '40',
                firefox: '68',
                chrome: '79',
                safari: '13',
                node: '13',
              },
              loose: true,
            }]
          ],
        },
      },
    ]
  },
};