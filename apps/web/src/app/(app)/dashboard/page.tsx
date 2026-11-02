'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { format, subMonths } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import {
  TrendingUp, TrendingDown, CreditCard, ArrowUpRight, Plus,
  Wallet, Landmark, Banknote, ArrowRightLeft, Edit, Eye, EyeOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'
import { TransferDialog } from '@/components/dashboard/TransferDialog'
import { TransactionDialog } from '@/components/transactions/TransactionDialog'
import { ExpenseByCategoryCard } from '@/components/dashboard/ExpenseByCategoryCard'
import { SpendingTrendCard } from '@/components/dashboard/SpendingTrendCard'
import { RecentTransactionsCard } from '@/components/dashboard/RecentTransactionsCard'
import { ErrorNotice } from '@/components/ui/error-notice'
import { useAuth } from '@/lib/auth'
import { getPreference, setPreference } from '@/lib/api/preferences'
import { fetchDashboardData } from '@/lib/api/dashboard'
import { buildExpenseChart, type CategorySlice } from '@/lib/analytics/categories'
import {
  summariseMonth,
  summariseMonthThroughDay,
} from '@/lib/analytics/monthly'
import { queryKeys } from '@/lib/query-keys'
import { cn, formatCurrency } from '@/lib/utils'
import type {
  Account,
  CategoryWithColor,
  DailyTotal,
  MonthlyTotal,
  RecentTransaction,
} from '@/types/database'

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
  previousIncome: number
  previousExpense: number
  previousNet: number
}

interface DashboardView {
  summary: Summary
  accounts: Account[]
  recent: RecentTransaction[]
  categoryNames: Record<string, string>
  categories: CategoryWithColor[]
  chart: CategorySlice[]
  monthlyTotals: MonthlyTotal[]
  dailyTotals: DailyTotal[]
  now: Date
}

function MonthChange({
  current,
  previous,
  invert = false,
  absolute = false,
}: {
  current: number
  previous: number
  invert?: boolean
  absolute?: boolean
}) {
  // Without a previous-month baseline there is no meaningful comparison, so
  // show nothing instead of filler copy on every card.
  if (previous === 0) return null

  const delta = current - previous

  if (delta === 0) {
    return (
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        Unchanged vs same period last month
      </p>
    )
  }

  const good = invert ? delta <= 0 : delta >= 0
  const value = absolute
    ? `${delta >= 0 ? '+' : '-'}${formatCurrency(Math.abs(delta))}`
    : `${delta >= 0 ? '+' : ''}${((delta / Math.abs(previous)) * 100).toFixed(1)}%`

  return (
    <p className="mt-1.5 text-[11px] text-muted-foreground">
      <span className={cn(
        'font-medium tabular-nums',
        good ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
      )}>
        {value}
      </span>{' '}
      vs same period last month
    </p>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [hideBalanceOverride, setHideBalanceOverride] = useState<boolean | null>(null)
  const [transferOpen, setTransferOpen] = useState(false)
  const [transactionOpen, setTransactionOpen] = useState(false)

  const dashboardQuery = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async (): Promise<DashboardView> => {
      const now = new Date()
      const { accounts, recent, currentMonth, monthlyTotals, dailyTotals, categories } = await fetchDashboardData(now)
      const { income, expense, net } = summariseMonth(monthlyTotals, now)
      const previous = summariseMonthThroughDay(dailyTotals, subMonths(now, 1), now.getDate())

      return {
        summary: {
          totalBalance: accounts.reduce((sum, a) => sum + Number(a.balance || 0), 0),
          monthlyIncome: income,
          monthlyExpense: expense,
          monthlyNet: net,
          previousIncome: previous.income,
          previousExpense: previous.expense,
          previousNet: previous.net,
        },
        accounts,
        recent,
        categoryNames: Object.fromEntries(categories.map(c => [c.id, c.name])),
        categories,
        chart: buildExpenseChart(currentMonth, categories),
        monthlyTotals,
        dailyTotals,
        now,
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

  const { summary, accounts, recent, categoryNames, categories, chart, monthlyTotals, dailyTotals, now } = view
  const periodLabel = format(now, 'MMMM yyyy', { locale: idLocale })
  const mask = (value: number) => (hideBalance ? '••••••' : formatCurrency(value))
  const maskSigned = (value: number) =>
    hideBalance ? '••••••' : `${value >= 0 ? '+' : ''}${formatCurrency(value)}`

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {periodLabel} overview
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
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Total balance</p>
        <p className="font-heading text-4xl font-bold tracking-tight text-foreground">{mask(summary.totalBalance)}</p>
      </div>

      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
        <div className="bg-card p-3 sm:p-5">
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Income</p>
          </div>
          <p className="font-heading text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 sm:text-2xl">{mask(summary.monthlyIncome)}</p>
          {!hideBalance && (
            <MonthChange current={summary.monthlyIncome} previous={summary.previousIncome} />
          )}
        </div>
        <div className="bg-card p-3 sm:p-5">
          <div className="mb-2 flex items-center gap-2">
            <TrendingDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Expense</p>
          </div>
          <p className="font-heading text-xl font-bold tabular-nums text-red-600 dark:text-red-400 sm:text-2xl">{mask(summary.monthlyExpense)}</p>
          {!hideBalance && (
            <MonthChange current={summary.monthlyExpense} previous={summary.previousExpense} invert />
          )}
        </div>
        <div className="bg-card p-3 sm:p-5">
          <div className="mb-2 flex items-center gap-2">
            <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Net</p>
          </div>
          <p className={cn(
            'font-heading text-xl font-bold tabular-nums sm:text-2xl',
            hideBalance
              ? 'text-foreground'
              : (summary.monthlyNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'),
          )}>
            {maskSigned(summary.monthlyNet)}
          </p>
          {!hideBalance && (
            <MonthChange current={summary.monthlyNet} previous={summary.previousNet} absolute />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {accounts.length > 0 ? (
          <Button
            className="col-span-2 h-10 gap-2 sm:col-span-1"
            onClick={() => setTransactionOpen(true)}
          >
            <Plus className="h-4 w-4" /> New transaction
          </Button>
        ) : (
          <Button asChild className="col-span-2 h-10 gap-2 sm:col-span-1">
            <Link href="/accounts">
              <Plus className="h-4 w-4" /> Add account
            </Link>
          </Button>
        )}
        <Button
          variant="outline"
          className="h-10 gap-2"
          onClick={() => setTransferOpen(true)}
          disabled={accounts.length < 2}
          title={accounts.length < 2 ? 'Add at least two accounts to transfer' : undefined}
        >
          <ArrowRightLeft className="h-4 w-4" /> Transfer
        </Button>
        <Button asChild variant="outline" className="h-10 gap-2">
          <Link href="/accounts">
            <Landmark className="h-4 w-4" /> Accounts
          </Link>
        </Button>
      </div>

      {accounts.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Accounts</h2>
            <Button asChild variant="ghost" size="sm" className="h-7 gap-1.5 text-xs">
              <Link href="/accounts">
                {accounts.length > 3 ? 'View all' : 'Manage'} <ArrowUpRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
          <div className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-2 scrollbar-none">
            {accounts.map(acc => {
              const Icon = getAccountIcon(acc.icon)
              const color = acc.color || '#10B981'
              return (
                <div
                  key={acc.id}
                  className="w-[160px] shrink-0 snap-start rounded-xl border border-border bg-card p-3 transition-colors hover:border-foreground/20 sm:w-auto sm:min-w-0 sm:max-w-[calc(33.333%-0.375rem)] sm:flex-1"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: `${color}15`, color }}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="flex-1 truncate text-[11px] font-medium text-muted-foreground">{acc.name}</span>
                    <Link
                      href="/accounts"
                      aria-label={`Edit ${acc.name}`}
                      className="rounded p-1 transition-colors hover:bg-muted"
                    >
                      <Edit className="h-3 w-3 text-muted-foreground" />
                    </Link>
                  </div>
                  <p className={cn(
                    'font-heading text-base font-bold tabular-nums',
                    acc.balance < 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground',
                  )}>
                    {mask(acc.balance)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-5">
        <ExpenseByCategoryCard slices={chart} periodLabel={periodLabel} />
        <SpendingTrendCard monthlyTotals={monthlyTotals} dailyTotals={dailyTotals} now={now} />
      </div>

      <RecentTransactionsCard transactions={recent} categoryNames={categoryNames} />

      <TransferDialog
        accounts={accounts}
        open={transferOpen}
        onOpenChange={setTransferOpen}
      />
      <TransactionDialog
        open={transactionOpen}
        onOpenChange={setTransactionOpen}
        editing={null}
        accounts={accounts}
        categories={categories}
      />
    </div>
  )
}
