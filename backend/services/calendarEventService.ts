import knex from '../db';
import { CalendarEvent } from '../models/calendarEventModel';
import { v4 as uuidv4 } from 'uuid';

class CalendarEventService {
  private tableName = 'calendar_events';

  async create(event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<CalendarEvent> {
    const newEvent = { id: uuidv4(), ...event };
    await knex(this.tableName).insert(newEvent);
    return newEvent;
  }

  async findByUserId(userId: string): Promise<CalendarEvent[]> {
    return knex(this.tableName).where({ userId }).orderBy('start', 'asc').select('*');
  }

  async findById(id: string): Promise<CalendarEvent | undefined> {
    return knex(this.tableName).where({ id }).first();
  }

  async update(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | undefined> {
    await knex(this.tableName).where({ id }).update({ ...updates, updatedAt: knex.fn.now() });
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const deletedCount = await knex(this.tableName).where({ id }).delete();
    return deletedCount > 0;
  }
}

export default new CalendarEventService();