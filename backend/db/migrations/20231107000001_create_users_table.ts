import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', (table) => {
    table.string('id').primary();
    table.string('name').notNullable();
    table.string('email').notNullable().unique();
    table.string('password').notNullable(); // In a real app, this should be hashed
    table.string('role').notNullable(); // 'seeker' or 'provider'
    table.string('phone');
    table.string('providerType'); // e.g., 'craftsman-card', 'commercial-register', 'freelancer'
    table.string('idNumber'); // ID card or commercial register number
    table.string('address');
    table.string('avatarUrl');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('users');
}