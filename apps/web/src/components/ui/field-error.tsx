export function FieldError({ error }: { error?: { message?: unknown } }) {
  if (!error?.message) return null
  return <p className="text-xs text-destructive">{String(error.message)}</p>
}
