import { describe, expect, it } from 'vitest'
import { selectMatchingRule } from '../../src/main/rules/rule-engine'
import { requestMatches } from '../../src/main/rules/rule-matcher'
import type { MockRule } from '@shared/types'

const request = {
  method: 'GET',
  url: 'http://127.0.0.1:4010/api/products',
  headers: { accept: 'application/json' }
}

function rule(partial: Partial<MockRule> & Pick<MockRule, 'id' | 'priority' | 'createdAt'>): MockRule {
  return {
    savedApiId: 'api',
    enabled: true,
    interceptionMode: 'mock-response',
    matchCriteria: { origin: 'http://127.0.0.1:4010', path: '/api/products', method: 'GET' },
    responseOverride: { status: 200, headers: {}, body: '{}' },
    matchCount: 0,
    updatedAt: 1,
    ...partial
  }
}

describe('rule matching', () => {
  it('matches exact origin method and path', () => {
    expect(requestMatches(rule({ id: 'a', priority: 1, createdAt: 1 }).matchCriteria, request)).toBe(true)
    expect(
      requestMatches(
        { origin: 'http://127.0.0.1:4010', path: '/api/other', method: 'GET' },
        request
      )
    ).toBe(false)
  })

  it('resolves conflicts by priority then createdAt', () => {
    const selected = selectMatchingRule(
      [
        rule({ id: 'low', priority: 1, createdAt: 1, responseOverride: { status: 200, headers: {}, body: 'low' } }),
        rule({ id: 'high', priority: 50, createdAt: 9, responseOverride: { status: 503, headers: {}, body: 'high' } })
      ],
      request
    )
    expect(selected?.id).toBe('high')
  })

  it('ignores disabled rules', () => {
    const selected = selectMatchingRule(
      [rule({ id: 'off', priority: 100, createdAt: 1, enabled: false })],
      request
    )
    expect(selected).toBeUndefined()
  })
})
