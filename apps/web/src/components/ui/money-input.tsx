'use client'

import { forwardRef } from 'react'
import { Input } from '@/components/ui/input'
import { formatNumberInput, unformatNumberInput } from '@/lib/utils'

export interface MoneyInputProps
  extends Omit<React.ComponentProps<typeof Input>, 'type' | 'inputMode' | 'value' | 'onChange'> {
  /** Raw digit string, e.g. "75000". Grouping is display-only. */
  value: string
  onValueChange: (value: string) => void
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onValueChange, ...props }, ref) => (
    <Input
      {...props}
      ref={ref}
      type="text"
      inputMode="numeric"
      value={formatNumberInput(value)}
      onChange={event => onValueChange(unformatNumberInput(event.target.value))}
    />
  ),
)

MoneyInput.displayName = 'MoneyInput'
