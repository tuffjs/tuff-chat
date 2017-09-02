var webpack = require('webpack');
var path = require('path');
const MemoryFileSystem = require('memory-fs');

var debug = true;

var webpackConfig = {

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
};

// returns a Compiler instance
var compiler = webpack(webpackConfig);

compiler.outputFileSystem = new MemoryFileSystem();

var onCompleteCallback = function () {};
var onErrorCallback = function () {};

var compilerCallbacks = {
  onComplete: function assignOnCompleteCallback (callback) {
    onCompleteCallback = callback;
  },

  onError: function assignOnErrorCallback (callback) {
    onErrorCallback = callback;
  }
};

// Webpack startup recompilation fix. Remove when @sokra fixes the bug.
// https://github.com/webpack/webpack/issues/2983
// https://github.com/webpack/watchpack/issues/25
const timefix = 11000;
compiler.plugin('watch-run', (watching, callback) => {
  watching.startTime += timefix;
  callback()
});
compiler.plugin('done', (stats) => {
  stats.startTime -= timefix
})

compiler.watch({
  aggregateTimeout: 300, // wait so long for more changes
  poll: false,
}, function(err, stats) {

  if (err) {
    onErrorCallback(err);
    // console.error('Webpack Bundling error:', err);
  } else {
    if (stats.compilation.errors && stats.compilation.errors.length) {
      onErrorCallback(stats.compilation.errors);
      // console.error('Webpack Bundling errors:', stats.compilation.errors);
      
    } else {

      var file = compiler.outputFileSystem.readFileSync(
        webpackConfig.output.path + '/' + webpackConfig.output.filename);

      var map = compiler.outputFileSystem.readFileSync(
        webpackConfig.output.path + '/' + webpackConfig.output.filename +
        '.map');
   
      onCompleteCallback(file, map, stats.hash, stats);
    }
  }
});

module.exports = compilerCallbacks;

