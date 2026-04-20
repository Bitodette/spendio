import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db, pool } from './client.js'
import {
  account,
  accounts,
  budgets,
  categories,
  profiles,
  recurringTransactions,
  savingsGoals,
  transactions,
  user,
  userPreferences,
} from './schema.js'

/**
 * Local development seed. Re-running replaces the seed user and cascading data.
 * Sign in as `seed@spendio.local` / `password123`.
 */

const SEED_USER_ID = '00000000-0000-4000-8000-000000000001'
const SEED_EMAIL = 'seed@spendio.local'
const SEED_PASSWORD = 'password123'

/** Local-date `yyyy-MM-dd`; `toISOString()` would shift the day in UTC+ zones. */
function isoDate(d: Date): string {
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

const now = new Date()
const today = isoDate(now)
const yesterday = isoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))
const monthStart = isoDate(new Date(now.getFullYear(), now.getMonth(), 1))
const nextMonth = isoDate(new Date(now.getFullYear(), now.getMonth() + 1, 1))
const nextMonthFifth = isoDate(new Date(now.getFullYear(), now.getMonth() + 1, 5))
const yearEnd = `${now.getFullYear()}-12-31`

async function seed() {
  await db.transaction(async tx => {
    // Delete the profile first; its domain rows cascade.
    await tx.delete(profiles).where(eq(profiles.id, SEED_USER_ID))
    await tx.delete(user).where(eq(user.id, SEED_USER_ID))

    await tx.insert(user).values({
      id: SEED_USER_ID,
      name: 'Seed User',
      email: SEED_EMAIL,
      emailVerified: true,
    })

    // The seed user needs a credential account to log in.
    await tx.insert(account).values({
      accountId: SEED_USER_ID,
      providerId: 'credential',
      userId: SEED_USER_ID,
      password: await bcrypt.hash(SEED_PASSWORD, 12),
    })

    await tx.insert(profiles).values({
      id: SEED_USER_ID,
      fullName: 'Seed User',
      defaultCurrency: 'IDR',
    })

    const [bca, gopay] = await tx.insert(accounts).values([
      { userId: SEED_USER_ID, name: 'BCA', type: 'bank', balance: '7925000.00', icon: 'landmark', color: '#3B82F6', sortOrder: 0 },
      { userId: SEED_USER_ID, name: 'GoPay', type: 'e-wallet', balance: '975000.00', icon: 'wallet', color: '#22C55E', sortOrder: 1 },
    ]).returning()

    const [foodCategory, transportCategory, salaryCategory] = await tx.insert(categories).values([
      { userId: SEED_USER_ID, name: 'Makanan', type: 'expense', color: '#EF4444', icon: 'utensils' },
      { userId: SEED_USER_ID, name: 'Transport', type: 'expense', color: '#06B6D4', icon: 'car' },
      { userId: SEED_USER_ID, name: 'Gaji', type: 'income', color: '#22C55E', icon: 'banknote' },
    ]).returning()

    const [eatingOutCategory] = await tx.insert(categories).values({
      userId: SEED_USER_ID,
      parentId: foodCategory.id,
      name: 'Makan di Luar',
      type: 'expense',
      color: '#F97316',
      icon: 'utensils',
    }).returning()

    await tx.insert(transactions).values([
      {
        userId: SEED_USER_ID, accountId: bca.id, categoryId: salaryCategory.id,
        type: 'income', amount: '8000000.00', description: 'Gaji bulan ini', date: monthStart,
      },
      {
        userId: SEED_USER_ID, accountId: bca.id, categoryId: eatingOutCategory.id,
        type: 'expense', amount: '75000.00', description: 'Makan siang', date: today,
      },
      {
        userId: SEED_USER_ID, accountId: gopay.id, categoryId: transportCategory.id,
        type: 'expense', amount: '25000.00', description: 'Ojek online', date: yesterday,
      },
    ])

    await tx.insert(budgets).values([
      { userId: SEED_USER_ID, categoryId: foodCategory.id, amount: '1500000.00', period: 'monthly', startDate: monthStart },
      { userId: SEED_USER_ID, categoryId: transportCategory.id, amount: '500000.00', period: 'monthly', startDate: monthStart },
    ])

    await tx.insert(recurringTransactions).values([
      {
        userId: SEED_USER_ID, accountId: bca.id, categoryId: salaryCategory.id,
        type: 'income', amount: '8000000.00', description: 'Gaji',
        frequency: 'monthly', nextDate: nextMonth,
      },
      {
        userId: SEED_USER_ID, accountId: bca.id, categoryId: null,
        type: 'expense', amount: '300000.00', description: 'Internet',
        frequency: 'monthly', nextDate: nextMonthFifth,
      },
    ])

    await tx.insert(savingsGoals).values({
      userId: SEED_USER_ID,
      name: 'Dana Darurat',
      targetAmount: '20000000.00',
      currentAmount: '5000000.00',
      deadline: yearEnd,
      icon: 'piggy-bank',
      color: '#8B5CF6',
    })

    await tx.insert(userPreferences).values({
      userId: SEED_USER_ID,
      key: 'hide_balance',
      value: false,
    })

    console.log(`Seeded ${SEED_EMAIL} (${SEED_USER_ID})`)
    console.log(`  password: ${SEED_PASSWORD} (local only)`)
    console.log(`  accounts: ${bca.name}, ${gopay.name}`)
    console.log(`  categories: ${foodCategory.name}, ${eatingOutCategory.name}, ${transportCategory.name}, ${salaryCategory.name}`)
    console.log(`  budgets: 2, recurring: 2, savings: 1`)
  })
}

try {
  await seed()
} catch (err) {
  console.error('Seed failed:', err)
  process.exitCode = 1
} finally {
  await pool.end()
}
