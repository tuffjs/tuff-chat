const port = process.env.PORT || 8080;

// Format: postgres://user:password@server:5432/database
const DATABASE_URL = process.env.DATABASE_URL;

const Promise = require('bluebird');
const pgp = require('pg-promise')({ promiseLib: Promise });
const sql = pgp(DATABASE_URL);

const server = require('http')
  .createServer(
    (request, response) => {
      sql.one(`SELECT 1`, req.body)
        .then(one => {
          response.end(`Hello from Heroku!<br/>SQL SELECT 1 returned ${ one }`);
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

