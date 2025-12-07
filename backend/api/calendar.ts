import { Router } from 'express';
import CalendarEventService from '../services/calendarEventService';

const router = Router();

// Get all calendar events for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const events = await CalendarEventService.findByUserId(req.params.userId);
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching calendar events', error });
  }
});

// Create a new calendar event
router.post('/', async (req, res) => {
  try {
    const newEvent = await CalendarEventService.create(req.body);
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ message: 'Error creating calendar event', error });
  }
});

// Update a calendar event
router.put('/:id', async (req, res) => {
  try {
    const updatedEvent = await CalendarEventService.update(req.params.id, req.body);
    if (updatedEvent) {
      res.json(updatedEvent);
    } else {
      res.status(404).json({ message: 'Calendar event not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating calendar event', error });
  }
});

// Delete a calendar event
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await CalendarEventService.delete(req.params.id);
    if (deleted) {
      res.status(204).send(); // No content
    } else {
      res.status(404).json({ message: 'Calendar event not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting calendar event', error });
  }
});

export default router;