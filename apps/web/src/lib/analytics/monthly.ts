import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import type { DailyTotal, MonthlyTotal } from '@/types/database'

export interface MonthSummary {
  income: number
  expense: number
  net: number
}

/**
 * Totals for the calendar month `ref` falls in, from API-side monthly
 * aggregates.
 */
export function summariseMonth(totals: MonthlyTotal[], ref: Date): MonthSummary {
  const key = format(ref, 'yyyy-MM')
  const row = totals.find(total => total.month === key)
  if (!row) return { income: 0, expense: 0, net: 0 }
  return { income: row.income, expense: row.expense, net: row.income - row.expense }
}

/**
 * Totals for the same number of days in `ref`'s month, used for fair
 * month-over-month comparisons while the current month is still in progress.
 */
export function summariseMonthThroughDay(
  totals: DailyTotal[],
  ref: Date,
  day: number,
): MonthSummary {
  const key = format(ref, 'yyyy-MM')
  let income = 0
  let expense = 0

  for (const total of totals) {
    if (!total.date.startsWith(key)) continue
    if (Number(total.date.slice(8, 10)) > day) continue
    income += total.income
    expense += total.expense
  }

  return { income, expense, net: income - expense }
}

export interface MonthlyStat {
  month: string
  label: string
  income: number
  expense: number
  key: string
}

/** Twelve calendar months for `year`, with missing months filled as zero. */
export function monthlySeries(totals: MonthlyTotal[], year: number): MonthlyStat[] {
  const buckets = new Map<string, { income: number; expense: number }>()
  const prefix = `${year}-`

  for (let month = 1; month <= 12; month++) {
    buckets.set(`${prefix}${String(month).padStart(2, '0')}`, { income: 0, expense: 0 })
  }

  for (const total of totals) {
    if (!total.month.startsWith(prefix)) continue
    const bucket = buckets.get(total.month)
    if (!bucket) continue
    bucket.income += total.income
    bucket.expense += total.expense
  }

  return [...buckets].map(([key, values]) => ({
    month: monthLabel(key, 'MMM'),
    label: monthLabel(key, 'MMMM yyyy'),
    key,
    ...values,
  }))
}

/** Years that actually have transactions, newest first. */
export function availableYears(totals: MonthlyTotal[]): number[] {
  return [...new Set(totals.map(total => Number(total.month.slice(0, 4))))]
    .filter(year => Number.isInteger(year))
    .sort((a, b) => b - a)
}

/** Months that actually have transactions, newest first. */
export function availableMonths(totals: MonthlyTotal[]): string[] {
  return totals.map(total => total.month).sort((a, b) => b.localeCompare(a))
}

/** Months with transactions in `year`, oldest first. */
export function monthsInYear(totals: MonthlyTotal[], year: number): string[] {
  const prefix = `${year}-`
  return totals
    .filter(total => total.month.startsWith(prefix))
    .map(total => total.month)
    .sort()
}

export interface DailyStat {
  day: number
  label: string
  date: string
  income: number
  expense: number
}

function daysInMonth(ref: Date): number {
  return new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate()
}

/** Every day in `ref`'s month, with missing days filled as zero. */
export function dailySeries(totals: DailyTotal[], ref: Date): DailyStat[] {
  const monthKey = format(ref, 'yyyy-MM')
  const count = daysInMonth(ref)
  const buckets = new Map<string, { income: number; expense: number }>()

  for (let day = 1; day <= count; day++) {
    buckets.set(`${monthKey}-${String(day).padStart(2, '0')}`, { income: 0, expense: 0 })
  }

  for (const total of totals) {
    const bucket = buckets.get(total.date)
    if (!bucket) continue
    bucket.income += total.income
    bucket.expense += total.expense
  }

  return [...buckets].map(([date, values]) => {
    const parsed = new Date(`${date}T00:00:00`)
    return {
      date,
      day: parsed.getDate(),
      label: format(parsed, 'd MMM', { locale: idLocale }),
      ...values,
    }
  })
}

/** Builds a local date so labels do not shift across time zones. */
function monthLabel(key: string, pattern: string): string {
  const [year, month] = key.split('-')
  return format(new Date(Number(year), Number(month) - 1, 1), pattern, { locale: idLocale })
}
