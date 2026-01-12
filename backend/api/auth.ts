import { Router } from 'express';
import { userService } from '../services/userService';
import { successResponse, errorResponse as _errorResponse } from '../utils/response';
import { ApiError } from '../utils/errorHandler';

const router = Router();

// User login
router.post('/login', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] POST /api/auth/login - Request received. Body:`, req.body);
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      console.log(`[${new Date().toISOString()}] POST /api/auth/login - Validation failed: Email and password are required.`);
      throw new ApiError('Email and password are required', 400);
    }

    const user = await userService.getUserByEmailWithPassword(email);
    if (!user) {
      console.log(`[${new Date().toISOString()}] POST /api/auth/login - User not found for email: ${email}`);
      throw new ApiError('Invalid credentials', 401);
    }
    console.log(`[${new Date().toISOString()}] POST /api/auth/login - User found: ${user.email}`);

    // const isPasswordValid = await bcrypt.compare(password, user.password || ''); // Temporarily commented out
    const isPasswordValid = (password === user.password); // Compare plain text password for simulation
    if (!isPasswordValid) {
      console.log(`[${new Date().toISOString()}] POST /api/auth/login - Invalid password for user: ${email}`);
      throw new ApiError('Invalid credentials', 401);
    }
    console.log(`[${new Date().toISOString()}] POST /api/auth/login - Password is valid for user: ${email}`);

    const { password: _, ...userWithoutPassword } = user;
    successResponse(res, 'Login successful', userWithoutPassword);
    console.log(`[${new Date().toISOString()}] POST /api/auth/login - Login successful for user: ${email}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] POST /api/auth/login - Error:`, error);
    next(error);
  }
});

export default router;