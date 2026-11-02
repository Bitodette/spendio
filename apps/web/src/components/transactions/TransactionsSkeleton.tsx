export function TransactionsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 h-9 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-72 max-w-full animate-pulse rounded bg-muted" />
        </div>
        <div className="h-10 w-40 animate-pulse rounded-lg bg-muted" />
      </div>

      <div>
        <div className="mb-2 flex items-end justify-between">
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
          {[1, 2, 3].map(item => (
            <div key={item} className="bg-card p-3 sm:p-5">
              <div className="mb-2 h-3 w-16 animate-pulse rounded bg-muted" />
              <div className="h-7 w-28 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="h-10 flex-1 animate-pulse rounded-lg bg-muted" />
          <div className="flex gap-2">
            <div className="h-10 w-36 animate-pulse rounded-lg bg-muted" />
            <div className="h-10 w-24 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border bg-muted/40 px-4 py-2">
          <div className="h-3 w-40 animate-pulse rounded bg-muted" />
        </div>
        <div className="divide-y divide-border">
          {[1, 2, 3, 4].map(item => (
            <div key={item} className="flex items-center gap-3 px-4 py-3">
              <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-40 max-w-full animate-pulse rounded bg-muted" />
                <div className="h-3 w-28 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
