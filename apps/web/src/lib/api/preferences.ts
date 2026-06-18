import { apiFetch } from '@/lib/api/client'

interface PreferenceDto {
  key: string
  value: unknown
}

export async function getPreference<T = unknown>(key: string): Promise<T | null> {
  const row = await apiFetch<PreferenceDto>(`/api/v1/preferences/${encodeURIComponent(key)}`)
  return (row.value ?? null) as T | null
}

export async function setPreference(key: string, value: unknown): Promise<void> {
  await apiFetch(`/api/v1/preferences/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body: JSON.stringify({ value }),
  })
}
