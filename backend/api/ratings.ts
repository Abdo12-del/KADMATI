import { Router } from 'express';
import { ratingService } from '../services/ratingService';
import { successResponse, errorResponse } from '../utils/response';
import { ApiError } from '../utils/errorHandler';
import { validateRating } from '../utils/validator';

const router = Router();

// Get all ratings
router.get('/', async (req, res, next) => {
  try {
    const ratings = await ratingService.getAllRatings();
    successResponse(res, 'Ratings retrieved successfully', ratings);
  } catch (error) {
    next(new ApiError('Failed to retrieve ratings', 500, error));
  }
});

// Get rating by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const rating = await ratingService.getRatingById(Number(id));
    if (!rating) {
      throw new ApiError('Rating not found', 404);
    }
    successResponse(res, 'Rating retrieved successfully', rating);
  } catch (error) {
    next(error);
  }
});

// Create a new rating
router.post('/', async (req, res, next) => {
  try {
    const validationErrors = validateRating(req.body);
    if (validationErrors.length > 0) {
      throw new ApiError('Validation failed', 400, validationErrors);
    }

    const newRating = await ratingService.createRating(req.body);
    successResponse(res, 'Rating created successfully', newRating, 201);
  } catch (error) {
    next(error);
  }
});

// Update a rating
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const validationErrors = validateRating(updates, true);
    if (validationErrors.length > 0) {
      throw new ApiError('Validation failed', 400, validationErrors);
    }

    const updatedRating = await ratingService.updateRating(Number(id), updates);
    if (!updatedRating) {
      throw new ApiError('Rating not found', 404);
    }
    successResponse(res, 'Rating updated successfully', updatedRating);
  } catch (error) {
    next(error);
  }
});

// Delete a rating
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await ratingService.deleteRating(Number(id));
    if (!deleted) {
      throw new ApiError('Rating not found', 404);
    }
    successResponse(res, 'Rating deleted successfully', null, 204);
  } catch (error) {
    next(error);
  }
});

export default router;