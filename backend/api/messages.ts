import { Router } from 'express';
import { messageService } from '../services/messageService';
import { successResponse, errorResponse } from '../utils/response';
import { ApiError } from '../utils/errorHandler';
import { validateMessage } from '../utils/validator';

const router = Router();

// Get all messages
router.get('/', async (req, res, next) => {
  try {
    const messages = await messageService.getAllMessages();
    successResponse(res, 'Messages retrieved successfully', messages);
  } catch (error) {
    next(new ApiError('Failed to retrieve messages', 500, error));
  }
});

// Get messages by conversation ID
router.get('/conversation/:conversationId', async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const messages = await messageService.getMessagesByConversationId(conversationId);
    successResponse(res, 'Messages retrieved successfully for conversation', messages);
  } catch (error) {
    next(new ApiError('Failed to retrieve messages for conversation', 500, error));
  }
});

// Get message by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const message = await messageService.getMessageById(Number(id));
    if (!message) {
      throw new ApiError('Message not found', 404);
    }
    successResponse(res, 'Message retrieved successfully', message);
  } catch (error) {
    next(error);
  }
});

// Create a new message
router.post('/', async (req, res, next) => {
  try {
    const validationErrors = validateMessage(req.body);
    if (validationErrors.length > 0) {
      throw new ApiError('Validation failed', 400, validationErrors);
    }

    const newMessage = await messageService.createMessage(req.body);
    successResponse(res, 'Message created successfully', newMessage, 201);
  } catch (error) {
    next(error);
  }
});

// Update a message
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const validationErrors = validateMessage(updates, true);
    if (validationErrors.length > 0) {
      throw new ApiError('Validation failed', 400, validationErrors);
    }

    const updatedMessage = await messageService.updateMessage(Number(id), updates);
    if (!updatedMessage) {
      throw new ApiError('Message not found', 404);
    }
    successResponse(res, 'Message updated successfully', updatedMessage);
  } catch (error) {
    next(error);
  }
});

// Delete a message
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await messageService.deleteMessage(Number(id));
    if (!deleted) {
      throw new ApiError('Message not found', 404);
    }
    successResponse(res, 'Message deleted successfully', null, 204);
  } catch (error) {
    next(error);
  }
});

export default router;