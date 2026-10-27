export interface IdentityParts {
  method: string
  origin: string
  path: string
  query: string
  identity: string
}

export function normalizeQuery(search: string): string {
  const raw = search.startsWith('?') ? search.slice(1) : search
  if (!raw) return ''

  const params = new URLSearchParams(raw)
  const keys = [...new Set([...params.keys()])].sort()
  const normalized = new URLSearchParams()

  for (const key of keys) {
    const values = params.getAll(key).sort()
    for (const value of values) normalized.append(key, value)
  }

  return normalized.toString()
}

export function captureIdentity(method: string, urlString: string): IdentityParts {
  const url = new URL(urlString)
  const methodUpper = method.toUpperCase()
  const query = normalizeQuery(url.search)
  const path = url.pathname || '/'
  const identity = `${methodUpper} ${url.origin}${path}${query ? `?${query}` : ''}`

  return {
    method: methodUpper,
    origin: url.origin,
    path,
    query,
    identity
  }
}
