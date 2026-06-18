import { apiFetch } from '@/lib/api/client'
import type { CreateTransferInput } from '@spendio/shared'

export type TransferInput = CreateTransferInput

/**
 * Moves money between two accounts. The API records both transactions and
 * updates both balances in one database transaction.
 */
export async function transferBetweenAccounts(input: TransferInput): Promise<void> {
  await apiFetch('/api/v1/transfers', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
