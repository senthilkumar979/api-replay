import { describe, expect, it } from 'vitest'
import { RequestCorrelator } from '../../src/main/browser/request-correlator'

describe('RequestCorrelator', () => {
  it('does not treat fetch and network ids as interchangeable until bound', () => {
    const correlator = new RequestCorrelator()
    correlator.start({
      networkRequestId: 'net-1',
      url: 'http://127.0.0.1/api/products',
      method: 'GET',
      resourceType: 'Fetch',
      startedAt: 1,
      executionId: 'exec-1'
    })
    expect(correlator.getByFetchId('net-1')).toBeUndefined()
    correlator.bindFetch('fetch-1', 'net-1')
    expect(correlator.getByFetchId('fetch-1')?.networkRequestId).toBe('net-1')
  })
})
