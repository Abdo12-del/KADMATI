import { Router } from 'express';
import { messageService } from '../services/messageService';
import { successResponse, errorResponse } from '../utils/response';
import { ApiError } from '../utils/errorHandler';
import { validateMessage } from '../utils/validator';

const router = Router();

// Get all messages
router.get('/', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] GET /api/messages - Request received.`);
  try {
    const messages = await messageService.getAllMessages();
    successResponse(res, 'Messages retrieved successfully', messages);
    console.log(`[${new Date().toISOString()}] GET /api/messages - Successfully retrieved ${messages.length} messages.`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET /api/messages - Error:`, error);
    next(new ApiError('Failed to retrieve messages', 500, error));
  }
});

// Get messages by conversation ID
router.get('/conversation/:conversationId', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] GET /api/messages/conversation/:conversationId - Request received. Params:`, req.params);
  try {
    const { conversationId } = req.params;
    const messages = await messageService.getMessagesByConversationId(conversationId);
    successResponse(res, 'Messages retrieved successfully for conversation', messages);
    console.log(`[${new Date().toISOString()}] GET /api/messages/conversation/:conversationId - Successfully retrieved ${messages.length} messages for conversation: ${conversationId}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET /api/messages/conversation/:conversationId - Error:`, error);
    next(new ApiError('Failed to retrieve messages for conversation', 500, error));
  }
});

// Get message by ID
router.get('/:id', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] GET /api/messages/:id - Request received. Params:`, req.params);
  try {
    const { id } = req.params;
    const message = await messageService.getMessageById(Number(id));
    if (!message) {
      console.log(`[${new Date().toISOString()}] GET /api/messages/:id - Message not found for ID: ${id}`);
      throw new ApiError('Message not found', 404);
    }
    successResponse(res, 'Message retrieved successfully', message);
    console.log(`[${new Date().toISOString()}] GET /api/messages/:id - Successfully retrieved message for ID: ${id}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET /api/messages/:id - Error:`, error);
    next(error);
  }
});

// Create a new message
router.post('/', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] POST /api/messages - Request received. Body:`, req.body);
  try {
    const validationErrors = validateMessage(req.body);
    if (validationErrors.length > 0) {
      console.error(`[${new Date().toISOString()}] POST /api/messages - Validation failed:`, validationErrors);
      throw new ApiError('Validation failed', 400, validationErrors);
    }

    const newMessage = await messageService.createMessage(req.body);
    successResponse(res, 'Message created successfully', newMessage, 201);
    console.log(`[${new Date().toISOString()}] POST /api/messages - Message created successfully with ID: ${newMessage.id}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] POST /api/messages - Error:`, error);
    next(error);
  }
});

// Update a message
router.put('/:id', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] PUT /api/messages/:id - Request received. Params: ${req.params.id}, Body:`, req.body);
  try {
    const { id } = req.params;
    const updates = req.body;

    const validationErrors = validateMessage(updates, true);
    if (validationErrors.length > 0) {
      console.error(`[${new Date().toISOString()}] PUT /api/messages/:id - Validation failed:`, validationErrors);
      throw new ApiError('Validation failed', 400, validationErrors);
    }

    const updatedMessage = await messageService.updateMessage(Number(id), updates);
    if (!updatedMessage) {
      console.log(`[${new Date().toISOString()}] PUT /api/messages/:id - Message not found for ID: ${id}`);
      throw new ApiError('Message not found', 404);
    }
    successResponse(res, 'Message updated successfully', updatedMessage);
    console.log(`[${new Date().toISOString()}] PUT /api/messages/:id - Message updated successfully for ID: ${id}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] PUT /api/messages/:id - Error:`, error);
    next(error);
  }
});

// Delete a message
router.delete('/:id', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] DELETE /api/messages/:id - Request received. Params:`, req.params);
  try {
    const { id } = req.params;
    const deleted = await messageService.deleteMessage(Number(id));
    if (!deleted) {
      console.log(`[${new Date().toISOString()}] DELETE /api/messages/:id - Message not found for ID: ${id}`);
      throw new ApiError('Message not found', 404);
    }
    successResponse(res, 'Message deleted successfully', null, 204);
    console.log(`[${new Date().toISOString()}] DELETE /api/messages/:id - Message deleted successfully for ID: ${id}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] DELETE /api/messages/:id - Error:`, error);
    next(error);
  }
});

export default router;