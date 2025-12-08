import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import knexConfig from './db/knexfile';
import knex from 'knex';
import { errorHandler } from './utils/errorHandler'; // Import the error handler
import usersRoutes from './api/users'; // Import user routes

// Initialize Knex
const db = knex(knexConfig[env.NODE_ENV || 'development']);

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // To parse JSON request bodies

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Backend API is running!');
});

// API Routes
app.use('/api/users', usersRoutes); // Use user routes

// Global error handler middleware
app.use(errorHandler);

// Export db instance for use in other modules
export { db };

// Start the server
app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});