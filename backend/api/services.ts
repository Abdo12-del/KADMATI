import { Router } from 'express';
import { serviceService } from '../services/serviceService';
import { successResponse, errorResponse } from '../utils/response';
import { ApiError } from '../utils/errorHandler';
import { validateService } from '../utils/validator';

const router = Router();

// Get all services
router.get('/', async (req, res, next) => {
  try {
    const services = await serviceService.getAllServices();
    successResponse(res, 'Services retrieved successfully', services);
  } catch (error) {
    next(new ApiError('Failed to retrieve services', 500, error));
  }
});

// Get service by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const service = await serviceService.getServiceById(Number(id));
    if (!service) {
      throw new ApiError('Service not found', 404);
    }
    successResponse(res, 'Service retrieved successfully', service);
  } catch (error) {
    next(error);
  }
});

// Create a new service
router.post('/', async (req, res, next) => {
  try {
    const validationErrors = validateService(req.body);
    if (validationErrors.length > 0) {
      throw new ApiError('Validation failed', 400, validationErrors);
    }

    const newService = await serviceService.createService(req.body);
    successResponse(res, 'Service created successfully', newService, 201);
  } catch (error) {
    next(error);
  }
});

// Update a service
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const validationErrors = validateService(updates, true);
    if (validationErrors.length > 0) {
      throw new ApiError('Validation failed', 400, validationErrors);
    }

    const updatedService = await serviceService.updateService(Number(id), updates);
    if (!updatedService) {
      throw new ApiError('Service not found', 404);
    }
    successResponse(res, 'Service updated successfully', updatedService);
  } catch (error) {
    next(error);
  }
});

// Delete a service
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await serviceService.deleteService(Number(id));
    if (!deleted) {
      throw new ApiError('Service not found', 404);
    }
    successResponse(res, 'Service deleted successfully', null, 204);
  } catch (error) {
    next(error);
  }
});

export default router;