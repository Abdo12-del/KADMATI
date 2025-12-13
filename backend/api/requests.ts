import { Router } from 'express';
import { requestService } from '../services/requestService';
import { successResponse } from '../utils/response';
import { ApiError } from '../utils/errorHandler';
import { validateRequest } from '../utils/validator';
import { Request } from '../models/requestModel'; // Explicitly import Request model

const router = Router();

// Get all requests
router.get('/', async (_req, res, next) => {
  console.log(`[${new Date().toISOString()}] GET /api/requests - Request received.`);
  try {
    const requests = await requestService.getAllRequests();
    successResponse(res, 'Requests retrieved successfully', requests);
    console.log(`[${new Date().toISOString()}] GET /api/requests - Successfully retrieved ${requests.length} requests.`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET /api/requests - Error:`, error);
    next(new ApiError('Failed to retrieve requests', 500, error));
  }
});

// Get request by ID
router.get('/:id', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] GET /api/requests/:id - Request received. Params:`, req.params);
  try {
    const { id } = req.params;
    const request = await requestService.getRequestById(Number(id));
    if (!request) {
      console.log(`[${new Date().toISOString()}] GET /api/requests/:id - Request not found for ID: ${id}`);
      throw new ApiError('Request not found', 404);
    }
    successResponse(res, 'Request retrieved successfully', request);
    console.log(`[${new Date().toISOString()}] GET /api/requests/:id - Successfully retrieved request for ID: ${id}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET /api/requests/:id - Error:`, error);
    next(error);
  }
});

// Create a new request
router.post('/', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] POST /api/requests - Request received. Body:`, req.body);
  try {
    const validationErrors = validateRequest(req.body);
    if (validationErrors.length > 0) {
      console.error(`[${new Date().toISOString()}] POST /api/requests - Validation failed:`, validationErrors);
      throw new ApiError('Validation failed', 400, validationErrors);
    }

    const newRequest = await requestService.createRequest(req.body);
    successResponse(res, 'Request created successfully', newRequest, 201);
    console.log(`[${new Date().toISOString()}] POST /api/requests - Request created successfully with ID: ${newRequest.id}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] POST /api/requests - Error:`, error);
    next(error);
  }
});

// Update a request
router.put('/:id', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] PUT /api/requests/:id - Request received. Params: ${req.params.id}, Body:`, req.body);
  try {
    const { id } = req.params;
    const updates = req.body;

    const validationErrors = validateRequest(updates, true);
    if (validationErrors.length > 0) {
      console.error(`[${new Date().toISOString()}] PUT /api/requests/:id - Validation failed:`, validationErrors);
      throw new ApiError('Validation failed', 400, validationErrors);
    }

    const updatedRequest = await requestService.updateRequest(Number(id), updates);
    if (!updatedRequest) {
      console.log(`[${new Date().toISOString()}] PUT /api/requests/:id - Request not found for ID: ${id}`);
      throw new ApiError('Request not found', 404);
    }
    successResponse(res, 'Request updated successfully', updatedRequest);
    console.log(`[${new Date().toISOString()}] PUT /api/requests/:id - Request updated successfully for ID: ${id}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] PUT /api/requests/:id - Error:`, error);
    next(error);
  }
});

// Update request payment status and details
router.patch('/:id/payment', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] PATCH /api/requests/:id/payment - Request received. Params: ${req.params.id}, Body:`, req.body);
  try {
    const { id } = req.params;
    const { payment_status, payment_reference, receipt_url } = req.body;

    const updates: Partial<Request> = {
      payment_status: payment_status,
      payment_reference: payment_reference,
      receipt_url: receipt_url,
      status: 'payment_pending', // Automatically set request status to 'payment_pending' when client confirms payment
    };

    const validationErrors = validateRequest(updates, true);
    if (validationErrors.length > 0) {
      console.error(`[${new Date().toISOString()}] PATCH /api/requests/:id/payment - Validation failed:`, validationErrors);
      throw new ApiError('Validation failed', 400, validationErrors);
    }

    const updatedRequest = await requestService.updateRequest(Number(id), updates);
    if (!updatedRequest) {
      console.log(`[${new Date().toISOString()}] PATCH /api/requests/:id/payment - Request not found for ID: ${id}`);
      throw new ApiError('Request not found', 404);
    }
    successResponse(res, 'Payment details updated successfully', updatedRequest);
    console.log(`[${new Date().toISOString()}] PATCH /api/requests/:id/payment - Payment details updated successfully for ID: ${id}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] PATCH /api/requests/:id/payment - Error:`, error);
    next(error);
  }
});

// Delete a request
router.delete('/:id', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] DELETE /api/requests/:id - Request received. Params:`, req.params);
  try {
    const { id } = req.params;
    const deleted = await requestService.deleteRequest(Number(id));
    if (!deleted) {
      console.log(`[${new Date().toISOString()}] DELETE /api/requests/:id - Request not found for ID: ${id}`);
      throw new ApiError('Request not found', 404);
    }
    successResponse(res, 'Request deleted successfully', null, 204);
    console.log(`[${new Date().toISOString()}] DELETE /api/requests/:id - Request deleted successfully for ID: ${id}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] DELETE /api/requests/:id - Error:`, error);
    next(error);
  }
});

export default router;