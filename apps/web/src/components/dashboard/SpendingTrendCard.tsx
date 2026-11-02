'use client'

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartTooltip } from '@/components/dashboard/ChartTooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  availableMonths,
  availableYears,
  dailySeries,
  monthlySeries,
  monthsInYear,
} from '@/lib/analytics/monthly'
import { formatCurrency } from '@/lib/utils'
import type { DailyTotal, MonthlyTotal } from '@/types/database'

type Mode = 'monthly' | 'daily'

function compactCurrency(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.0', '')}M`
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`
  return String(value)
}

function monthName(key: string): string {
  const [year, month] = key.split('-').map(Number)
  return format(new Date(year, month - 1, 1), 'MMMM', { locale: idLocale })
}

export function SpendingTrendCard({
  monthlyTotals,
  dailyTotals,
  now,
}: {
  monthlyTotals: MonthlyTotal[]
  dailyTotals: DailyTotal[]
  now: Date
}) {
  const years = useMemo(() => {
    const available = availableYears(monthlyTotals)
    return available.length > 0 ? available : [now.getFullYear()]
  }, [monthlyTotals, now])

  const [mode, setMode] = useState<Mode>('monthly')
  const [selectedYear, setSelectedYear] = useState(() => years[0])
  const [selectedMonth, setSelectedMonth] = useState(
    () => availableMonths(monthlyTotals)[0] ?? format(now, 'yyyy-MM'),
  )

  const activeYear = years.includes(selectedYear) ? selectedYear : years[0]
  const monthsForYear = useMemo(
    () => monthsInYear(monthlyTotals, activeYear),
    [monthlyTotals, activeYear],
  )
  const fallbackMonth = `${activeYear}-${format(now, 'MM')}`
  const activeMonth = monthsForYear.length > 0
    ? (monthsForYear.includes(selectedMonth) ? selectedMonth : monthsForYear[monthsForYear.length - 1])
    : fallbackMonth
  const monthChoices = monthsForYear.length > 0 ? monthsForYear : [fallbackMonth]

  const monthlyData = useMemo(
    () => monthlySeries(monthlyTotals, activeYear),
    [monthlyTotals, activeYear],
  )
  const activeMonthDate = useMemo(() => {
    const [year, month] = activeMonth.split('-').map(Number)
    return new Date(year, month - 1, 1)
  }, [activeMonth])
  const dailyData = useMemo(
    () => dailySeries(dailyTotals, activeMonthDate),
    [dailyTotals, activeMonthDate],
  )

  const series = mode === 'monthly'
    ? monthlyData.map(point => ({
        axis: point.month,
        label: point.label,
        income: point.income,
        expense: point.expense,
      }))
    : dailyData.map(point => ({
        axis: String(point.day),
        label: point.label,
        income: point.income,
        expense: point.expense,
      }))
  const empty = series.every(point => point.income === 0 && point.expense === 0)
  const totalExpense = series.reduce((sum, point) => sum + point.expense, 0)
  const totalIncome = series.reduce((sum, point) => sum + point.income, 0)
  const averageExpense = series.length > 0 ? totalExpense / series.length : 0
  const selectedMonthLabel = format(activeMonthDate, 'MMMM yyyy', { locale: idLocale })

  return (
    <div className="md:col-span-3 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-heading text-sm font-semibold text-foreground">Spending trend</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {mode === 'monthly' ? activeYear : selectedMonthLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={String(activeYear)} onValueChange={value => setSelectedYear(Number(value))}>
            <SelectTrigger size="sm" className="w-[80px] text-xs" aria-label="Select year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              position="popper"
              align="start"
              sideOffset={4}
              className="w-fit min-w-max"
            >
              {years.map(year => (
                <SelectItem key={year} value={String(year)} className="whitespace-nowrap">{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {mode === 'daily' && (
            <Select value={activeMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger size="sm" className="w-[124px] text-xs" aria-label="Select month">
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                position="popper"
                align="start"
                sideOffset={4}
                className="w-fit min-w-max"
              >
                {monthChoices.map(key => (
                  <SelectItem key={key} value={key} className="whitespace-nowrap">{monthName(key)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Tabs value={mode} onValueChange={value => setMode(value as Mode)}>
            <TabsList className="h-8">
              <TabsTrigger value="monthly" className="px-2.5 text-[11px]">Monthly</TabsTrigger>
              <TabsTrigger value="daily" className="px-2.5 text-[11px]">Daily</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border pb-4">
        <div className="flex items-baseline gap-2">
          <p className="font-heading text-2xl font-semibold tabular-nums text-foreground">
            {formatCurrency(totalExpense)}
          </p>
          <p className="text-xs text-muted-foreground">spent</p>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <span>avg {formatCurrency(averageExpense)} / {mode === 'daily' ? 'day' : 'month'}</span>
          <span className="hidden items-center gap-1.5 sm:flex">
            <span className="h-2 w-2 rounded-sm bg-[var(--color-chart-1)]" />
            Income
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-[var(--color-chart-5)]" />
            Expense
          </span>
        </div>
      </div>

      {empty ? (
        <div className="flex h-[220px] flex-col items-center justify-center text-center">
          <p className="text-sm text-muted-foreground">
            {mode === 'monthly' ? `No transactions in ${activeYear}` : `No transactions in ${selectedMonthLabel}`}
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={series}
            barGap={2}
            barCategoryGap={mode === 'daily' ? '20%' : '28%'}
            margin={{ top: 8, right: 4, bottom: 0, left: 0 }}
          >
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="axis"
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={mode === 'daily' ? 4 : 0}
            />
            <YAxis
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={compactCurrency}
              allowDecimals={false}
              width={40}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--color-muted)', opacity: 0.35 }} />
            <ReferenceLine
              y={averageExpense}
              stroke="var(--color-muted-foreground)"
              strokeDasharray="4 4"
              strokeOpacity={0.45}
            />
            <Bar
              dataKey="income"
              name="Income"
              fill="var(--color-chart-1)"
              radius={[2, 2, 0, 0]}
              maxBarSize={mode === 'daily' ? 10 : 18}
            />
            <Bar
              dataKey="expense"
              name="Expense"
              fill="var(--color-chart-5)"
              radius={[2, 2, 0, 0]}
              maxBarSize={mode === 'daily' ? 10 : 18}
            />
          </BarChart>
        </ResponsiveContainer>
      )}

      {!empty && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Income {formatCurrency(totalIncome)} across the period
        </p>
      )}
    </div>
  )
}
