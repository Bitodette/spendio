import { Button } from '@/components/ui/button'
import { getErrorMessage } from '@/lib/error-message'
import { cn } from '@/lib/utils'

export function ErrorNotice({
  error,
  onRetry,
  className,
}: {
  error: unknown
  onRetry?: () => void
  className?: string
}) {
  if (!error) return null

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400',
        className,
      )}
    >
      <p>{getErrorMessage(error)}</p>
      {onRetry && (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          Coba lagi
        </Button>
      )}
    </div>
  )
}
