import { Router } from 'express';
import ConversationService from '../services/conversationService';
import MessageService from '../services/messageService';
import UserService from '../services/userService'; // To get participant details

const router = Router();

// Get all conversations for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const conversations = await ConversationService.findUserConversations(userId);

    const conversationsWithDetails = await Promise.all(conversations.map(async (conv) => {
      const otherParticipantId = conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;
      const otherParticipant = await UserService.findById(otherParticipantId);
      const lastMessage = (await MessageService.findByConversationId(conv.id)).pop(); // Get last message
      const unreadCount = await MessageService.getUnreadCountForConversation(conv.id, userId);

      return {
        id: conv.id,
        customerName: otherParticipant?.name || 'Unknown User',
        avatarUrl: otherParticipant?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${otherParticipant?.name || 'UU'}`,
        lastMessage: lastMessage?.text || 'No messages yet',
        lastMessageTime: lastMessage?.timestamp ? new Date(lastMessage.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '',
        unreadCount: unreadCount,
      };
    }));

    res.json(conversationsWithDetails);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user conversations', error });
  }
});

// Get a single conversation by ID
router.get('/:id', async (req, res) => {
  try {
    const conversation = await ConversationService.findById(req.params.id);
    if (conversation) {
      res.json(conversation);
    } else {
      res.status(404).json({ message: 'Conversation not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching conversation', error });
  }
});

// Create a new conversation (or get existing one)
router.post('/', async (req, res) => {
  try {
    const { participant1Id, participant2Id } = req.body;
    let conversation = await ConversationService.findByParticipants(participant1Id, participant2Id);

    if (!conversation) {
      conversation = await ConversationService.create(participant1Id, participant2Id);
    }
    res.status(200).json(conversation);
  } catch (error) {
    res.status(500).json({ message: 'Error creating/fetching conversation', error });
  }
});

export default router;