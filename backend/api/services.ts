import { Router } from 'express';
import ServiceService from '../services/serviceService';

const router = Router();

// Get all services
router.get('/', async (req, res) => {
  try {
    const services = await ServiceService.findAll();
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching services', error });
  }
});

// Get service by ID
router.get('/:id', async (req, res) => {
  try {
    const service = await ServiceService.findById(req.params.id);
    if (service) {
      res.json(service);
    } else {
      res.status(404).json({ message: 'Service not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching service', error });
  }
});

// Get services by provider ID
router.get('/provider/:providerId', async (req, res) => {
  try {
    const services = await ServiceService.findByProviderId(req.params.providerId);
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching provider services', error });
  }
});

// Create a new service
router.post('/', async (req, res) => {
  try {
    const newService = await ServiceService.create(req.body);
    res.status(201).json(newService);
  } catch (error) {
    res.status(500).json({ message: 'Error creating service', error });
  }
});

// Update a service
router.put('/:id', async (req, res) => {
  try {
    const updatedService = await ServiceService.update(req.params.id, req.body);
    if (updatedService) {
      res.json(updatedService);
    } else {
      res.status(404).json({ message: 'Service not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating service', error });
  }
});

// Delete a service
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await ServiceService.delete(req.params.id);
    if (deleted) {
      res.status(204).send(); // No content
    } else {
      res.status(404).json({ message: 'Service not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting service', error });
  }
});

export default router;