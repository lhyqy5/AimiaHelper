const webpack = require("webpack");
const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = env => {

  let config = {
    entry: {
      //aimia: path.join(__dirname, 'src/aimia_helper.ts'),
      popup: path.join(__dirname, 'src/popup.tsx'),
      content_script: path.join(__dirname, 'src/content_script.ts'),
      background: path.join(__dirname, 'src/background.ts'),
      vendor: ['jquery', 'react', 'react-dom', 'redux', 'react-redux']
    },
    output: {
      path: path.join(__dirname, 'dist/js'),
      filename: '[name].js'
    },
    module: {
      loaders: [{
        exclude: /node_modules/,
        test: /\.tsx?$/,
        loader: 'ts-loader'
      }, ]
    },

    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
    },
    plugins: [

      // pack common vender files
      new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor',
        minChunks: Infinity
      }),

      // exclude locale files in moment
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    ]
  }

  if (env === "production") {
    config.plugins = [
      ...config.plugins,
      // minify
      new UglifyJsPlugin({
        uglifyOptions: {
          ie8: false,
          ecma: 6
        }
      })
      ,new webpack.DefinePlugin({ NODE_ENV: JSON.stringify('production') })
    ]
  } else {
    config.devtool = 'source-map';
  }
  return config;
}
