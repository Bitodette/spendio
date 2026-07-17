'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import {
  TrendingUp, TrendingDown, CreditCard, Plus,
  Wallet, Landmark, Banknote, ArrowRightLeft, Eye, EyeOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'
import { TransferDialog } from '@/components/dashboard/TransferDialog'
import { ExpenseByCategoryCard } from '@/components/dashboard/ExpenseByCategoryCard'
import { MonthlyTrendCard } from '@/components/dashboard/MonthlyTrendCard'
import { RecentTransactionsCard } from '@/components/dashboard/RecentTransactionsCard'
import { ErrorNotice } from '@/components/ui/error-notice'
import { useAuth } from '@/lib/auth'
import { getPreference, setPreference } from '@/lib/api/preferences'
import { fetchDashboardData } from '@/lib/api/dashboard'
import { buildExpenseChart, type CategorySlice } from '@/lib/analytics/categories'
import { monthlySeries, summariseMonth, type MonthlyStat } from '@/lib/analytics/monthly'
import { queryKeys } from '@/lib/query-keys'
import { cn, formatCurrency } from '@/lib/utils'
import type { Account, RecentTransaction } from '@/types/database'

const ACCOUNT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'credit-card': CreditCard,
  'wallet': Wallet,
  'landmark': Landmark,
  'banknote': Banknote,
}

function getAccountIcon(iconName: string | null) {
  return ACCOUNT_ICONS[iconName || 'landmark'] || Landmark
}

interface Summary {
  totalBalance: number
  monthlyIncome: number
  monthlyExpense: number
  monthlyNet: number
}

interface DashboardView {
  summary: Summary
  accounts: Account[]
  recent: RecentTransaction[]
  categoryNames: Record<string, string>
  chart: CategorySlice[]
  monthly: MonthlyStat[]
}


export default function DashboardPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [hideBalanceOverride, setHideBalanceOverride] = useState<boolean | null>(null)
  const [transferOpen, setTransferOpen] = useState(false)

  const dashboardQuery = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async (): Promise<DashboardView> => {
      const now = new Date()
      const { accounts, recent, allMonthly, categories } = await fetchDashboardData(now)
      const { income, expense, net } = summariseMonth(allMonthly, now)

      return {
        summary: {
          totalBalance: accounts.reduce((sum, a) => sum + Number(a.balance || 0), 0),
          monthlyIncome: income,
          monthlyExpense: expense,
          monthlyNet: net,
        },
        accounts,
        recent,
        categoryNames: Object.fromEntries(categories.map(c => [c.id, c.name])),
        chart: buildExpenseChart(allMonthly, categories),
        monthly: monthlySeries(allMonthly, now),
      }
    },
    enabled: Boolean(user),
  })
  const preferenceQuery = useQuery({
    queryKey: queryKeys.preferences.detail('hide_balance'),
    queryFn: () => getPreference<boolean>('hide_balance'),
    enabled: Boolean(user),
  })

  const view = dashboardQuery.data ?? null
  const hideBalance = hideBalanceOverride ?? (
    preferenceQuery.isError && preferenceQuery.data === undefined
      ? true
      : Boolean(preferenceQuery.data)
  )

  const preferenceMutation = useMutation({
    mutationFn: (value: boolean) => setPreference('hide_balance', value),
    onMutate: value => {
      const previous = hideBalanceOverride
      setHideBalanceOverride(value)
      return { previous }
    },
    onError: (_error, _value, context) => {
      setHideBalanceOverride(context?.previous ?? null)
    },
    onSuccess: (_data, value) => {
      queryClient.setQueryData(queryKeys.preferences.detail('hide_balance'), value)
    },
  })

  const savePreference = (value: boolean) => {
    if (!user) return
    preferenceMutation.mutate(value)
  }

  if (!user) return null
  // Keep the last good view on refresh errors; show the error only when empty.
  if (!view) {
    return dashboardQuery.isError
      ? <ErrorNotice error={dashboardQuery.error} onRetry={() => dashboardQuery.refetch()} />
      : <DashboardSkeleton />
  }

  // Wait for the saved privacy preference before rendering balances so a hidden
  // dashboard does not briefly show real amounts on first load.
  if (preferenceQuery.isPending) return <DashboardSkeleton />

  const { summary, accounts, recent, categoryNames, chart, monthly } = view
  const mask = (value: number) => (hideBalance ? '••••••' : formatCurrency(value))
  const maskSigned = (value: number) =>
    hideBalance ? '••••••' : `${value >= 0 ? '+' : ''}${formatCurrency(value)}`

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monthly financial summary {format(new Date(), 'MMMM yyyy', { locale: idLocale })}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label={hideBalance ? 'Show balances' : 'Hide balances'}
          className="h-9 w-9 shrink-0 !active:translate-y-0"
          onClick={() => savePreference(!hideBalance)}
        >
          <span className="relative flex h-4 w-4 items-center justify-center">
            {hideBalance ? <EyeOff className="absolute h-4 w-4" /> : <Eye className="absolute h-4 w-4" />}
          </span>
        </Button>
      </div>

      {preferenceQuery.isError && (
        <ErrorNotice
          error={preferenceQuery.error}
          onRetry={() => preferenceQuery.refetch()}
        />
      )}

      {preferenceMutation.error && <ErrorNotice error={preferenceMutation.error} />}

      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Total Balance</p>
        <p className="font-heading text-4xl font-bold text-foreground tracking-tight">{mask(summary.totalBalance)}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border rounded-xl overflow-hidden">
        <div className="bg-card p-3 sm:p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Income</p>
          </div>
          <p className="font-heading text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{mask(summary.monthlyIncome)}</p>
        </div>
        <div className="bg-card p-3 sm:p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Expense</p>
          </div>
          <p className="font-heading text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums">{mask(summary.monthlyExpense)}</p>
        </div>
        <div className="bg-card p-3 sm:p-5">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Net</p>
          </div>
          <p className={cn('font-heading text-xl sm:text-2xl font-bold tabular-nums', hideBalance ? 'text-foreground' : (summary.monthlyNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'))}>
            {maskSigned(summary.monthlyNet)}
          </p>
        </div>
      </div>

      {accounts.length > 0 && (
        <div>
          <div className="mb-3">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Accounts</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-none">
            {accounts.map(acc => {
              const Icon = getAccountIcon(acc.icon)
              const color = acc.color || '#10B981'
              return (
                <div
                  key={acc.id}
                  className="snap-start shrink-0 w-[160px] sm:w-auto sm:flex-1 sm:min-w-0 sm:max-w-[calc(33.333%-0.375rem)] rounded-xl border border-border bg-card p-3 hover:shadow-sm transition-shadow cursor-default"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15`, color }}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground truncate flex-1">{acc.name}</span>
                  </div>
                  <p className={cn(
                    'font-heading text-base font-bold tabular-nums',
                    acc.balance < 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground'
                  )}>
                    {mask(acc.balance)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Link href="/transactions" className="flex-1">
          <Button variant="outline" className="w-full gap-2 h-11 rounded-xl font-medium text-sm">
            <Plus className="h-4 w-4" /> New Transaction
          </Button>
        </Link>
        <Button variant="outline" className="flex-1 gap-2 h-11 rounded-xl font-medium text-sm" onClick={() => setTransferOpen(true)}>
          <ArrowRightLeft className="h-4 w-4" /> Transfer
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        <ExpenseByCategoryCard slices={chart} />
        <MonthlyTrendCard stats={monthly} />
      </div>

      <RecentTransactionsCard transactions={recent} categoryNames={categoryNames} />

      <TransferDialog
        accounts={accounts}
        open={transferOpen}
        onOpenChange={setTransferOpen}
      />
    </div>
  )
}
