const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])

export function normalizeNavigationInput(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) throw new Error('URL is required')
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function assertAllowedNavigationUrl(urlString: string, allowFile = false): URL {
  let parsed: URL
  try {
    parsed = new URL(urlString)
  } catch {
    throw new Error('Enter a valid http or https URL')
  }

  if (parsed.protocol === 'file:' && allowFile) return parsed
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    throw new Error(`Blocked protocol: ${parsed.protocol}`)
  }

  return parsed
}
