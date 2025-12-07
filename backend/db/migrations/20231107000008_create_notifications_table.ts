import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('notifications', (table) => {
    table.string('id').primary();
    table.string('userId').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('type').notNullable(); // e.g., 'order', 'message', 'payment', 'system'
    table.string('title').notNullable();
    table.text('description').notNullable();
    table.boolean('read').defaultTo(false);
    table.string('link'); // Optional link to related page
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('notifications');
}