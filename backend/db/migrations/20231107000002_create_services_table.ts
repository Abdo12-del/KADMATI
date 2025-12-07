import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('services', (table) => {
    table.string('id').primary();
    table.string('providerId').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('title').notNullable();
    table.text('description').notNullable();
    table.string('category').notNullable();
    table.decimal('price', 10, 2).notNullable();
    table.integer('deliveryTime').notNullable(); // in days
    table.string('imageUrl');
    table.decimal('rating', 2, 1).defaultTo(0.0);
    table.integer('reviewsCount').defaultTo(0);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('services');
}