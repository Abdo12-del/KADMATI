const path = require('path');
// require('dotenv').config({ path: path.resolve(__dirname, '../../.env') }); // Load .env from project root - REMOVED

/** @type {import('knex').Knex.Config} */
const config = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: process.env.DATABASE_URL || path.resolve(__dirname, 'database.db'), // Use DATABASE_URL from .env or default
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.resolve(__dirname, 'migrations'),
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: path.resolve(__dirname, 'seeds'),
    },
  },
  production: {
    client: 'sqlite3',
    connection: {
      filename: process.env.DATABASE_URL || path.resolve(__dirname, 'database.db'), // Use DATABASE_URL from .env or default
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.resolve(__dirname, 'migrations'),
      tableName: 'knex_migrations',
    },
  },
};

module.exports = config;