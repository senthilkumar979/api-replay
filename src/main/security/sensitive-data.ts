const SENSITIVE_HEADER_NAMES = new Set(['authorization', 'cookie', 'set-cookie', 'proxy-authorization'])

export function isSensitiveHeader(name: string): boolean {
  return SENSITIVE_HEADER_NAMES.has(name.toLowerCase())
}

export function redactHeaders(headers: Record<string, string>): Record<string, string> {
  const redacted: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers)) {
    redacted[key] = isSensitiveHeader(key) ? '[redacted]' : value
  }
  return redacted
}

export function safeLogValue(value: unknown): string {
  if (typeof value !== 'string') return JSON.stringify(value)
  const lowered = value.toLowerCase()
  if (lowered.includes('bearer ') || lowered.includes('cookie:')) return '[redacted]'
  return value.slice(0, 200)
}
