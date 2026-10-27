import { describe, expect, it } from 'vitest'
import { captureIdentity, normalizeQuery } from '@shared/identity'

describe('captureIdentity', () => {
  it('normalizes query parameter order', () => {
    const first = captureIdentity('get', 'https://api.example.com/items?b=2&a=1')
    const second = captureIdentity('GET', 'https://api.example.com/items?a=1&b=2')
    expect(first.identity).toBe(second.identity)
    expect(first.method).toBe('GET')
    expect(normalizeQuery('?b=2&a=1')).toBe('a=1&b=2')
  })

  it('keeps different methods distinct', () => {
    const get = captureIdentity('GET', 'https://api.example.com/items')
    const post = captureIdentity('POST', 'https://api.example.com/items')
    expect(get.identity).not.toBe(post.identity)
  })
})
