'use client'

import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { AccountOption, TransactionFilters } from '@/lib/api/transactions'
import type { CategoryRef } from '@/types/database'

interface Props {
  filters: TransactionFilters
  searchValue: string
  onSearchChange: (value: string, immediate?: boolean) => void
  onChange: (patch: Partial<TransactionFilters>) => void
  onToggleAdvanced: () => void
  advancedOpen: boolean
  accounts: AccountOption[]
  categories: CategoryRef[]
}

const RANGE_LABELS: Record<TransactionFilters['range'], string> = {
  today: 'Today',
  week: 'Last 7 days',
  month: 'This month',
  all: 'All time',
}

export function TransactionFiltersBar({
  filters, searchValue, onSearchChange, onChange, onToggleAdvanced, advancedOpen, accounts, categories,
}: Props) {
  const accountName = accounts.find(account => account.id === filters.accountId)?.name
  const categoryName = categories.find(category => category.id === filters.categoryId)?.name

  const activeFilters = [
    searchValue ? { key: 'search', label: `"${searchValue}"` } : null,
    filters.accountId ? { key: 'accountId', label: accountName ?? 'Account' } : null,
    filters.categoryId ? { key: 'categoryId', label: categoryName ?? 'Category' } : null,
  ].filter((filter): filter is { key: string; label: string } => filter !== null)

  const activeCount = activeFilters.length
  const roots = categories.filter(category => category.parent_id === null)
  const children = categories.filter(category => category.parent_id !== null)
  const orderedCategories = [
    ...roots.flatMap(root => [
      root,
      ...children.filter(child => child.parent_id === root.id),
    ]),
    ...children.filter(child => !roots.some(root => root.id === child.parent_id)),
  ]

  const clearAll = () => {
    onSearchChange('')
    onChange({ accountId: '', categoryId: '', range: 'month' })
  }
  const removeFilter = (key: string) => {
    if (key === 'search') onSearchChange('')
    if (key === 'accountId') onChange({ accountId: '' })
    if (key === 'categoryId') onChange({ categoryId: '' })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            aria-label="Search transactions"
            value={searchValue}
            onChange={event => onSearchChange(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') onSearchChange(searchValue, true)
            }}
            className="h-10 pl-9 pr-9"
          />
          {searchValue && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={filters.range}
            onValueChange={range => onChange({ range: range as TransactionFilters['range'] })}
          >
            <SelectTrigger className="h-10 flex-1 sm:w-[150px] sm:flex-none" aria-label="Date range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(RANGE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            aria-expanded={advancedOpen}
            aria-controls="transaction-advanced-filters"
            className={cn('h-10 shrink-0 gap-2', (advancedOpen || activeCount > 0) && 'border-foreground/20')}
            onClick={onToggleAdvanced}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                {activeCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {advancedOpen && (
        <div
          id="transaction-advanced-filters"
          className="grid gap-3 rounded-xl border border-border bg-muted/20 p-3 sm:grid-cols-2"
        >
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Account</p>
            <Select
              value={filters.accountId || 'all'}
              onValueChange={value => onChange({ accountId: value === 'all' ? '' : value })}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="All accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All accounts</SelectItem>
                {accounts.map(account => (
                  <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Category</p>
            <Select
              value={filters.categoryId || 'all'}
              onValueChange={value => onChange({ categoryId: value === 'all' ? '' : value })}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {orderedCategories.map(category => (
                  <SelectItem
                    key={category.id}
                    value={category.id}
                    className={category.parent_id ? 'pl-8' : undefined}
                  >
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeFilters.map(filter => (
            <span
              key={filter.key}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-card py-1 pl-2.5 pr-1 text-xs text-foreground"
            >
              <span className="truncate">{filter.label}</span>
              <button
                type="button"
                aria-label={`Remove ${filter.label} filter`}
                onClick={() => removeFilter(filter.key)}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground"
            onClick={clearAll}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}
