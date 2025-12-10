import { Router } from 'express';
import { userService } from '../services/userService';
import { successResponse, errorResponse } from '../utils/response';
import { ApiError } from '../utils/errorHandler';
// import bcrypt from 'bcryptjs'; // Temporarily commented out

const router = Router();

// User login
router.post('/login', async (req, res, next) => {
  try {
    console.log("1. Received POST /api/auth/login request. Body:", req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError('Email and password are required', 400);
    }
    console.log("2. Email and password present.");

    const user = await userService.getUserByEmailWithPassword(email);
    if (!user) {
      throw new ApiError('Invalid credentials', 401);
    }
    console.log("3. User found by email.");

    // const isPasswordValid = await bcrypt.compare(password, user.password || ''); // Temporarily commented out
    const isPasswordValid = (password === user.password); // Compare plain text password for simulation
    if (!isPasswordValid) {
      throw new ApiError('Invalid credentials', 401);
    }
    console.log("4. Password is valid (plain text comparison).");

    const { password: _, ...userWithoutPassword } = user;
    successResponse(res, 'Login successful', userWithoutPassword);
    console.log("5. Login success response sent.");
  } catch (error) {
    console.error("Error in POST /api/auth/login:", error);
    next(error);
  }
});

export default router;