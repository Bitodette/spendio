import { formatCurrency } from '@/lib/utils'

export interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{
    color: string
    name: string
    value: number
    payload?: { label?: string }
  }>
  label?: string | number
}

export function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  const heading = payload[0]?.payload?.label ?? label
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      {heading !== undefined && (
        <p className="text-xs font-medium text-muted-foreground mb-1">{heading}</p>
      )}
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  )
}
