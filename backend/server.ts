import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import knexConfig from './db/knexfile.cjs'; // Updated to .cjs
import knex from 'knex';
import { errorHandler } from './utils/errorHandler';
import usersRoutes from './api/users';
import servicesRoutes from './api/services';

// Initialize Knex
const db = knex(knexConfig[env.NODE_ENV || 'development']);

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