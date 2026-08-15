import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').unique().notNull(),
  password: text('password').notNull(),
  role: text('role').default('USER'),
  phone: text('phone'),
  createdAt: text('createdAt').default(new Date().toISOString()),
  updatedAt: text('updatedAt'),
});

export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').unique().notNull(),
  slug: text('slug').unique().notNull(),
  type: text('type').notNull(),
  email: text('email').unique().notNull(),
  phone: text('phone'),
  plan: text('plan').default('Freemium'),
  status: text('status').default('pending'),
  paymentStatus: text('paymentStatus').default('unpaid'),
  paymentRef: text('paymentRef'),
  createdAt: text('createdAt').default(new Date().toISOString()),
});

export const drivers = sqliteTable('drivers', {
  id: text('id').primaryKey(),
  userId: text('userId').unique().notNull(),
  organizationId: text('organizationId').notNull(),
  driverCode: text('driverCode').unique().notNull(),
  pin: text('pin').notNull(),
  vehicleId: text('vehicleId'),
  status: text('status').default('active'),
  createdAt: text('createdAt').default(new Date().toISOString()),
});

export const vehicles = sqliteTable('vehicles', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId'),
  plate: text('plate').unique().notNull(),
  model: text('model'),
  year: integer('year'),
  currentKm: integer('currentKm').default(0),
  status: text('status').default('active'),
  createdAt: text('createdAt').default(new Date().toISOString()),
});

export const maintenances = sqliteTable('maintenances', {
  id: text('id').primaryKey(),
  vehicleId: text('vehicleId').notNull(),
  type: text('type').notNull(),
  description: text('description'),
  km: integer('km').notNull(),
  cost: real('cost').default(0),
  date: text('date').default(new Date().toISOString()),
  createdAt: text('createdAt').default(new Date().toISOString()),
});
