/**
 * The API represents money as canonical decimal strings. The UI converts to
 * numbers only for display; mutations send the shared schema's string payload.
 */
export function fromMoney(value: string): number {
  return Number(value)
}
