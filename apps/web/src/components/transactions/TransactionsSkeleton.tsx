import { Card, CardContent } from '@/components/ui/card'

export function TransactionsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-40 bg-muted animate-pulse rounded mb-2" />
          <div className="h-4 w-48 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-9 w-36 bg-muted animate-pulse rounded-lg" />
      </div>
      <div className="grid grid-cols-3 gap-px bg-border rounded-xl overflow-hidden">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-card p-4">
            <div className="h-3 w-12 bg-muted animate-pulse rounded mb-2" />
            <div className="h-5 w-24 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
