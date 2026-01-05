import { z } from 'zod'

export const preferenceKeySchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_.:-]+$/, 'Preference key contains unsupported characters')

export const preferenceDtoSchema = z.object({
  key: z.string(),
  value: z.unknown(),
})

export const setPreferenceSchema = z
  .object({
    value: z.unknown(),
  })
  .strict()
  .refine(input => 'value' in input, {
    message: 'value is required',
  })

export type PreferenceDto = z.infer<typeof preferenceDtoSchema>
export type SetPreferenceInput = z.infer<typeof setPreferenceSchema>
