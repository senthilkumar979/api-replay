import { PAUSED_REQUEST_TIMEOUT_MS } from '@shared/constants'
import type { MockRule } from '@shared/types'
import { selectMatchingRule } from '../rules/rule-engine'
import { failMockSafely, fulfillMockResponse } from '../rules/response-fulfiller'
import { toHeaderArray } from './body-utils'
import type { CdpSessionManager } from './cdp-session-manager'
import type { RequestCorrelator } from './request-correlator'

interface PausedEntry {
  fetchRequestId: string
  networkId?: string
  timer: ReturnType<typeof setTimeout>
}

export class RequestInterceptor {
  private enabled = false
  private rules: MockRule[] = []
  private readonly paused = new Map<string, PausedEntry>()

  constructor(
    private readonly cdp: CdpSessionManager,
    private readonly correlator: RequestCorrelator,
    private readonly callbacks: {
      onMockMatched: (rule: MockRule, networkId?: string) => void
      onFulfillFailed: (message: string) => void
    }
  ) {}

  setRules(rules: MockRule[]): void {
    this.rules = rules
  }

  async setEnabled(enabled: boolean): Promise<void> {
    this.enabled = enabled
    if (enabled) {
      await this.cdp.send('Fetch.enable', {
        patterns: [
          { urlPattern: '*', resourceType: 'XHR', requestStage: 'Request' },
          { urlPattern: '*', resourceType: 'Fetch', requestStage: 'Request' }
        ]
      })
      return
    }
    await this.releaseAll()
    try {
      await this.cdp.send('Fetch.disable')
    } catch {
      // Fetch may already be disabled after a detach.
    }
  }

  async handleEvent(method: string, params: Record<string, unknown>): Promise<void> {
    if (method !== 'Fetch.requestPaused') return
    const fetchRequestId = String(params.requestId)
    const networkId = typeof params.networkId === 'string' ? params.networkId : undefined
    if (networkId) this.correlator.bindFetch(fetchRequestId, networkId)

    if (!this.enabled) {
      await this.continueRequest(fetchRequestId)
      return
    }

    this.watch(fetchRequestId, networkId)
    const request = params.request as { url: string; method: string; headers: Record<string, string>; postData?: string }
    const rule = selectMatchingRule(this.rules, request)

    try {
      if (!rule) {
        await this.continueRequest(fetchRequestId)
        return
      }
      if (rule.interceptionMode === 'modify-and-forward') {
        await this.continueRequest(fetchRequestId, rule)
        this.callbacks.onMockMatched(rule, networkId)
        return
      }
      await fulfillMockResponse(this.cdp, fetchRequestId, rule.responseOverride)
      this.callbacks.onMockMatched(rule, networkId)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown fulfillment error'
      this.callbacks.onFulfillFailed(message)
      if (rule && rule.interceptionMode === 'mock-response') {
        await failMockSafely(this.cdp, fetchRequestId, message)
      } else {
        await this.continueRequest(fetchRequestId)
      }
    } finally {
      this.unwatch(fetchRequestId)
    }
  }

  async releaseAll(): Promise<void> {
    const ids = [...this.paused.keys()]
    for (const id of ids) {
      this.unwatch(id)
      await this.continueRequest(id)
    }
  }

  private watch(fetchRequestId: string, networkId?: string): void {
    this.unwatch(fetchRequestId)
    const timer = setTimeout(() => {
      void this.continueRequest(fetchRequestId)
      this.unwatch(fetchRequestId)
    }, PAUSED_REQUEST_TIMEOUT_MS)
    this.paused.set(fetchRequestId, { fetchRequestId, networkId, timer })
  }

  private unwatch(fetchRequestId: string): void {
    const entry = this.paused.get(fetchRequestId)
    if (entry) clearTimeout(entry.timer)
    this.paused.delete(fetchRequestId)
  }

  private async continueRequest(fetchRequestId: string, rule?: MockRule): Promise<void> {
    const override = rule?.requestOverride
    try {
      await this.cdp.send('Fetch.continueRequest', {
        requestId: fetchRequestId,
        url: override?.url,
        method: override?.method,
        headers: override?.headers ? toHeaderArray(override.headers) : undefined,
        postData: override?.postData
          ? Buffer.from(override.postData, 'utf8').toString('base64')
          : undefined
      })
    } catch {
      // Request may already have been continued or the session detached.
    }
  }
}
