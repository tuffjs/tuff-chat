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


// Compiling browser-side assets
var assetsCompiler = require('./lib/assets-compiler');
assetsCompiler.onComplete(() => {
  console.log('Browser-side assets bundled successfully.');
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
  '/index.js': [ '/index.js',
    'application/javascript; charset=UTF-8', 3, null ],
  '/index.js.map': [ '/index.js.map',
    'application/json; charset=UTF-8', 3, null ],
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




const WebSocket = require('ws');

const wss = new WebSocket.Server({ server });
const clientAddress = require('./lib/client-address');

let wsSend = m => {};

// Implement sessions to send "bundle recompiled"
// to all debugged clients.
// Implement custom url debug mode enablers
// or another way to activate debug mode
// to support even first errors logging.

wss.on('connection', (ws, req) => {

  const addr = clientAddress(req);
  console.log(
    new Date().valueOf(),
    addr.ip + ':' + addr.port,
    'A WebSocket client connected');

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
      console.log(
        new Date().valueOf(),
        addr.ip + ':' + addr.port,
        'HEARTBEAT');

      ws.send('');
    } else if (data) {

      if (data.debug) {
        // var SourceMapConsumer = require('source-map')
        //   .SourceMapConsumer;
        // var sourceMapFile = // check version of client!
        // var smc = new SourceMapConsumer(sourceMapFile);
        // add smc.originalPositionFor(
        // line, column) ->
        // { source, line, column, name }
        const args =
          [ data.debug.time,
            addr.ip + ':' + addr.port
          ]
          .concat(data.debug.message);
            
        console.log.apply(console, args);
      }
     /* try {
        ws.send(JSON.stringify({}));
      } catch (e) {
        return;
      }*/
    }
  });
});


