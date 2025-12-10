import { Router } from 'express';
import { serviceService } from '../services/serviceService';
import { successResponse, errorResponse } from '../utils/response';
import { ApiError } from '../utils/errorHandler';
import { validateService } from '../utils/validator';

const router = Router();

// Get all services
router.get('/', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] GET /api/services - Request received.`);
  try {
    const services = await serviceService.getAllServices();
    successResponse(res, 'Services retrieved successfully', services);
    console.log(`[${new Date().toISOString()}] GET /api/services - Successfully retrieved ${services.length} services.`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET /api/services - Error:`, error);
    next(new ApiError('Failed to retrieve services', 500, error));
  }
});

// Get service by ID
router.get('/:id', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] GET /api/services/:id - Request received. Params:`, req.params);
  try {
    const { id } = req.params;
    const service = await serviceService.getServiceById(Number(id));
    if (!service) {
      console.log(`[${new Date().toISOString()}] GET /api/services/:id - Service not found for ID: ${id}`);
      throw new ApiError('Service not found', 404);
    }
    successResponse(res, 'Service retrieved successfully', service);
    console.log(`[${new Date().toISOString()}] GET /api/services/:id - Successfully retrieved service for ID: ${id}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET /api/services/:id - Error:`, error);
    next(error);
  }
});

// Create a new service
router.post('/', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] POST /api/services - Request received. Body:`, req.body);
  try {
    const validationErrors = validateService(req.body);
    if (validationErrors.length > 0) {
      console.error(`[${new Date().toISOString()}] POST /api/services - Validation failed:`, validationErrors);
      throw new ApiError('Validation failed', 400, validationErrors);
    }

    const newService = await serviceService.createService(req.body);
    successResponse(res, 'Service created successfully', newService, 201);
    console.log(`[${new Date().toISOString()}] POST /api/services - Service created successfully with ID: ${newService.id}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] POST /api/services - Error:`, error);
    next(error);
  }
});

// Update a service
router.put('/:id', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] PUT /api/services/:id - Request received. Params: ${req.params.id}, Body:`, req.body);
  try {
    const { id } = req.params;
    const updates = req.body;

    const validationErrors = validateService(updates, true);
    if (validationErrors.length > 0) {
      console.error(`[${new Date().toISOString()}] PUT /api/services/:id - Validation failed:`, validationErrors);
      throw new ApiError('Validation failed', 400, validationErrors);
    }

    const updatedService = await serviceService.updateService(Number(id), updates);
    if (!updatedService) {
      console.log(`[${new Date().toISOString()}] PUT /api/services/:id - Service not found for ID: ${id}`);
      throw new ApiError('Service not found', 404);
    }
    successResponse(res, 'Service updated successfully', updatedService);
    console.log(`[${new Date().toISOString()}] PUT /api/services/:id - Service updated successfully for ID: ${id}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] PUT /api/services/:id - Error:`, error);
    next(error);
  }
});

// Delete a service
router.delete('/:id', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] DELETE /api/services/:id - Request received. Params:`, req.params);
  try {
    const { id } = req.params;
    const deleted = await serviceService.deleteService(Number(id));
    if (!deleted) {
      console.log(`[${new Date().toISOString()}] DELETE /api/services/:id - Service not found for ID: ${id}`);
      throw new ApiError('Service not found', 404);
    }
    successResponse(res, 'Service deleted successfully', null, 204);
    console.log(`[${new Date().toISOString()}] DELETE /api/services/:id - Service deleted successfully for ID: ${id}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] DELETE /api/services/:id - Error:`, error);
    next(error);
  }
});

export default router;