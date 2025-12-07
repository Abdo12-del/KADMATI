import knex from '../db';
import { Notification } from '../models/notificationModel';
import { v4 as uuidv4 } from 'uuid';

class NotificationService {
  private tableName = 'notifications';

  async create(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'read'>): Promise<Notification> {
    const newNotification = { id: uuidv4(), ...notification, read: false };
    await knex(this.tableName).insert(newNotification);
    return newNotification;
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    return knex(this.tableName).where({ userId }).orderBy('createdAt', 'desc').select('*');
  }

  async getUnreadCountForUser(userId: string): Promise<number> {
    const unread = await knex(this.tableName)
      .where({ userId, read: false })
      .count('id as unreadCount')
      .first();
    return parseInt(unread?.unreadCount as string || '0', 10);
  }

  async markAsRead(id: string): Promise<boolean> {
    const updatedCount = await knex(this.tableName).where({ id }).update({ read: true, updatedAt: knex.fn.now() });
    return updatedCount > 0;
  }

  async markAllAsReadForUser(userId: string): Promise<number> {
    const updatedCount = await knex(this.tableName).where({ userId, read: false }).update({ read: true, updatedAt: knex.fn.now() });
    return updatedCount;
  }

  async delete(id: string): Promise<boolean> {
    const deletedCount = await knex(this.tableName).where({ id }).delete();
    return deletedCount > 0;
  }
}

export default new NotificationService();