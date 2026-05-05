/**
 * Express API client. `NEXT_PUBLIC_API_URL` points at the API origin, and
 * requests include the session cookie.
 */

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')

interface ApiErrorBody {
  error?: {
    code?: string
    message?: string
    details?: unknown
  }
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`
}

/**
 * Fetches a JSON endpoint and throws `ApiError` for API errors or invalid
 * response bodies.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  const body = init.body

  if (
    body !== undefined &&
    body !== null &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(apiUrl(path), {
    ...init,
    credentials: 'include',
    headers,
  })

  if (response.status === 204) return undefined as T

  const text = await response.text()
  let payload: unknown = null

  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      if (response.ok) {
        throw new ApiError(response.status, 'INVALID_RESPONSE', 'The API returned invalid JSON')
      }
    }
  }

  if (!response.ok) {
    const error = (payload as ApiErrorBody | null)?.error
    throw new ApiError(
      response.status,
      error?.code ?? 'REQUEST_FAILED',
      error?.message ?? `Request failed with status ${response.status}`,
      error?.details,
    )
  }

  return payload as T
}
