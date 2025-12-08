import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler } from './utils/errorHandler';
import usersRoutes from './api/users';
import servicesRoutes from './api/services';
import requestsRoutes from './api/requests';
import ratingsRoutes from './api/ratings';
import messagesRoutes from './api/messages';
import authRoutes from './api/auth'; // New import for auth routes

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
app.use('/api/requests', requestsRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/auth', authRoutes); // New route for authentication

// Global error handler middleware
app.use(errorHandler);

// Start the server
app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});