import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url'; // Import fileURLToPath

// Get the current file's directory name in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  DATABASE_URL: process.env.DATABASE_URL || 'sqlite://./backend/db/database.db',
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
};