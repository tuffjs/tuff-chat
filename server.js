const port = process.env.PORT || 8080;

const server = require('http')
  .createServer(
    (request, response) => {
      response.end('Hello from Heroku!');
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

