import type { MatchCriteria } from '@shared/types'

export interface IncomingRequest {
  method: string
  url: string
  headers: Record<string, string>
  postData?: string
}

export function requestMatches(criteria: MatchCriteria, request: IncomingRequest): boolean {
  let parsed: URL
  try {
    parsed = new URL(request.url)
  } catch {
    return false
  }

  if (criteria.method.toUpperCase() !== request.method.toUpperCase()) return false
  if (criteria.origin !== parsed.origin) return false
  if (criteria.path !== parsed.pathname) return false

  if (criteria.query) {
    for (const [key, value] of Object.entries(criteria.query)) {
      if (parsed.searchParams.get(key) !== value) return false
    }
  }

  if (criteria.headers) {
    const incoming = lowerHeaders(request.headers)
    for (const [key, value] of Object.entries(criteria.headers)) {
      if (incoming[key.toLowerCase()] !== value) return false
    }
  }

  if (criteria.jsonBody) {
    if (!jsonSubsetMatches(criteria.jsonBody, request.postData)) return false
  }

  return true
}

function lowerHeaders(headers: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers)) result[key.toLowerCase()] = value
  return result
}

function jsonSubsetMatches(expected: Record<string, unknown>, postData: string | undefined): boolean {
  if (!postData) return false
  try {
    const parsed = JSON.parse(postData) as unknown
    if (!parsed || typeof parsed !== 'object') return false
    const body = parsed as Record<string, unknown>
    return Object.entries(expected).every(([key, value]) => body[key] === value)
  } catch {
    return false
  }
}
