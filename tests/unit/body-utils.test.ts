import { describe, expect, it } from 'vitest'
import { decodeCdpBody } from '../../src/main/browser/body-utils'
import { MAX_BODY_BYTES } from '@shared/constants'

describe('decodeCdpBody', () => {
  it('marks oversized bodies instead of truncating', () => {
    const huge = 'a'.repeat(MAX_BODY_BYTES + 10)
    const result = decodeCdpBody(huge, false)
    expect(result.state).toBe('too-large')
    expect(result.text).toBeUndefined()
  })

  it('returns empty for blank bodies', () => {
    expect(decodeCdpBody('', false).state).toBe('empty')
  })
})
