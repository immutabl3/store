module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    store: './src/index.js',
    debug: './src/debug/index.js',
    react: './src/react/index.js',
  },
  output: {
    library: 'store',
    libraryTarget: 'umd',
    globalObject: 'this',
    path: process.cwd(),
    filename({ chunk }) {
      const { name } = chunk;
      return `${name}.js`;
    },
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