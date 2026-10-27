import { describe, expect, it } from 'vitest'
import { RequestInterceptor } from '../../src/main/browser/request-interceptor'
import { RequestCorrelator } from '../../src/main/browser/request-correlator'
import type { CdpSessionManager } from '../../src/main/browser/cdp-session-manager'
import type { MockRule } from '@shared/types'

class FakeCdp {
  commands: Array<{ method: string; params?: Record<string, unknown> }> = []
  async send(method: string, params?: Record<string, unknown>): Promise<unknown> {
    this.commands.push({ method, params })
    return {}
  }
}

function rule(overrides: Partial<MockRule> = {}): MockRule {
  return {
    id: 'rule-1',
    savedApiId: 'api-1',
    enabled: true,
    priority: 100,
    interceptionMode: 'mock-response',
    matchCriteria: { origin: 'http://127.0.0.1:4010', path: '/api/side-effect', method: 'POST' },
    responseOverride: { status: 200, headers: { 'Content-Type': 'application/json' }, body: '{"mocked":true}' },
    matchCount: 0,
    createdAt: 1,
    updatedAt: 1,
    ...overrides
  }
}

describe('request interceptor', () => {
  it('fulfills matching mock-response rules and never continues them', async () => {
    const cdp = new FakeCdp()
    const correlator = new RequestCorrelator()
    const matched: string[] = []
    const interceptor = new RequestInterceptor(
      cdp as unknown as CdpSessionManager,
      correlator,
      {
        onMockMatched: (item) => matched.push(item.id),
        onFulfillFailed: () => undefined
      }
    )
    interceptor.setRules([rule()])
    await interceptor.setEnabled(true)
    await interceptor.handleEvent('Fetch.requestPaused', {
      requestId: 'fetch-1',
      networkId: 'net-1',
      request: {
        url: 'http://127.0.0.1:4010/api/side-effect',
        method: 'POST',
        headers: {}
      }
    })
    const methods = cdp.commands.map((item) => item.method)
    expect(methods).toContain('Fetch.fulfillRequest')
    expect(methods.filter((item) => item === 'Fetch.continueRequest')).toHaveLength(0)
    expect(matched).toEqual(['rule-1'])
  })

  it('continues unmatched requests to the real backend', async () => {
    const cdp = new FakeCdp()
    const interceptor = new RequestInterceptor(cdp as unknown as CdpSessionManager, new RequestCorrelator(), {
      onMockMatched: () => undefined,
      onFulfillFailed: () => undefined
    })
    interceptor.setRules([rule()])
    await interceptor.setEnabled(true)
    await interceptor.handleEvent('Fetch.requestPaused', {
      requestId: 'fetch-2',
      request: {
        url: 'http://127.0.0.1:4010/api/products',
        method: 'GET',
        headers: {}
      }
    })
    expect(cdp.commands.map((item) => item.method)).toContain('Fetch.continueRequest')
    expect(cdp.commands.map((item) => item.method)).not.toContain('Fetch.fulfillRequest')
  })

  it('fails safely instead of forwarding when mock fulfillment throws', async () => {
    const cdp = new FakeCdp()
    cdp.send = async (method, params) => {
      cdp.commands.push({ method, params })
      if (method === 'Fetch.fulfillRequest' && params?.responseCode === 200) throw new Error('boom')
      return {}
    }
    const interceptor = new RequestInterceptor(cdp as unknown as CdpSessionManager, new RequestCorrelator(), {
      onMockMatched: () => undefined,
      onFulfillFailed: () => undefined
    })
    interceptor.setRules([rule()])
    await interceptor.setEnabled(true)
    await interceptor.handleEvent('Fetch.requestPaused', {
      requestId: 'fetch-3',
      request: {
        url: 'http://127.0.0.1:4010/api/side-effect',
        method: 'POST',
        headers: {}
      }
    })
    const fulfillments = cdp.commands.filter((item) => item.method === 'Fetch.fulfillRequest')
    expect(fulfillments.some((item) => item.params?.responseCode === 502)).toBe(true)
    expect(cdp.commands.some((item) => item.method === 'Fetch.continueRequest')).toBe(false)
  })
})
