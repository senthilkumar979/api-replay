import { describe, expect, it } from 'vitest'
import { assertResponseOverride } from '../../src/main/rules/response-fulfiller'

describe('response override validation', () => {
  it('rejects a body on 204 responses', () => {
    expect(() =>
      assertResponseOverride({ status: 204, headers: {}, body: '{"no":true}' })
    ).toThrow(/cannot include a response body/)
  })

  it('allows 200 JSON bodies', () => {
    expect(() => assertResponseOverride({ status: 200, headers: { 'Content-Type': 'application/json' }, body: '{}' })).not.toThrow()
  })
})
