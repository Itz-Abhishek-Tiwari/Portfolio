import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const portfolio = sqliteTable('portfolio', { id: text('id').primaryKey(), draft: text('draft').notNull(), published: text('published').notNull(), revision: integer('revision').notNull().default(1), updatedAt: text('updated_at').notNull() });
export const githubCache = sqliteTable('github_cache', { id:text('id').primaryKey(), payload:text('payload').notNull(), fetchedAt:integer('fetched_at').notNull() });
