import path from 'path'
import nodeExternals from 'webpack-node-externals'

const config = {
  target: 'node',
  externals: [nodeExternals()],
  entry: {
    index: './src/glip_socket.js'
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'commonjs2'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['env', {
                'targets': {
                  'node': 4.2
                }
              }]
            ]
          }
        }
      }
    ]
  }
}

export default [config]
