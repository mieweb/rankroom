const path = require('path');

module.exports = {
  entry: './src/rankroom-widget.js',
  output: {
    filename: 'rankroom-widget.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'RankRoomWidget',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  externals: {
    'socket.io-client': 'io'
  }
};