import { Router } from 'express';
import MessageService from '../services/messageService';
import ConversationService from '../services/conversationService'; // To ensure conversation exists

const router = Router();

// Get messages for a specific conversation
router.get('/conversation/:conversationId', async (req, res) => {
  try {
    const messages = await MessageService.findByConversationId(req.params.conversationId);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error });
  }
});

// Send a new message
router.post('/', async (req, res) => {
  try {
    const { conversationId, senderId, text } = req.body;
    // Optional: Check if conversationId and senderId are valid
    const conversation = await ConversationService.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const newMessage = await MessageService.create({ conversationId, senderId, text });
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error });
  }
});

// Mark messages in a conversation as read for a specific user
router.put('/read/:conversationId/:userId', async (req, res) => {
  try {
    const { conversationId, userId } = req.params;
    const updatedCount = await MessageService.markConversationAsRead(conversationId, userId);
    res.json({ message: `Marked ${updatedCount} messages as read.`, updatedCount });
  } catch (error) {
    res.status(500).json({ message: 'Error marking messages as read', error });
  }
});

// Get total unread messages for a user
router.get('/unread/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const unreadCount = await MessageService.getUnreadCountForUser(userId);
    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching unread message count', error });
  }
});

export default router;