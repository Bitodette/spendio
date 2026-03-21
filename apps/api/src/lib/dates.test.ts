import { describe, expect, it } from 'vitest'
import {
  budgetWindow,
  dashboardWindowStart,
  dateWindow,
  nextFrequencyDate,
  parseNow,
  todayIso,
} from './dates.js'

const now = new Date(2026, 9, 26, 12, 0, 0)

describe('dateWindow', () => {
  it('builds inclusive today and week windows', () => {
    expect(todayIso(now)).toBe('2026-10-26')
    expect(dateWindow('today', now)).toEqual({ start: '2026-10-26', end: '2026-10-26' })
    expect(dateWindow('week', now)).toEqual({ start: '2026-10-19', end: '2026-10-26' })
  })

  it('covers the full current month and the legacy all-time bounds', () => {
    expect(dateWindow('month', now)).toEqual({ start: '2026-10-01', end: '2026-10-31' })
    expect(dateWindow('all', now)).toEqual({ start: '2000-01-01', end: '2099-12-31' })
  })
})

describe('budget and dashboard windows', () => {
  it('maps monthOffset 0 to the current month and 1 to the previous month', () => {
    expect(budgetWindow('monthly', 0, now)).toEqual({ start: '2026-10-01', end: '2026-10-31' })
    expect(budgetWindow('monthly', 1, now)).toEqual({ start: '2026-09-01', end: '2026-09-30' })
  })

  it('uses the current calendar year for yearly budgets', () => {
    expect(budgetWindow('yearly', 3, now)).toEqual({ start: '2026-01-01', end: '2026-12-31' })
  })

  it('starts the dashboard trend six months back, including the current month', () => {
    expect(dashboardWindowStart(6, now)).toBe('2026-05-26')
  })
})

describe('recurring dates', () => {
  it('advances by the configured frequency', () => {
    expect(nextFrequencyDate('2026-10-26', 'weekly')).toBe('2026-11-02')
    expect(nextFrequencyDate('2026-01-31', 'monthly')).toBe('2026-02-28')
    expect(nextFrequencyDate('2026-10-26', 'yearly')).toBe('2027-10-26')
  })

  it('parses the optional dashboard now parameter as a local date', () => {
    const parsed = parseNow('2026-10-26')
    expect(parsed.getFullYear()).toBe(2026)
    expect(parsed.getMonth()).toBe(9)
    expect(parsed.getDate()).toBe(26)
  })
})
