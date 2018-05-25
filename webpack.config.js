var path = require('path')
var webpack = require('webpack')
module.exports = {
    devtool: 'source-map',
    devServer: {
        historyApiFallback: true
    },
    entry: [
      'babel-polyfill',
      './client/js/index.jsx'
    ],
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'bundle.js',
          publicPath: '/'
    },
    plugins: [
      new webpack.NoEmitOnErrorsPlugin(),
      new webpack.ProvidePlugin({
                  $: "jquery",
                  jQuery: "jquery"
              })
],
    module: {
        rules: [
          {
        enforce: 'pre',
        test: /\.js$/,
        exclude: /(node_modules)/,
        include: /client/,
        use: 'eslint-loader'
      },
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: [{loader:'babel-loader',
                options: { "presets": ["es2015", "react", "stage-3"], compact : false }
              }]
            }, {
      test: /\.s?css$/,
      use: ['style-loader', 'css-loader', 'sass-loader'],
      }
    ]
	}
}
