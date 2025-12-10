import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler } from './utils/errorHandler';
// import usersRoutes from './api/users'; // Commented out
// import servicesRoutes from './api/services'; // Commented out
// import requestsRoutes from './api/requests'; // Commented out
// import ratingsRoutes from './api/ratings'; // Commented out
// import messagesRoutes from './api/messages'; // Commented out
// import authRoutes from './api/auth'; // Commented out

// Global error handlers for better debugging
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
  // process.exit(1); // Comment out exit for now to keep server running for more debugging
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Application specific logging, throwing an error, or other logic here
  // process.exit(1); // Comment out exit for now to keep server running for more debugging
});

const app = express();

// Add a simple logging middleware to see if requests reach Express
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Middleware
app.use(cors());
app.use(express.json());

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Backend API is running!');
});

// API Routes - Temporarily commented out for debugging
// app.use('/api/users', usersRoutes);
// app.use('/api/services', servicesRoutes);
// app.use('/api/requests', requestsRoutes);
// app.use('/api/ratings', ratingsRoutes);
// app.use('/api/messages', messagesRoutes);
// app.use('/api/auth', authRoutes);

// Global error handler middleware
app.use(errorHandler);

// Start the server
app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});