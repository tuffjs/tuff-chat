var webpack = require('webpack');
var path = require('path');

var debug = true;

// returns a Compiler instance
var compiler = webpack({
  devtool: 'source-map',
  entry: './client/client.js',
  output: {
    path: path.resolve(__dirname, '../public'),
    filename: 'index.js',
  },
  plugins: [
    new webpack.DefinePlugin({
        'API_SERVER_URL': '"' + 'https://tuff-chat.herokuapp.com' + '"',
        'process.env': { 
          NODE_ENV: JSON.stringify('production')
        },
      }),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.AggressiveMergingPlugin(),
    debug ? {apply: function (){}} : new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compress: {
        sequences: true,
        dead_code: true,
        conditionals: true,
        booleans: true,
        unused: true,
        if_return: true,
        join_vars: true,
        drop_console: true
      },
      mangle: {
        except: ['$super', '$', 'exports', 'require']
      },
      output: {
        comments: false
      }
    })
  ],
});

var onCompleteCallback = function () {};

var compilerCallbacks = {
  onComplete: function assignOnCompleteCallback (callback) {
    onCompleteCallback = callback;
  }
};

compiler.watch({
  aggregateTimeout: 300, // wait so long for more changes
  poll: false,
}, function(err, stats) {

  if (err) {
    console.error('Webpack Bundling error:', err);
  } else {
    if (stats.compilation.errors && stats.compilation.errors.length) {
      console.error('Webpack Bundling errors:', stats.compilation.errors);
    } else {
      onCompleteCallback();
    }
  }
});

module.exports = compilerCallbacks;
