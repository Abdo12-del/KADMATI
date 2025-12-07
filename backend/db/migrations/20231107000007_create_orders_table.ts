import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('orders', (table) => {
    table.string('id').primary();
    table.string('serviceId').notNullable().references('id').inTable('services').onDelete('CASCADE');
    table.string('clientId').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('providerId').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.decimal('price', 10, 2).notNullable();
    table.string('status').defaultTo('Pending'); // e.g., 'Pending', 'Accepted', 'Completed', 'Cancelled'
    table.text('details');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('orders');
}