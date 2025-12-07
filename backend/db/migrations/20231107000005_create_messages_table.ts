import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('messages', (table) => {
    table.string('id').primary();
    table.string('conversationId').notNullable().references('id').inTable('conversations').onDelete('CASCADE');
    table.string('senderId').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('text').notNullable();
    table.boolean('read').defaultTo(false);
    table.timestamp('timestamp').defaultTo(knex.fn.now());
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('messages');
}