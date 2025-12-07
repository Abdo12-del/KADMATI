import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('calendar_events', (table) => {
    table.string('id').primary();
    table.string('userId').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('title').notNullable();
    table.text('description');
    table.timestamp('start').notNullable();
    table.timestamp('end');
    table.string('type').defaultTo('appointment'); // e.g., 'appointment', 'task', 'vacation'
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('calendar_events');
}