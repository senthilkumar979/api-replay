import { describe, expect, it } from 'vitest'
import { assertAllowedNavigationUrl, normalizeNavigationInput } from '../../src/main/security/url-policy'

describe('url policy', () => {
  it('adds https when the protocol is missing', () => {
    expect(normalizeNavigationInput('example.com/path')).toBe('https://example.com/path')
  })

  it('rejects javascript URLs', () => {
    expect(() => assertAllowedNavigationUrl('javascript:alert(1)')).toThrow(/Blocked protocol/)
  })

  it('allows local http URLs', () => {
    expect(assertAllowedNavigationUrl('http://127.0.0.1:4010/').origin).toBe('http://127.0.0.1:4010')
  })
})
