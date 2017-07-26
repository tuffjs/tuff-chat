const port = process.env.PORT || 8080;

// Format: postgres://user:password@server:5432/database
const DATABASE_URL = process.env.DATABASE_URL;

const Promise = require('bluebird');

// SQL queries

const pgp = require('pg-promise')({ promiseLib: Promise });
const sql = pgp(DATABASE_URL);


// Database Migrations

const knex = require('knex')({
  client: 'pg',
  connection: DATABASE_URL,
  searchPath: 'knex,public'
});

/*
Not running yet. Need exact format for Argon2 hash.
knex.migrate.latest()
  .then(() => {
    console.log('DB migrations applied successfully');
  })
  .done();
*/

// Password Hashing

const argon2 = require('argon2');
const rand = require('csprng');

const password = 'password';
const salt = rand(128, 36);
const passwordWithSalt = password + salt;
argon2.hash(passwordWithSalt, {
  type: argon2.argon2i,
  raw: true,
}).then(hash => {
  argon2.verify(hash, passwordWithSalt).then(match => {
    if (match) {
      console.log('Tested Argon2 Password Hashing Algorithm. Hash size is', hash.length);
    } else {
      throw 'Argon2 Password Hashing Algorithm test failed';
    }
  });
});


// HTTP Server

const server = require('http')
  .createServer(
    (req, res) => {
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

