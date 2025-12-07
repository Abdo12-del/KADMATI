import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('requests', (table) => {
    table.string('id').primary();
    table.string('clientId').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('title').notNullable();
    table.text('description').notNullable();
    table.string('location');
    table.string('dueDate'); // Can be a date string or description
    table.text('additionalOptions');
    table.string('status').defaultTo('Pending'); // e.g., 'Pending', 'Accepted', 'Completed', 'Cancelled'
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('requests');
}