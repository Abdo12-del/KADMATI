const path = require('path');
const { env } = require('../config/env'); // Import env for production config

/** @type {import('knex').Knex.Config} */
const config = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: path.resolve(__dirname, 'database.db'), // Ensure correct path to database.db
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
      filename: path.resolve(__dirname, 'database.db'), // Ensure correct path to database.db
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.resolve(__dirname, 'migrations'),
      tableName: 'knex_migrations',
    },
  },
};

module.exports = config;