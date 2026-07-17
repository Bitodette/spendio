'use client'

import { Search, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { AccountOption } from '@/lib/api/transactions'
import type { TransactionFilters } from '@/lib/api/transactions'
import type { CategoryRef } from '@/types/database'

interface Props {
  filters: TransactionFilters
  onChange: (patch: Partial<TransactionFilters>) => void
  onToggleAdvanced: () => void
  advancedOpen: boolean
  accounts: AccountOption[]
  categories: CategoryRef[]
}

const RANGE_LABELS: Record<TransactionFilters['range'], string> = {
  today: 'Today',
  week: 'Last 7 Days',
  month: 'This Month',
  all: 'All',
}

export function TransactionFiltersBar({
  filters, onChange, onToggleAdvanced, advancedOpen, accounts, categories,
}: Props) {
  const filtered = Boolean(filters.accountId || filters.categoryId)

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search description..."
            value={filters.search}
            onChange={e => onChange({ search: e.target.value })}
            className="pl-9"
          />
        </div>
        <Select value={filters.range} onValueChange={range => onChange({ range: range as TransactionFilters['range'] })}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(RANGE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          aria-label="Toggle advanced filters"
          aria-expanded={advancedOpen}
          className="shrink-0"
          onClick={onToggleAdvanced}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {advancedOpen && (
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={filters.accountId || 'all'} onValueChange={v => onChange({ accountId: v === 'all' ? '' : v })}>
            <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="All Accounts" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.categoryId || 'all'} onValueChange={v => onChange({ categoryId: v === 'all' ? '' : v })}>
            <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {filtered && (
            <Button
              variant="ghost"
              onClick={() => onChange({ accountId: '', categoryId: '' })}
              className="gap-1"
            >
              <X className="h-4 w-4" /> Clear
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
