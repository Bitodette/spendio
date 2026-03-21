import { describe, expect, it } from 'vitest'
import {
  addMoney,
  centsToMoney,
  createTransactionSchema,
  isoDateSchema,
  moneyToCents,
  normalizeMoney,
  positiveMoneySchema,
} from '@spendio/shared'

describe('money', () => {
  it('canonicalises strings and legacy numbers to two decimals', () => {
    expect(normalizeMoney('100')).toBe('100.00')
    expect(normalizeMoney('100.5')).toBe('100.50')
    expect(normalizeMoney('-0.5')).toBe('-0.50')
    expect(normalizeMoney(1000)).toBe('1000.00')
  })

  it('rejects malformed and over-precise values', () => {
    expect(() => normalizeMoney('1,000')).toThrow()
    expect(() => normalizeMoney('1.005')).toThrow()
    expect(() => normalizeMoney('1e3')).toThrow()
    expect(() => normalizeMoney('')).toThrow()
  })

  it('converts through integer cents without float drift', () => {
    expect(moneyToCents('100.00')).toBe(10_000n)
    expect(moneyToCents('-0.50')).toBe(-50n)
    expect(centsToMoney(30n)).toBe('0.30')
    expect(addMoney('0.10', '0.20')).toBe('0.30')
    expect(addMoney('99999999999999.99', '0.01')).toBe('100000000000000.00')
  })

  it('requires transaction amounts to be positive', () => {
    expect(positiveMoneySchema.parse('100')).toBe('100.00')
    expect(positiveMoneySchema.safeParse('0').success).toBe(false)
    expect(positiveMoneySchema.safeParse('-1').success).toBe(false)
    expect(positiveMoneySchema.safeParse('1.234').success).toBe(false)
  })
})

describe('dates and zod contracts', () => {
  it('accepts only real calendar dates', () => {
    expect(isoDateSchema.parse('2024-02-29')).toBe('2024-02-29')
    expect(isoDateSchema.safeParse('2023-02-29').success).toBe(false)
    expect(isoDateSchema.safeParse('2024-13-01').success).toBe(false)
    expect(isoDateSchema.safeParse('26-10-2026').success).toBe(false)
  })

  it('normalises a transaction input amount and validates required fields', () => {
    const parsed = createTransactionSchema.parse({
      accountId: '00000000-0000-4000-8000-000000000001',
      type: 'expense',
      amount: '100',
      date: '2026-10-26',
    })
    expect(parsed.amount).toBe('100.00')
    expect(parsed.categoryId).toBeUndefined()

    expect(() =>
      createTransactionSchema.parse({
        accountId: '00000000-0000-4000-8000-000000000001',
        type: 'expense',
        amount: '100',
      }),
    ).toThrow()
  })
})
