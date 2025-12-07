import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('ratings').del();
  await knex('messages').del();
  await knex('conversations').del();
  await knex('orders').del();
  await knex('notifications').del();
  await knex('calendar_events').del();
  await knex('requests').del();
  await knex('services').del();
  await knex('users').del();

  // No dummy data will be inserted after deletion.
}