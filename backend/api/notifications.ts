import { Router } from 'express';
import NotificationService from '../services/notificationService';

const router = Router();

// Get notifications for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const notifications = await NotificationService.findByUserId(req.params.userId);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error });
  }
});

// Get unread count for a specific user
router.get('/unread/:userId', async (req, res) => {
  try {
    const unreadCount = await NotificationService.getUnreadCountForUser(req.params.userId);
    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching unread notification count', error });
  }
});

// Mark a notification as read
router.put('/read/:id', async (req, res) => {
  try {
    const updated = await NotificationService.markAsRead(req.params.id);
    if (updated) {
      res.json({ message: 'Notification marked as read' });
    } else {
      res.status(404).json({ message: 'Notification not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error marking notification as read', error });
  }
});

// Mark all notifications for a user as read
router.put('/read-all/:userId', async (req, res) => {
  try {
    const updatedCount = await NotificationService.markAllAsReadForUser(req.params.userId);
    res.json({ message: `Marked ${updatedCount} notifications as read.`, updatedCount });
  } catch (error) {
    res.status(500).json({ message: 'Error marking all notifications as read', error });
  }
});

// Delete a notification
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await NotificationService.delete(req.params.id);
    if (deleted) {
      res.status(204).send(); // No content
    } else {
      res.status(404).json({ message: 'Notification not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting notification', error });
  }
});

export default router;