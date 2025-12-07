import { Router } from 'express';
import RatingService from '../services/ratingService';

const router = Router();

// Get all ratings
router.get('/', async (req, res) => {
  try {
    const ratings = await RatingService.findAll();
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching ratings', error });
  }
});

// Get rating by ID
router.get('/:id', async (req, res) => {
  try {
    const rating = await RatingService.findById(req.params.id);
    if (rating) {
      res.json(rating);
    } else {
      res.status(404).json({ message: 'Rating not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rating', error });
  }
});

// Get ratings by service ID
router.get('/service/:serviceId', async (req, res) => {
  try {
    const ratings = await RatingService.findByServiceId(req.params.serviceId);
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching service ratings', error });
  }
});

// Get ratings by client ID
router.get('/client/:clientId', async (req, res) => {
  try {
    const ratings = await RatingService.findByClientId(req.params.clientId);
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching client ratings', error });
  }
});

// Create a new rating
router.post('/', async (req, res) => {
  try {
    const newRating = await RatingService.create(req.body);
    res.status(201).json(newRating);
  } catch (error) {
    res.status(500).json({ message: 'Error creating rating', error });
  }
});

// Update a rating
router.put('/:id', async (req, res) => {
  try {
    const updatedRating = await RatingService.update(req.params.id, req.body);
    if (updatedRating) {
      res.json(updatedRating);
    } else {
      res.status(404).json({ message: 'Rating not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating rating', error });
  }
});

// Delete a rating
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await RatingService.delete(req.params.id);
    if (deleted) {
      res.status(204).send(); // No content
    } else {
      res.status(404).json({ message: 'Rating not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting rating', error });
  }
});

export default router;