import { describe, expect, it } from 'vitest'
import { redactHeaders, safeLogValue } from '../../src/main/security/sensitive-data'

describe('sensitive data', () => {
  it('redacts authorization and cookies', () => {
    const redacted = redactHeaders({
      Authorization: 'Bearer secret-token',
      Cookie: 'session=abc',
      Accept: 'application/json'
    })
    expect(redacted.Authorization).toBe('[redacted]')
    expect(redacted.Cookie).toBe('[redacted]')
    expect(redacted.Accept).toBe('application/json')
  })

  it('redacts bearer tokens in log values', () => {
    expect(safeLogValue('Bearer secret-token')).toBe('[redacted]')
  })
})
