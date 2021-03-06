// Every start, if it started from nodemon,
// should increase server API major version number,
// to force client reload.
// When deployed in production,
// The version number should come from git commit.
// Server version used to make sure that
// if server was rebooted, or client disconnected,
// they will communicate consistently.

const PORT = process.env.PORT || 8080;

const Promise = require('bluebird');
// const CircularJSON = require('circular-json');


// Compiling browser-side assets
// 1. Normalize existing css. Replace surrounding single quotes
//    with double quotes.
// var 

var cssMinifer = require('./lib/css-minifier');

var assetsCompiler = require('./lib/assets-compiler');

let lastClientCodeHash = null;
let indexJsFile = null;
let indexJsMapFile = null;

let afterFirstCompileCallback = null;

assetsCompiler.onComplete((jsBundleFile, mapFile, hash, stats) => {

  var firstNotify = (!lastClientCodeHash && afterFirstCompileCallback);

  lastClientCodeHash = hash;

  // Replace hash in bundled file:
  // Search for assignment window.JAVASCRIPT_BUNDLE_HASH = 'REPLACE_WEBPACK_HASH';

  var hashPos = jsBundleFile.indexOf('REPLACE_WEBPACK_HASH');
  if (hashPos === -1) {
    console.log(new Date().valueOf(),
      `Browser-side assets reported that bundled successfully but found no hash. Skipping.
       Add window.JAVASCRIPT_BUNDLE_HASH = 'REPLACE_WEBPACK_HASH' at the most beginning of main entry`,
      hash);
    console.log(jsBundleFile.length);
    return;
  }
  jsBundleFile.write(hash, hashPos, 20);

  indexJsFile = jsBundleFile;
  indexJsMapFile = mapFile;

  // console.log(JSON.parse(indexJsMapFile));

  console.log(new Date().valueOf(),
    'Browser-side assets bundled successfully.',
    hash);

  if (firstNotify) {
    afterFirstCompileCallback();
  }

  try {
    wss.sendAll(JSON.stringify({ debug: { reload: true, hash } }));
    // wss.sendAll(JSON.stringify(
    //   { debug: { file: jsBundleFile.toString('base64'), hash } }));
  } catch (e) {
  }

});

assetsCompiler.onError(errors => {
  console.error('Webpack Bundling errors:', errors);
  errors = errors.map(error => error.message);
  try {
    wss.sendAll(JSON.stringify({ debug: { errors } }));
  } catch (e) {
    console.log(e);
  }
});


// SQL queries

// Format: postgres://user:password@server:5432/database
const DATABASE_URL = process.env.DATABASE_URL;

const pgp = require('pg-promise')({ promiseLib: Promise });
const sql = pgp(DATABASE_URL);


// Database Migrations
const dbMigrate = require('./lib/db-migrate')(DATABASE_URL); 

// Hashing passwords
const pwdHash = require('./lib/pwd-hash');


// HTTP Server

const hostedFiles = {
  // file path,
  // type, cache time, cache tag
  '/': [ 'index.html',
    'text/html', 0, null ],

  '/index.js': [ function () { return indexJsFile; },
    'application/javascript; charset=UTF-8', 3, null ],

  '/index.js.map': [ function () { return indexJsMapFile; },
    'application/json; charset=UTF-8', 3, null ],

  '/layout_grid.gif': [ '/layout_grid.gif',
    'image/gif', 3, null ],

  '/index.css': [ '/index.css',
    'text/css; charset=UTF-8', 3, null ],
};

const hostAFile = require('./lib/host-a-file')(hostedFiles);


const server = require('http')
  .createServer(
    (req, res) => {
      if (hostedFiles[req.url]) {
        return hostAFile(req, res);
      } else {
        // TODO: check browser-side route and return index.html
      }

      sql.one(`SELECT 1`)
        .then(one => {
          res.end(`Hello from Heroku!<br/>SQL SELECT 1 returned ${ one }`);
        });
    }
  )
  .listen(PORT,
    err => {  
      if (err) {
        return console.log(`Port ${ PORT } is occupied`, err);
      }

      console.log(`Listening on port ${ PORT }`);
    }
  );

const uuid = require('uuid/v4');
const serverRunId = uuid();

const WebSocket = require('ws');

const wss = new WebSocket.Server({ server });
const clientAddress = require('./lib/client-address');


// Implement sessions to send "bundle recompiled"
// to all debugged clients.
// Implement custom url debug mode enablers
// or another way to activate debug mode
// to support even first errors logging.

wss.sendAll = function sendAll (data) {
  this.clients.forEach(function (client) {
    try {
      client.send(data);
    } catch (e) {
    }
  });
};

function sendAfterCompileFinished (ws, addr) {
  if (lastClientCodeHash) {
    try {
      ws.send(JSON.stringify({
        client: addr,
        srvRunId: serverRunId,
        cltCodeHash: lastClientCodeHash
      }));
    } catch (e) {
      return;
    }
  } else {
    afterFirstCompileCallback = function () {
      sendAfterCompileFinished(ws, addr);
    };
  }
}

wss.on('connection', (ws, req) => {

  const addr = clientAddress(req);
  console.log(
    new Date().valueOf(),
    addr.ip + ':' + addr.port,
    'A WebSocket client connected');

  sendAfterCompileFinished(ws);



  ws.on('message', message => {
    let data = null;
    try {
      if (message.length) {
        data = JSON.parse(message);
      } else {
        data = '';
      }
    } catch (e) {
      console.log(e);
      return;
    }
    if (typeof data === 'string' &&
      data.length === 0) {
        
      // Keepalive packet
      /* console.log(
        new Date().valueOf(),
        addr.ip + ':' + addr.port,
        'HEARTBEAT'); */

      ws.send('');
    } else if (data) {

      if (data.debug) {
        if (data.debug.message &&
            data.debug.message[4] &&
            typeof(data.debug.message[4]) == 'object' &&
            data.debug.message[4].line &&
            data.debug.message[4].column) {

          var SourceMapConsumer = require('source-map')
            .SourceMapConsumer;
          var smc = new SourceMapConsumer(
            JSON.parse(indexJsMapFile));

          // { source: 'http://example.com/www/js/two.js',
          //   line: 2,
          //   column: 10,
          //   name: 'n' }
          var pos = smc.originalPositionFor({
            line: data.debug.message[4].line,
            column: data.debug.message[4].column
          });
            
          console.log(data.debug.time,
            addr.ip + ':' + addr.port,
            data.debug.message[0],
            '"' + pos.name + '" at line ' + pos.line +
            ' col ' + pos.column + ' in ' +
            pos.source);   

        } else {
          const args =
            [// data.debug.time,
             // addr.ip + ':' + addr.port
            ]
            .concat(data.debug.message);
            
          console.log.apply(console, args);
        }
      }
    }
  });
});


