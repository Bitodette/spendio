'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ChartTooltip } from '@/components/dashboard/ChartTooltip'
import type { MonthlyStat } from '@/lib/analytics/monthly'

export function MonthlyTrendCard({ stats }: { stats: MonthlyStat[] }) {
  const empty = stats.every(s => s.income === 0 && s.expense === 0)

  return (
    <div className="md:col-span-3 rounded-xl border border-border bg-card p-5">
      <div className="mb-1">
        <h2 className="font-heading text-sm font-semibold text-foreground">Monthly</h2>
        <p className="text-xs text-muted-foreground">Last 6 months</p>
      </div>

      {empty ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-sm text-muted-foreground">No data yet</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={stats} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.005 85)" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: 'oklch(0.5 0.01 260)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'oklch(0.5 0.01 260)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
              width={35}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={28}
              formatter={(value: string) => <span className="text-[10px] text-muted-foreground">{value}</span>}
            />
            <Bar dataKey="income" name="Income" fill="#10B981" radius={[3, 3, 0, 0]} />
            <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
