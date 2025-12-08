import { Router } from 'express';
import { requestService } from '../services/requestService';
import { successResponse, errorResponse } from '../utils/response';
import { ApiError } from '../utils/errorHandler';
import { validateRequest } from '../utils/validator';

const router = Router();

// Get all requests
router.get('/', async (req, res, next) => {
  try {
    const requests = await requestService.getAllRequests();
    successResponse(res, 'Requests retrieved successfully', requests);
  } catch (error) {
    next(new ApiError('Failed to retrieve requests', 500, error));
  }
});

// Get request by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await requestService.getRequestById(Number(id));
    if (!request) {
      throw new ApiError('Request not found', 404);
    }
    successResponse(res, 'Request retrieved successfully', request);
  } catch (error) {
    next(error);
  }
});

// Create a new request
router.post('/', async (req, res, next) => {
  try {
    const validationErrors = validateRequest(req.body);
    if (validationErrors.length > 0) {
      throw new ApiError('Validation failed', 400, validationErrors);
    }

    const newRequest = await requestService.createRequest(req.body);
    successResponse(res, 'Request created successfully', newRequest, 201);
  } catch (error) {
    next(error);
  }
});

// Update a request
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const validationErrors = validateRequest(updates, true);
    if (validationErrors.length > 0) {
      throw new ApiError('Validation failed', 400, validationErrors);
    }

    const updatedRequest = await requestService.updateRequest(Number(id), updates);
    if (!updatedRequest) {
      throw new ApiError('Request not found', 404);
    }
    successResponse(res, 'Request updated successfully', updatedRequest);
  } catch (error) {
    next(error);
  }
});

// Delete a request
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await requestService.deleteRequest(Number(id));
    if (!deleted) {
      throw new ApiError('Request not found', 404);
    }
    successResponse(res, 'Request deleted successfully', null, 204);
  } catch (error) {
    next(error);
  }
});

export default router;