export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <div className="h-10 w-48 bg-muted animate-pulse rounded-lg" />
        <div className="h-5 w-32 bg-muted animate-pulse rounded" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border rounded-xl overflow-hidden">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-card p-3 sm:p-5">
            <div className="h-3 w-16 bg-muted animate-pulse rounded mb-2" />
            <div className="h-6 sm:h-8 w-28 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex-1 h-[100px] bg-card rounded-xl border border-border animate-pulse" />
        ))}
      </div>
      <div className="flex gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex-1 h-11 bg-card rounded-xl border border-border animate-pulse" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-5">
        <div className="md:col-span-2 bg-card rounded-xl border border-border p-5"><div className="h-72 bg-muted animate-pulse rounded-lg" /></div>
        <div className="md:col-span-3 bg-card rounded-xl border border-border p-5"><div className="h-72 bg-muted animate-pulse rounded-lg" /></div>
      </div>
    </div>
  )
}
