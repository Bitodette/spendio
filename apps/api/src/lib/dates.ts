import {
  addMonths,
  addWeeks,
  addYears,
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
} from 'date-fns'
import type { DateRange, Frequency } from '@spendio/shared'

/** Server-local calendar date. Set `TZ` in production to the user base timezone. */
export function todayIso(now = new Date()): string {
  return format(now, 'yyyy-MM-dd')
}

export function dateWindow(
  range: DateRange,
  now = new Date(),
): { start: string; end: string } {
  switch (range) {
    case 'today':
      return { start: todayIso(now), end: todayIso(now) }
    case 'week':
      return { start: format(subDays(now, 7), 'yyyy-MM-dd'), end: todayIso(now) }
    case 'month':
      return {
        start: format(startOfMonth(now), 'yyyy-MM-dd'),
        end: format(endOfMonth(now), 'yyyy-MM-dd'),
      }
    case 'all':
      return { start: '2000-01-01', end: '2099-12-31' }
  }
}

/**
 * Budget periods follow the web page's control: `monthOffset` 0 is the current
 * month, 1 is the month before it. Yearly budgets always use the current year.
 */
export function budgetWindow(
  period: 'monthly' | 'yearly',
  monthOffset: number,
  now = new Date(),
): { start: string; end: string } {
  if (period === 'yearly') {
    return {
      start: format(startOfYear(now), 'yyyy-MM-dd'),
      end: format(endOfYear(now), 'yyyy-MM-dd'),
    }
  }

  const ref = subMonths(now, monthOffset)
  return {
    start: format(startOfMonth(ref), 'yyyy-MM-dd'),
    end: format(endOfMonth(ref), 'yyyy-MM-dd'),
  }
}

export function currentMonthBounds(now = new Date()): { start: string; end: string } {
  return {
    start: format(startOfMonth(now), 'yyyy-MM-dd'),
    end: format(addMonths(startOfMonth(now), 1), 'yyyy-MM-dd'),
  }
}

function dateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function nextFrequencyDate(current: string, frequency: Frequency): string {
  const date = dateOnly(current)
  if (frequency === 'weekly') return format(addWeeks(date, 1), 'yyyy-MM-dd')
  if (frequency === 'monthly') return format(addMonths(date, 1), 'yyyy-MM-dd')
  return format(addYears(date, 1), 'yyyy-MM-dd')
}

export function parseNow(value?: string): Date {
  if (!value) return new Date()
  return dateOnly(value)
}
