import { Router } from 'express';
import RequestService from '../services/requestService';

const router = Router();

// Get all requests
router.get('/', async (req, res) => {
  try {
    const requests = await RequestService.findAll();
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching requests', error });
  }
});

// Get request by ID
router.get('/:id', async (req, res) => {
  try {
    const request = await RequestService.findById(req.params.id);
    if (request) {
      res.json(request);
    } else {
      res.status(404).json({ message: 'Request not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching request', error });
  }
});

// Get requests by client ID
router.get('/client/:clientId', async (req, res) => {
  try {
    const requests = await RequestService.findByClientId(req.params.clientId);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching client requests', error });
  }
});

// Create a new request
router.post('/', async (req, res) => {
  try {
    const newRequest = await RequestService.create(req.body);
    res.status(201).json(newRequest);
  } catch (error) {
    res.status(500).json({ message: 'Error creating request', error });
  }
});

// Update a request
router.put('/:id', async (req, res) => {
  try {
    const updatedRequest = await RequestService.update(req.params.id, req.body);
    if (updatedRequest) {
      res.json(updatedRequest);
    } else {
      res.status(404).json({ message: 'Request not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating request', error });
  }
});

// Delete a request
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await RequestService.delete(req.params.id);
    if (deleted) {
      res.status(204).send(); // No content
    } else {
      res.status(404).json({ message: 'Request not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting request', error });
  }
});

export default router;