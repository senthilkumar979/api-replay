import { describe, expect, it } from 'vitest'
import { CaptureSession } from '../../src/main/browser/capture-session'
import type { CaptureExecution } from '@shared/types'

function execution(id: string, networkRequestId = id): CaptureExecution {
  return {
    id,
    networkRequestId,
    startedAt: Date.now(),
    requestHeaders: {},
    responseHeaders: {},
    requestBody: { state: 'empty' },
    responseBody: { state: 'empty' },
    mocked: false,
    lifecycle: 'complete',
    status: 200
  }
}

describe('capture session', () => {
  it('groups duplicate identities and keeps history in memory', () => {
    const session = new CaptureSession()
    session.upsertExecution('http://127.0.0.1/api/products', 'GET', 'Fetch', execution('1'))
    session.upsertExecution('http://127.0.0.1/api/products', 'GET', 'Fetch', execution('2'))
    const [group] = session.list()
    expect(group.requestCount).toBe(2)
    expect(group.history).toHaveLength(2)
    expect(group.saved).toBe(false)
  })

  it('does not increment count for the same network request id', () => {
    const session = new CaptureSession()
    session.upsertExecution('http://127.0.0.1/api/products', 'GET', 'Fetch', execution('same', 'net-1'))
    session.upsertExecution('http://127.0.0.1/api/products', 'GET', 'Fetch', execution('same-again', 'net-1'))
    expect(session.list()[0].requestCount).toBe(1)
  })
})
