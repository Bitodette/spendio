import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function InlineConfirm({
  title,
  description,
  confirmLabel = 'Delete',
  onCancel,
  onConfirm,
  isPending,
  className,
}: {
  title: string
  description?: string
  confirmLabel?: string
  onCancel: () => void
  onConfirm: () => void
  isPending?: boolean
  className?: string
}) {
  return (
    <div
      role="alertdialog"
      aria-label={title}
      className={cn(
        'rounded-lg border border-destructive/30 bg-destructive/5 p-3',
        className,
      )}
    >
      <p className="text-xs font-medium text-foreground">{title}</p>
      {description && (
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{description}</p>
      )}
      <div className="mt-2 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={onConfirm}
          disabled={isPending}
        >
          {isPending ? 'Deleting...' : confirmLabel}
        </Button>
      </div>
    </div>
  )
}
