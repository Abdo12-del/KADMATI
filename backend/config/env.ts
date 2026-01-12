import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file located at the project root.
// process.cwd() returns the current working directory, which is the project root
// when `npm run start:backend` is executed.
dotenv.config({ path: path.join(process.cwd(), '.env') });

export const env = {
  DATABASE_URL: process.env.DATABASE_URL || 'sqlite://./backend/db/database.db',
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
};