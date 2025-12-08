import { Router } from 'express';
import { userService } from '../services/userService';
import { successResponse, errorResponse } from '../utils/response';
import { ApiError } from '../utils/errorHandler';
import bcrypt from 'bcryptjs';

const router = Router();

// User login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError('Email and password are required', 400);
    }

    const user = await userService.getUserByEmailWithPassword(email); // Need a service method that returns password
    if (!user) {
      throw new ApiError('Invalid credentials', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password || '');
    if (!isPasswordValid) {
      throw new ApiError('Invalid credentials', 401);
    }

    // Remove password before sending response
    const { password: _, ...userWithoutPassword } = user;
    successResponse(res, 'Login successful', userWithoutPassword);
  } catch (error) {
    next(error);
  }
});

export default router;