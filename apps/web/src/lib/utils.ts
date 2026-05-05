import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/** IDR has no fractional unit here, so keep digits only and cap at numeric(16,2)'s 14 integer digits. */
export function formatNumberInput(value: string): string {
  const digits = value
    .replace(/[^0-9]/g, '')
    .replace(/^0+(?=\d)/, '')
    .slice(0, 14)
  if (!digits) return ''
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/** Raw digit string for form state; the input renders it with grouping. */
export function unformatNumberInput(value: string): string {
  return value
    .replace(/[^0-9]/g, '')
    .replace(/^0+(?=\d)/, '')
    .slice(0, 14)
}
