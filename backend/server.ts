import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { setupDatabase } from './db';
import userRoutes from './api/users';
import serviceRoutes from './api/services';
import conversationRoutes from './api/conversations';
import messageRoutes from './api/messages';
import requestRoutes from './api/requests';
import orderRoutes from './api/orders'; // New
import notificationRoutes from './api/notifications'; // New
import calendarRoutes from './api/calendar'; // New
import ratingRoutes from './api/ratings'; // New

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // To parse JSON request bodies

// Setup database
setupDatabase();

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/orders', orderRoutes); // New
app.use('/api/notifications', notificationRoutes); // New
app.use('/api/calendar', calendarRoutes); // New
app.use('/api/ratings', ratingRoutes); // New

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Service Platform Backend is running!');
});

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});