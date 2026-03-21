import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { parseResponse } from './response.js'

describe('parseResponse', () => {
  it('returns the parsed value on success', () => {
    expect(parseResponse(z.object({ ok: z.literal(true) }), { ok: true })).toEqual({ ok: true })
  })

  it('fails as a server error when a response violates its contract', () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      expect(() => parseResponse(z.string(), 42)).toThrow('Response contract violation')
      expect(logged).toHaveBeenCalledOnce()
    } finally {
      logged.mockRestore()
    }
  })
})
