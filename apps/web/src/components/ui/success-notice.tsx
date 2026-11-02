import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SuccessNotice({
  message,
  className,
}: {
  message: string | null
  className?: string
}) {
  if (!message) return null

  return (
    <div
      role="status"
      className={cn(
        'flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400',
        className,
      )}
    >
      <Check className="h-4 w-4 shrink-0" />
      {message}
    </div>
  )
}
