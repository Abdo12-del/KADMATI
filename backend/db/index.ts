import Knex from 'knex';
import knexConfig from './knexfile';
import { env } from '../config/env';

const knex = Knex(knexConfig[env.NODE_ENV]);

export const setupDatabase = async () => {
  try {
    await knex.migrate.latest();
    console.log('Database migrations ran successfully.');
  } catch (error) {
    console.error('Error running database migrations:', error);
    process.exit(1);
  }
};

export default knex;