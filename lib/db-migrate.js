module.exports = databaseUrl => {

  const knex = require('knex')({
    client: 'pg',
    connection: databaseUrl,
    searchPath: 'knex,public'
  });

  knex.migrate.latest()
    .then(() => {
      console.log('DB migrations applied successfully');
    })
    .done();
};

