import type { MockRule } from '@shared/types'
import { requestMatches, type IncomingRequest } from './rule-matcher'

export function selectMatchingRule(rules: MockRule[], request: IncomingRequest): MockRule | undefined {
  const matches = rules.filter((rule) => rule.enabled && requestMatches(rule.matchCriteria, request))
  if (matches.length === 0) return undefined

  return [...matches].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority
    if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt
    return a.id.localeCompare(b.id)
  })[0]
}
