import { format, subMonths } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import type { TxnAmount } from '@/types/database'

export const MONTH_WINDOW = 6

export interface MonthSummary {
  income: number
  expense: number
  net: number
}

/**
 * Totals for the calendar month `ref` falls in. Uses the full month, not the
 * recent list, so the figures aren't understated.
 */
export function summariseMonth(txns: TxnAmount[], ref: Date): MonthSummary {
  const key = format(ref, 'yyyy-MM')
  let income = 0
  let expense = 0

  for (const t of txns) {
    if (t.date?.slice(0, 7) !== key) continue
    if (t.type === 'income') income += Number(t.amount)
    else expense += Number(t.amount)
  }

  return { income, expense, net: income - expense }
}

export interface MonthlyStat {
  month: string
  income: number
  expense: number
}

export function monthlySeries(txns: TxnAmount[], ref: Date): MonthlyStat[] {
  const buckets = new Map<string, { income: number; expense: number }>()

  for (let i = MONTH_WINDOW - 1; i >= 0; i--) {
    buckets.set(format(subMonths(ref, i), 'yyyy-MM'), { income: 0, expense: 0 })
  }

  for (const t of txns) {
    const bucket = buckets.get(t.date?.slice(0, 7))
    if (!bucket) continue
    if (t.type === 'income') bucket.income += Number(t.amount)
    else bucket.expense += Number(t.amount)
  }

  return [...buckets].map(([key, totals]) => ({
    month: monthLabel(key),
    ...totals,
  }))
}

/** Builds a local date so the month label does not shift across time zones. */
function monthLabel(key: string): string {
  const [year, month] = key.split('-')
  return format(new Date(Number(year), Number(month) - 1, 1), 'MMM', { locale: idLocale })
}
