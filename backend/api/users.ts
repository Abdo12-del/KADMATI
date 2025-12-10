import { Router } from 'express';
import { userService } from '../services/userService';
import { successResponse, errorResponse } from '../utils/response';
import { ApiError } from '../utils/errorHandler';
import { validateUser } from '../utils/validator'; // Added import for validateUser
// import bcrypt from 'bcryptjs'; // For password hashing - Temporarily commented out

const router = Router();

// Get all users
router.get('/', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] GET /api/users - Request received.`);
  try {
    const users = await userService.getAllUsers();
    successResponse(res, 'Users retrieved successfully', users);
    console.log(`[${new Date().toISOString()}] GET /api/users - Successfully retrieved ${users.length} users.`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET /api/users - Error:`, error);
    next(new ApiError('Failed to retrieve users', 500, error));
  }
});

// Get user by ID
router.get('/:id', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] GET /api/users/:id - Request received. Params:`, req.params);
  try {
    const { id } = req.params;
    const user = await userService.getUserById(Number(id));
    if (!user) {
      console.log(`[${new Date().toISOString()}] GET /api/users/:id - User not found for ID: ${id}`);
      throw new ApiError('User not found', 404);
    }
    successResponse(res, 'User retrieved successfully', user);
    console.log(`[${new Date().toISOString()}] GET /api/users/:id - Successfully retrieved user for ID: ${id}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET /api/users/:id - Error:`, error);
    next(error);
  }
});

// Create a new user
router.post('/', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] POST /api/users - Request received. Body:`, req.body);
  try {
    const validationErrors = validateUser(req.body);
    if (validationErrors.length > 0) {
      console.error(`[${new Date().toISOString()}] POST /api/users - Validation failed:`, validationErrors);
      return errorResponse(res, 'Validation failed', 400, validationErrors);
    }

    const { name, email, password, role, phone, bio, avatar_url, provider_type, id_number, address } = req.body;

    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      console.log(`[${new Date().toISOString()}] POST /api/users - User with email already exists: ${email}`);
      throw new ApiError('User with this email already exists', 409);
    }

    if (!password) {
      console.log(`[${new Date().toISOString()}] POST /api/users - Password is required for new user.`);
      throw new ApiError('Password is required', 400, ['Password is required.']);
    }

    // const hashedPassword = await bcrypt.hash(password, 10); // Temporarily commented out
    const hashedPassword = password; // Store password as plain text for simulation

    const newUser = await userService.createUser({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      bio,
      avatar_url,
      provider_type,
      id_number,
      address,
      favorite_service_ids: [], // Initialize for new users
    });
    const { password: _, ...userWithoutPassword } = newUser;
    successResponse(res, 'User created successfully', userWithoutPassword, 201);
    console.log(`[${new Date().toISOString()}] POST /api/users - User created successfully: ${email}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] POST /api/users - Error:`, error);
    next(error);
  }
});

// Update a user
router.put('/:id', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] PUT /api/users/:id - Request received. Params: ${req.params.id}, Body:`, req.body);
  try {
    const { id } = req.params;
    const updates = req.body;

    const validationErrors = validateUser(updates, true);
    if (validationErrors.length > 0) {
      console.error(`[${new Date().toISOString()}] PUT /api/users/:id - Validation failed:`, validationErrors);
      return errorResponse(res, 'Validation failed', 400, validationErrors);
    }

    if (updates.password) {
      // updates.password = await bcrypt.hash(updates.password, 10); // Temporarily commented out
      updates.password = updates.password; // Store password as plain text for simulation
    }

    const updatedUser = await userService.updateUser(Number(id), updates);
    if (!updatedUser) {
      console.log(`[${new Date().toISOString()}] PUT /api/users/:id - User not found for ID: ${id}`);
      throw new ApiError('User not found', 404);
    }

    const { password: _, ...userWithoutPassword } = updatedUser;
    successResponse(res, 'User updated successfully', userWithoutPassword);
    console.log(`[${new Date().toISOString()}] PUT /api/users/:id - User updated successfully for ID: ${id}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] PUT /api/users/:id - Error:`, error);
    next(error);
  }
});

// Add a service to user's favorites
router.post('/:userId/favorites', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] POST /api/users/:userId/favorites - Request received. Params: ${req.params.userId}, Body:`, req.body);
  try {
    const { userId } = req.params;
    const { serviceId } = req.body;

    if (!serviceId) {
      throw new ApiError('Service ID is required', 400);
    }

    const user = await userService.getUserById(Number(userId));
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    const currentFavorites = user.favorite_service_ids || [];
    if (currentFavorites.includes(serviceId)) {
      return successResponse(res, 'Service already in favorites', user, 200);
    }

    const updatedUser = await userService.updateUser(Number(userId), {
      favorite_service_ids: [...currentFavorites, serviceId],
    });

    if (!updatedUser) {
      throw new ApiError('Failed to add service to favorites', 500);
    }

    successResponse(res, 'Service added to favorites successfully', updatedUser);
    console.log(`[${new Date().toISOString()}] POST /api/users/:userId/favorites - Service ${serviceId} added to favorites for user ${userId}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] POST /api/users/:userId/favorites - Error:`, error);
    next(error);
  }
});

// Remove a service from user's favorites
router.delete('/:userId/favorites/:serviceId', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] DELETE /api/users/:userId/favorites/:serviceId - Request received. Params:`, req.params);
  try {
    const { userId, serviceId } = req.params;

    const user = await userService.getUserById(Number(userId));
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    const currentFavorites = user.favorite_service_ids || [];
    const updatedFavorites = currentFavorites.filter(id => id !== Number(serviceId));

    if (updatedFavorites.length === currentFavorites.length) {
      return successResponse(res, 'Service not found in favorites', user, 200);
    }

    const updatedUser = await userService.updateUser(Number(userId), {
      favorite_service_ids: updatedFavorites,
    });

    if (!updatedUser) {
      throw new ApiError('Failed to remove service from favorites', 500);
    }

    successResponse(res, 'Service removed from favorites successfully', updatedUser);
    console.log(`[${new Date().toISOString()}] DELETE /api/users/:userId/favorites/:serviceId - Service ${serviceId} removed from favorites for user ${userId}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] DELETE /api/users/:userId/favorites/:serviceId - Error:`, error);
    next(error);
  }
});

// Delete a user
router.delete('/:id', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] DELETE /api/users/:id - Request received. Params:`, req.params);
  try {
    const { id } = req.params;
    const deleted = await userService.deleteUser(Number(id));
    if (!deleted) {
      console.log(`[${new Date().toISOString()}] DELETE /api/users/:id - User not found for ID: ${id}`);
      throw new ApiError('User not found', 404);
    }
    successResponse(res, 'User deleted successfully', null, 204);
    console.log(`[${new Date().toISOString()}] DELETE /api/users/:id - User deleted successfully for ID: ${id}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] DELETE /api/users/:id - Error:`, error);
    next(error);
  }
});

export default router;