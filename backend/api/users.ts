import { Router } from 'express';
import UserService from '../services/userService';
import { v4 as uuidv4 } from 'uuid'; // For generating IDs

const router = Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await UserService.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await UserService.findById(req.params.id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error });
  }
});

// Create a new user (simplified, no password hashing/auth yet)
router.post('/', async (req, res) => {
  try {
    const newUser = await UserService.create(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error });
  }
});

// Update a user
router.put('/:id', async (req, res) => {
  try {
    const updatedUser = await UserService.update(req.params.id, req.body);
    if (updatedUser) {
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error });
  }
});

// Delete a user
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await UserService.delete(req.params.id);
    if (deleted) {
      res.status(204).send(); // No content
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error });
  }
});

export default router;