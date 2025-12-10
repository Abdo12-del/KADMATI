import { Router } from 'express';
import { ratingService } from '../services/ratingService';
import { successResponse, errorResponse } from '../utils/response';
import { ApiError } from '../utils/errorHandler';
import { validateRating } from '../utils/validator';

const router = Router();

// Get all ratings
router.get('/', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] GET /api/ratings - Request received.`);
  try {
    const ratings = await ratingService.getAllRatings();
    successResponse(res, 'Ratings retrieved successfully', ratings);
    console.log(`[${new Date().toISOString()}] GET /api/ratings - Successfully retrieved ${ratings.length} ratings.`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET /api/ratings - Error:`, error);
    next(new ApiError('Failed to retrieve ratings', 500, error));
  }
});

// Get rating by ID
router.get('/:id', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] GET /api/ratings/:id - Request received. Params:`, req.params);
  try {
    const { id } = req.params;
    const rating = await ratingService.getRatingById(Number(id));
    if (!rating) {
      console.log(`[${new Date().toISOString()}] GET /api/ratings/:id - Rating not found for ID: ${id}`);
      throw new ApiError('Rating not found', 404);
    }
    successResponse(res, 'Rating retrieved successfully', rating);
    console.log(`[${new Date().toISOString()}] GET /api/ratings/:id - Successfully retrieved rating for ID: ${id}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET /api/ratings/:id - Error:`, error);
    next(error);
  }
});

// Create a new rating
router.post('/', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] POST /api/ratings - Request received. Body:`, req.body);
  try {
    const validationErrors = validateRating(req.body);
    if (validationErrors.length > 0) {
      console.error(`[${new Date().toISOString()}] POST /api/ratings - Validation failed:`, validationErrors);
      throw new ApiError('Validation failed', 400, validationErrors);
    }

    const newRating = await ratingService.createRating(req.body);
    successResponse(res, 'Rating created successfully', newRating, 201);
    console.log(`[${new Date().toISOString()}] POST /api/ratings - Rating created successfully with ID: ${newRating.id}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] POST /api/ratings - Error:`, error);
    next(error);
  }
});

// Update a rating
router.put('/:id', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] PUT /api/ratings/:id - Request received. Params: ${req.params.id}, Body:`, req.body);
  try {
    const { id } = req.params;
    const updates = req.body;

    const validationErrors = validateRating(updates, true);
    if (validationErrors.length > 0) {
      console.error(`[${new Date().toISOString()}] PUT /api/ratings/:id - Validation failed:`, validationErrors);
      throw new ApiError('Validation failed', 400, validationErrors);
    }

    const updatedRating = await ratingService.updateRating(Number(id), updates);
    if (!updatedRating) {
      console.log(`[${new Date().toISOString()}] PUT /api/ratings/:id - Rating not found for ID: ${id}`);
      throw new ApiError('Rating not found', 404);
    }
    successResponse(res, 'Rating updated successfully', updatedRating);
    console.log(`[${new Date().toISOString()}] PUT /api/ratings/:id - Rating updated successfully for ID: ${id}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] PUT /api/ratings/:id - Error:`, error);
    next(error);
  }
});

// Delete a rating
router.delete('/:id', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] DELETE /api/ratings/:id - Request received. Params:`, req.params);
  try {
    const { id } = req.params;
    const deleted = await ratingService.deleteRating(Number(id));
    if (!deleted) {
      console.log(`[${new Date().toISOString()}] DELETE /api/ratings/:id - Rating not found for ID: ${id}`);
      throw new ApiError('Rating not found', 404);
    }
    successResponse(res, 'Rating deleted successfully', null, 204);
    console.log(`[${new Date().toISOString()}] DELETE /api/ratings/:id - Rating deleted successfully for ID: ${id}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] DELETE /api/ratings/:id - Error:`, error);
    next(error);
  }
});

export default router;