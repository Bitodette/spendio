import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'

async function invalidate(
  queryClient: QueryClient,
  keys: ReadonlyArray<readonly unknown[]>,
) {
  await Promise.all(
    keys.map(queryKey => queryClient.invalidateQueries({ queryKey })),
  )
}

/** Account changes also affect balances, transaction rows, and budget spending. */
export function invalidateAccountQueries(queryClient: QueryClient) {
  return invalidate(queryClient, [
    queryKeys.accounts.all,
    queryKeys.transactions.all,
    queryKeys.recurring.all,
    queryKeys.budgets.all,
    queryKeys.dashboard,
  ])
}

/** Category names and deletions are reflected in transactions, budgets, and recurring rows. */
export function invalidateCategoryQueries(queryClient: QueryClient) {
  return invalidate(queryClient, [
    queryKeys.categories.all,
    queryKeys.transactions.all,
    queryKeys.budgets.all,
    queryKeys.recurring.all,
    queryKeys.dashboard,
  ])
}

/** A transaction mutation changes balances, dashboard totals, and budget spending. */
export function invalidateTransactionQueries(queryClient: QueryClient) {
  return invalidate(queryClient, [
    queryKeys.transactions.all,
    queryKeys.accounts.all,
    queryKeys.budgets.all,
    queryKeys.dashboard,
  ])
}

/** Saving a recurring rule or posting it touches all financial views. */
export function invalidateRecurringQueries(queryClient: QueryClient) {
  return invalidate(queryClient, [
    queryKeys.recurring.all,
    queryKeys.transactions.all,
    queryKeys.accounts.all,
    queryKeys.budgets.all,
    queryKeys.dashboard,
  ])
}
