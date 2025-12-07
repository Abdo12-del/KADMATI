import type { Knex } from 'knex';
import { env } from '../config/env';

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './backend/db/database.db',
    },
    useNullAsDefault: true,
    migrations: {
      directory: './backend/db/migrations',
    },
    seeds: {
      directory: './backend/db/seeds',
    },
  },
  production: {
    client: 'sqlite3',
    connection: {
      filename: './backend/db/database.db', // Use a more robust solution for production
    },
    useNullAsDefault: true,
    migrations: {
      directory: './backend/db/migrations',
    },
  },
};

export default config;