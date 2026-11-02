export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <div className="h-10 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="h-5 w-56 rounded bg-muted animate-pulse" />
      </div>

      <div>
        <div className="mb-2 h-3 w-24 rounded bg-muted animate-pulse" />
        <div className="h-10 w-56 rounded bg-muted animate-pulse" />
      </div>

      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-card p-3 sm:p-5">
            <div className="mb-2 h-3 w-16 rounded bg-muted animate-pulse" />
            <div className="h-6 w-28 rounded bg-muted animate-pulse sm:h-8" />
            <div className="mt-2 h-3 w-36 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div className="col-span-2 h-10 rounded-lg border border-border bg-card animate-pulse sm:col-span-1" />
        <div className="h-10 rounded-lg border border-border bg-card animate-pulse" />
        <div className="h-10 rounded-lg border border-border bg-card animate-pulse" />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="h-3 w-20 rounded bg-muted animate-pulse" />
          <div className="h-5 w-16 rounded bg-muted animate-pulse" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-[68px] flex-1 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        <div className="md:col-span-2 rounded-xl border border-border bg-card p-5">
          <div className="h-4 w-36 rounded bg-muted animate-pulse" />
          <div className="mt-5 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i}>
                <div className="h-3 w-32 rounded bg-muted animate-pulse" />
                <div className="mt-2 h-1 w-full rounded-full bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        <div className="md:col-span-3 rounded-xl border border-border bg-card p-5">
          <div className="h-4 w-28 rounded bg-muted animate-pulse" />
          <div className="mt-5 h-8 w-40 rounded bg-muted animate-pulse" />
          <div className="mt-4 h-[220px] rounded-lg bg-muted animate-pulse" />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="h-4 w-40 rounded bg-muted animate-pulse" />
        <div className="mt-4 h-40 rounded-lg bg-muted animate-pulse" />
      </div>
    </div>
  )
}
