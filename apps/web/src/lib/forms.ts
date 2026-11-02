'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type FieldValues, type Resolver, type UseFormProps } from 'react-hook-form'
import type { z } from 'zod'

/**
 * `useForm` wired to a shared zod schema. `TInput` is the shape the form holds
 * (for example money as a raw digit string) and `TOutput` is the parsed payload
 * handed to the API.
 */
export function useZodForm<TInput extends FieldValues, TOutput extends FieldValues>(
  schema: z.ZodType<TOutput, FieldValues>,
  options?: Omit<UseFormProps<TInput, unknown, TOutput>, 'resolver'>,
) {
  return useForm<TInput, unknown, TOutput>({
    // Validate only when the user submits, then revalidate as they correct it.
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    ...options,
    resolver: zodResolver(schema) as Resolver<TInput, unknown, TOutput>,
  })
}
