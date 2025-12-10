import { Router } from 'express';
import { userService } from '../services/userService';
import { successResponse, errorResponse } from '../utils/response';
import { ApiError } from '../utils/errorHandler';
import { validateUser } from '../utils/validator';
import bcrypt from 'bcryptjs'; // For password hashing

const router = Router();

// Get all users
router.get('/', async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    successResponse(res, 'Users retrieved successfully', users);
  } catch (error) {
    next(new ApiError('Failed to retrieve users', 500, error));
  }
});

// Get user by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(Number(id));
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    successResponse(res, 'User retrieved successfully', user);
  } catch (error) {
    next(error);
  }
});

// Create a new user
router.post('/', async (req, res, next) => {
  try {
    console.log("1. Received POST /api/users request. Body:", req.body);
    const validationErrors = validateUser(req.body);
    console.log("2. Validation errors:", validationErrors);

    if (validationErrors.length > 0) {
      console.error('Validation failed for user creation with errors:', validationErrors);
      // Return specific validation errors directly in the response
      return errorResponse(res, 'Validation failed', 400, validationErrors);
    }

    console.log("3. Validation passed.");
    const { name, email, password, role, phone, bio, avatar_url, provider_type, id_number, address } = req.body; // Destructure all potential fields

    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      throw new ApiError('User with this email already exists', 409);
    }
    console.log("4. User does not exist.");

    if (!password) {
      throw new ApiError('Password is required', 400, ['Password is required.']);
    }
    console.log("5. Password is present. Hashing password...");

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("6. Password hashed successfully.");

    const newUser = await userService.createUser({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      bio,
      avatar_url,
      provider_type, // Pass provider-specific fields
      id_number,     // Pass provider-specific fields
      address,       // Pass provider-specific fields
    });
    console.log("7. User created successfully in service.");

    // Remove password before sending response
    const { password: _, ...userWithoutPassword } = newUser;
    successResponse(res, 'User created successfully', userWithoutPassword, 201);
    console.log("8. Success response sent.");
  } catch (error) {
    console.error("Error in POST /api/users:", error); // Log error before passing to next
    next(error);
  }
});

// Update a user
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    console.log('Received user update request body:', req.body);
    const validationErrors = validateUser(updates, true);
    console.log('Validation errors from validateUser (update):', validationErrors);

    if (validationErrors.length > 0) {
      console.error('Validation failed for user update with errors:', validationErrors);
      // Return specific validation errors directly in the response
      return errorResponse(res, 'Validation failed', 400, validationErrors);
    }

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const updatedUser = await userService.updateUser(Number(id), updates);
    if (!updatedUser) {
      throw new ApiError('User not found', 404);
    }

    // Remove password before sending response
    const { password: _, ...userWithoutPassword } = updatedUser;
    successResponse(res, 'User updated successfully', userWithoutPassword);
  } catch (error) {
    next(error);
  }
});

// Delete a user
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await userService.deleteUser(Number(id));
    if (!deleted) {
      throw new ApiError('User not found', 404);
    }
    successResponse(res, 'User deleted successfully', null, 204);
  } catch (error) {
    next(error);
  }
});

export default router;