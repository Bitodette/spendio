import { sql } from 'drizzle-orm'
import type { AccountType, BudgetPeriod, Frequency, TxType } from '@spendio/shared'
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'

/**
 * Schema conventions:
 * - snake_case columns, camelCase TypeScript fields.
 * - Money is `numeric(16,2)` and stays a string in TypeScript. Balance changes
 *   use SQL, never JavaScript arithmetic.
 * - `updated_at` is maintained by the `set_updated_at()` trigger.
 */

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}

// Better Auth tables. UUID ids keep imported users and their references stable.

export const user = pgTable('user', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  ...timestamps,
})

export const session = pgTable('session', {
  id: uuid('id').primaryKey().defaultRandom(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  ...timestamps,
}, table => [
  index('session_user_id_idx').on(table.userId),
])

export const account = pgTable('account', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  password: text('password'),
  ...timestamps,
}, table => [
  index('account_user_id_idx').on(table.userId),
  uniqueIndex('account_provider_account_idx').on(table.providerId, table.accountId),
])

export const verification = pgTable('verification', {
  id: uuid('id').primaryKey().defaultRandom(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ...timestamps,
}, table => [
  index('verification_identifier_idx').on(table.identifier),
])

export const profiles = pgTable('profiles', {
  id: uuid('id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  defaultCurrency: text('default_currency').default('IDR').notNull(),
  ...timestamps,
})

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').$type<AccountType>().notNull(),
  balance: numeric('balance', { precision: 16, scale: 2 }).default('0').notNull(),
  icon: text('icon'),
  color: text('color'),
  sortOrder: integer('sort_order').default(0).notNull(),
  ...timestamps,
}, table => [
  index('accounts_user_sort_idx').on(table.userId, table.sortOrder),
  check('accounts_type_check', sql`${table.type} in ('bank', 'e-wallet', 'cash')`),
])

/** Categories, optionally nested one level through `parent_id`. */
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id').references((): AnyPgColumn => categories.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  icon: text('icon'),
  color: text('color'),
  type: text('type').$type<TxType>().notNull(),
  ...timestamps,
}, table => [
  index('categories_user_id_idx').on(table.userId),
  index('categories_parent_id_idx').on(table.parentId),
  check('categories_type_check', sql`${table.type} in ('income', 'expense')`),
])

/** Reserved for tagging; not yet exposed in the UI. */
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color'),
  ...timestamps,
}, table => [
  index('tags_user_id_idx').on(table.userId),
])

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  type: text('type').$type<TxType>().notNull(),
  amount: numeric('amount', { precision: 16, scale: 2 }).notNull(),
  description: text('description'),
  date: date('date', { mode: 'string' }).notNull(),
  ...timestamps,
}, table => [
  index('transactions_user_date_idx').on(table.userId, table.date.desc()),
  index('transactions_user_account_idx').on(table.userId, table.accountId),
  index('transactions_user_category_idx').on(table.userId, table.categoryId),
  check('transactions_type_check', sql`${table.type} in ('income', 'expense')`),
  check('transactions_amount_check', sql`${table.amount} > 0`),
])

export const transactionTags = pgTable('transaction_tags', {
  transactionId: uuid('transaction_id')
    .notNull()
    .references(() => transactions.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id')
    .notNull()
    .references(() => tags.id, { onDelete: 'cascade' }),
}, table => [
  primaryKey({ columns: [table.transactionId, table.tagId] }),
  index('transaction_tags_tag_id_idx').on(table.tagId),
])

export const budgets = pgTable('budgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 16, scale: 2 }).notNull(),
  period: text('period').$type<BudgetPeriod>().notNull(),
  startDate: date('start_date', { mode: 'string' }).notNull(),
  ...timestamps,
}, table => [
  index('budgets_user_period_idx').on(table.userId, table.period),
  check('budgets_period_check', sql`${table.period} in ('monthly', 'yearly')`),
  check('budgets_amount_check', sql`${table.amount} > 0`),
])

export const recurringTransactions = pgTable('recurring_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  type: text('type').$type<TxType>().notNull(),
  amount: numeric('amount', { precision: 16, scale: 2 }).notNull(),
  description: text('description'),
  frequency: text('frequency').$type<Frequency>().notNull(),
  nextDate: date('next_date', { mode: 'string' }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  ...timestamps,
}, table => [
  index('recurring_user_next_date_idx').on(table.userId, table.nextDate),
  check('recurring_type_check', sql`${table.type} in ('income', 'expense')`),
  check('recurring_frequency_check', sql`${table.frequency} in ('weekly', 'monthly', 'yearly')`),
  check('recurring_amount_check', sql`${table.amount} > 0`),
])

export const savingsGoals = pgTable('savings_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  targetAmount: numeric('target_amount', { precision: 16, scale: 2 }).notNull(),
  currentAmount: numeric('current_amount', { precision: 16, scale: 2 }).default('0').notNull(),
  deadline: date('deadline', { mode: 'string' }),
  icon: text('icon'),
  color: text('color'),
  ...timestamps,
}, table => [
  index('savings_goals_user_id_idx').on(table.userId),
  check('savings_goals_current_amount_check', sql`${table.currentAmount} >= 0`),
])

export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  key: text('key').notNull(),
  value: jsonb('value').default(sql`'null'::jsonb`).notNull(),
  ...timestamps,
}, table => [
  uniqueIndex('user_preferences_user_key_idx').on(table.userId, table.key),
])

export type User = typeof user.$inferSelect
export type Profile = typeof profiles.$inferSelect
export type Account = typeof accounts.$inferSelect
export type Category = typeof categories.$inferSelect
export type Transaction = typeof transactions.$inferSelect
export type Budget = typeof budgets.$inferSelect
export type RecurringTransaction = typeof recurringTransactions.$inferSelect
export type SavingsGoal = typeof savingsGoals.$inferSelect
export type UserPreference = typeof userPreferences.$inferSelect
