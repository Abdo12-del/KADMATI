import { Router } from 'express';
import OrderService from '../services/orderService';
import ServiceService from '../services/serviceService';
import UserService from '../services/userService';
import NotificationService from '../services/notificationService';

const router = Router();

// Get all orders (for admin/overview)
router.get('/', async (req, res) => {
  try {
    const orders = await OrderService.findAll();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await OrderService.findById(req.params.id);
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order', error });
  }
});

// Get orders by client ID
router.get('/client/:clientId', async (req, res) => {
  try {
    const orders = await OrderService.findByClientId(req.params.clientId);
    const ordersWithDetails = await Promise.all(orders.map(async (order) => {
      const service = await ServiceService.findById(order.serviceId);
      const provider = await UserService.findById(order.providerId);
      return {
        ...order,
        serviceTitle: service?.title || 'Unknown Service',
        providerName: provider?.name || 'Unknown Provider',
      };
    }));
    res.json(ordersWithDetails);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching client orders', error });
  }
});

// Get orders by provider ID
router.get('/provider/:providerId', async (req, res) => {
  try {
    const orders = await OrderService.findByProviderId(req.params.providerId);
    const ordersWithDetails = await Promise.all(orders.map(async (order) => {
      const service = await ServiceService.findById(order.serviceId);
      const client = await UserService.findById(order.clientId);
      return {
        ...order,
        serviceTitle: service?.title || 'Unknown Service',
        customerName: client?.name || 'Unknown Client',
      };
    }));
    res.json(ordersWithDetails);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching provider orders', error });
  }
});

// Create a new order
router.post('/', async (req, res) => {
  try {
    const newOrder = await OrderService.create(req.body);
    // Create notification for provider
    await NotificationService.create({
      userId: newOrder.providerId,
      type: 'order',
      title: 'طلب خدمة جديد!',
      description: `لديك طلب جديد للخدمة "${newOrder.serviceId}" من العميل ${newOrder.clientId}.`,
      link: `/dashboard/orders/${newOrder.id}`,
    });
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({ message: 'Error creating order', error });
  }
});

// Update an order
router.put('/:id', async (req, res) => {
  try {
    const updatedOrder = await OrderService.update(req.params.id, req.body);
    if (updatedOrder) {
      // Create notification for client if status changes
      if (req.body.status && updatedOrder.clientId) {
        await NotificationService.create({
          userId: updatedOrder.clientId,
          type: 'order',
          title: `تحديث حالة طلبك: ${updatedOrder.status}`,
          description: `تم تحديث حالة طلبك للخدمة "${updatedOrder.serviceId}" إلى "${updatedOrder.status}".`,
          link: `/client-dashboard/orders/${updatedOrder.id}`,
        });
      }
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating order', error });
  }
});

// Delete an order
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await OrderService.delete(req.params.id);
    if (deleted) {
      res.status(204).send(); // No content
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting order', error });
  }
});

export default router;