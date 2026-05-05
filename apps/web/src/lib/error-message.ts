import { ApiError } from '@/lib/api/client'

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  if (error instanceof TypeError) return 'Tidak dapat terhubung ke server. Coba lagi.'
  if (error instanceof Error && error.message) return error.message
  return 'Terjadi kesalahan. Coba lagi.'
}
