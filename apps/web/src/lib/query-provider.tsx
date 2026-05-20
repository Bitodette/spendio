'use client'

import { MutationCache, QueryCache, QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ApiError } from '@/lib/api/client'
import { useAuth } from '@/lib/auth'

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    queryCache: new QueryCache({
      onError: error => console.error('Query error:', error),
    }),
    mutationCache: new MutationCache({
      // Expected failures are rendered inline; use warn so the dev error overlay
      // does not cover the form the user is still editing.
      onError: error => console.warn('Mutation error:', error),
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Retry transient failures only. A 4xx response will not improve by
        // repeating the same request, and retrying 401s delays the error UI.
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status < 500) && failureCount < 1,
        refetchOnWindowFocus: false,
      },
    },
  }))

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

export function QueryAuthSync() {
  const { user, loading } = useAuth()
  const queryClient = useQueryClient()
  const initialized = useRef(false)
  const previousUserId = useRef<string | null>(null)

  useEffect(() => {
    if (loading) return

    const userId = user?.id ?? null
    if (!initialized.current) {
      initialized.current = true
      previousUserId.current = userId
      return
    }

    if (previousUserId.current !== userId) {
      queryClient.clear()
      previousUserId.current = userId
    }
  }, [user?.id, loading, queryClient])

  return null
}
