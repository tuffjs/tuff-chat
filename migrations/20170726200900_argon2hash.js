exports.up = function(knex, Promise) {
  return Promise.all([
    knex.raw(`ALTER TABLE "user" DROP COLUMN salt;`),
    knex.raw(`ALTER TABLE "user" ALTER COLUMN hash TYPE TEXT;`),
  ]);
}

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.raw(`ALTER TABLE "user" ADD COLUMN salt BYTEA NOT NULL;`),
    knex.raw(`ALTER TABLE "user" ALTER COLUMN hash TYPE BYTEA;`),
  ]) ;
};

