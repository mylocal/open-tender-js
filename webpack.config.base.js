const path = require('path')

module.exports = {
  entry: path.resolve(__dirname, 'src/index.js'),
  output: {
    globalObject: 'this',
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
    library: 'OpenTenderJS',
    libraryTarget: 'umd',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
    ],
  },
  // externals: {
  //   'date-fns': 'date-fns',
  //   'date-fns-tz': 'date-fns-tz',
  // },
}
