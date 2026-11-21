import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
export const vehicles = sqliteTable('vehicles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  seedKey: text('seed_key').unique(),
  revision: integer('revision').notNull().default(1),
  status: text('status').notNull().default('brouillon'),
  data: text('data').notNull(),
  deleted: integer('deleted').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
});
export const photos = sqliteTable('photos', {
  id: text('id').primaryKey(),
  mime: text('mime').notNull(),
  size: integer('size').notNull(),
  createdAt: text('created_at').notNull()
});
export const equipment = sqliteTable('equipment', {
  name: text('name').primaryKey()
});
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull()
});
