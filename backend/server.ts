import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import knexConfig from './db/knexfile.cjs';
import knex from 'knex';
import { errorHandler } from './utils/errorHandler';
import usersRoutes from './api/users';
import servicesRoutes from './api/services';

// Global error handlers for better debugging
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
  process.exit(1); // Exit with a failure code
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Application specific logging, throwing an error, or other logic here
  process.exit(1); // Exit with a failure code
});

// Initialize Knex
console.log('NODE_ENV:', env.NODE_ENV);
const currentKnexConfig = knexConfig[env.NODE_ENV || 'development'];
console.log('Knex config for current environment:', currentKnexConfig);

// Check if the configuration is valid before initializing Knex
if (!currentKnexConfig) {
  console.error('Error: Knex configuration not found for environment:', env.NODE_ENV || 'development');
  process.exit(1);
}

const db = knex(currentKnexConfig);
console.log('Knex DB initialized successfully.');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Backend API is running!');
});

// API Routes
app.use('/api/users', usersRoutes);
app.use('/api/services', servicesRoutes);

// Global error handler middleware
app.use(errorHandler);

// Export db instance for use in other modules
export { db };

// Start the server
app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});