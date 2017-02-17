module.exports = {
  target: 'node',
  entry: {
    'index': './src/glip_socket.js'
  },
  output: {
    path: './src',
    filename: '[name].bundle.js',
    libraryTarget: 'commonjs2'
  },
  externals: ['ws'],
  module: {
    noParse: [/ws/],
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: [
            ['env', {
              'targets': {
                'node': 4.2
              }
            }]
          ]
        }
      }
    ]
  }
}
