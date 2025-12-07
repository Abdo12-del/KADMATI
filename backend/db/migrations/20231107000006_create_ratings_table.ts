import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('ratings', (table) => {
    table.string('id').primary();
    table.string('serviceId').notNullable().references('id').inTable('services').onDelete('CASCADE');
    table.string('clientId').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('rating').notNullable(); // 1-5 stars
    table.text('comment');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('ratings');
}