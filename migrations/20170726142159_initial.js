exports.up = function(knex, Promise) {
  return Promise.all([
    knex.raw(
      `CREATE TABLE user (
         id UUID PRIMARY KEY NOT NULL,
         email TEXT NOT NULL,
         hash TEXT NOT NULL,
         salt TEXT NOT NULL,
       );`
    ),
  ]);
}

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.raw('DROP TABLE user;'),
  ]) ;
};

