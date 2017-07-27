const port = process.env.PORT || 8080;

// Format: postgres://user:password@server:5432/database
const DATABASE_URL = process.env.DATABASE_URL;

const Promise = require('bluebird');

// Compiling browser-side assets
var assetsCompiler = require('./lib/assets-compiler');
assetsCompiler.onComplete( function logBundlingComplete () {
  console.log('Browser-side assets bundled successfully.');
});

// SQL queries

const pgp = require('pg-promise')({ promiseLib: Promise });
const sql = pgp(DATABASE_URL);


// Database Migrations

const knex = require('knex')({
  client: 'pg',
  connection: DATABASE_URL,
  searchPath: 'knex,public'
});

knex.migrate.latest()
  .then(() => {
    console.log('DB migrations applied successfully');
  })
  .done();


// Password Hashing test
const securePassword = require('secure-password');
const argon2 = securePassword();

const password = 'password';


// Awful implementation actually wastes a lot of bytes here,
// see https://github.com/sodium-friends/sodium-native/blob/master/deps/libsodium/src/libsodium/crypto_pwhash/argon2/argon2-encoding.c
// on exact format. It's not binary buffer, it's a text string, and it uses base64 encoding and versioning:
// $argon2i$v=19$m=32768,t=4,p=1$ajOVD5Qz7UarwBDO5XjAFg$cFkekt1gE6Kn7iXD9xK9FEiYYaR5E5XNJv3H0sGXwqQ
// v - version. Defined as ARGON2_VERSION_NUMBER at https://github.com/P-H-C/phc-winner-argon2/blob/master/include/argon2.h
// m = m_cost - memory cost
// t = t_cost - time cost
// p = lanes - degree of parallelism
// SALT
// HASH
// End of it has padding with zeroes up to 128 bytes.
// We can store it in the following ways:
//   1) as is, 128 bytes in a BYTEA type field
//   2) with zeroes stripped, in a TEXT field because it is text, 96 characters
//   3) parse it, but we should support upgraded OS which may have different algorithm with version > 19,
//     and I'm not sure about whether results are different if parameters m, t, and p are different.
//     This option lets to store just 48 bytes.
// Using option (1) looks like technical waste, because it's super simple to strip the buffer finding the terminating zeroes.
// So, we can compare (2) and (3): approx. 96 bytes (variable +- few bytes because of Base64)
//   vs 48 bytes, but losing version and parameters.
// If we upgrade it in the future, we can use the same field for different formats.
// 96 - 48 = 48. The waste for 1,000,000 users will be 48 megabytes. That's nothing. Trying to optimize that may break
// compatibility, wastes processing power on decoding and encoding Base64 each time additionally
// (the library Argon2 does that internally too), so we decided just to strip the string.
argon2.hash(Buffer.from(password, 'utf8'), (err, hash) => {
  if (err) throw err;

  const strHash = hash.toString('ascii', 0, hash.indexOf(0));

  var terms = strHash.split('$');
  var realHash = terms[5];
  var realSalt = terms[4];

  var decodedHash = Buffer.alloc(securePassword.HASH_BYTES, 0);
  decodedHash.write(strHash, 0, strHash.length, 'ascii');

  argon2.verify(Buffer.from(password, 'utf8'), decodedHash, (err, result) => {
    if (err) throw err;
    if (result === securePassword.VALID) {
      console.log('Tested Argon2 Password Hashing Algorithm. Hash size is', hash.length, 'should be crypto_pwhash_argon2i_STRBYTES =', securePassword.HASH_BYTES, strHash, realHash, realSalt,
        Buffer.from(realHash, 'base64').toString('hex'),
        Buffer.from(realSalt, 'base64').toString('hex')
      );
    } else {
      throw 'Argon2 Password Hashing Algorithm test failed. Result is ' + result;
    }
  });
});


// HTTP Server

const path = require('path');
const fs = require('fs');
const workingDir = process.cwd();

const hostedFiles = {
        // file path, type, cache time, cache tag
  '/': [ 'index.html', 'text/html', 0, null ],
  '/index.js': [ '/index.js', 'application/javascript; charset=UTF-8', 3, null ],
  '/index.js.map': [ '/index.js.map', 'application/json; charset=UTF-8', 3, null ],
  '/index.css': [ '/index.css', 'text/css; charset=UTF-8', 3, null ],
};

const hostAFile = (req, res) => {

  const file = hostedFiles[req.url];
  if (!file) {
    res.writeHead(404);
    return res.end();
  }
  
  const fileName = file[0];

  const fullPath = path.join(workingDir, '/public/' + fileName);
  console.log('Serving file', fullPath);
  
  try {
    const rstream = fs.createReadStream(fullPath);
    res.writeHead(200,
      Object.assign({},
        { 'Content-Type': file[1],
          'Cache-Control': file[2] ? 'public, max-age=' + file[2] : 'max-age=0',
        },
        file[3] ? { 'ETag': file[3] } : {}
      )
    );
    rstream.pipe(res);
  } catch (e) {
    console.log('Standard resource file not found!', e);
    res.writeHead(404);
    return res.end();
  }
}

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
  .listen(port,
    err => {  
      if (err) {
        return console.log(`Port ${ port } is occupied`, err);
      }

      console.log(`Listening on port ${ port }`);
    }
  );

