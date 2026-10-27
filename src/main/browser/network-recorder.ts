import { randomUUID } from 'node:crypto'
import type { BodyPayload, CaptureExecution } from '@shared/types'
import { CaptureSession } from './capture-session'
import { RequestCorrelator } from './request-correlator'
import { decodeCdpBody, emptyBody, headersFromCdp, unavailableBody } from './body-utils'
import type { CdpSessionManager } from './cdp-session-manager'

interface NetworkRequest {
  url: string
  method: string
  headers: Record<string, string>
  postData?: string
  hasPostData?: boolean
}

interface NetworkResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  mimeType: string
}

export class NetworkRecorder {
  constructor(
    private readonly cdp: CdpSessionManager,
    private readonly session: CaptureSession,
    private readonly correlator: RequestCorrelator,
    private readonly onChange: () => void
  ) {}

  handleEvent(method: string, params: Record<string, unknown>): void {
    if (method === 'Network.requestWillBeSent') this.onRequestWillBeSent(params)
    if (method === 'Network.responseReceived') this.onResponseReceived(params)
    if (method === 'Network.loadingFinished') void this.onLoadingFinished(params)
    if (method === 'Network.loadingFailed') this.onLoadingFailed(params)
  }

  private onRequestWillBeSent(params: Record<string, unknown>): void {
    const request = params.request as NetworkRequest
    const requestId = String(params.requestId)
    const type = String(params.type ?? 'Other')
    const execution: CaptureExecution = {
      id: randomUUID(),
      networkRequestId: requestId,
      startedAt: Date.now(),
      requestHeaders: headersFromCdp(request.headers),
      responseHeaders: {},
      requestBody: request.postData
        ? decodeCdpBody(request.postData, false, request.headers['Content-Type'])
        : emptyBody(),
      responseBody: { state: 'unavailable', reason: 'Waiting for response' },
      mocked: false,
      initiator: describeInitiator(params.initiator),
      lifecycle: 'pending'
    }

    this.correlator.start({
      networkRequestId: requestId,
      url: request.url,
      method: request.method,
      resourceType: type,
      startedAt: execution.startedAt,
      executionId: execution.id
    })
    this.session.upsertExecution(request.url, request.method, type, execution)
    this.onChange()
  }

  private onResponseReceived(params: Record<string, unknown>): void {
    const requestId = String(params.requestId)
    const response = params.response as NetworkResponse
    this.session.updateByNetworkId(requestId, (execution, group) => {
      execution.status = response.status
      execution.statusText = response.statusText
      execution.mimeType = response.mimeType
      execution.responseHeaders = headersFromCdp(response.headers)
      execution.lifecycle = 'responding'
      group.lastStatus = response.status
    })
    this.onChange()
  }

  private async onLoadingFinished(params: Record<string, unknown>): Promise<void> {
    const requestId = String(params.requestId)
    const body = await this.readBody(requestId)
    const finishedAt = Date.now()
    this.session.updateByNetworkId(requestId, (execution) => {
      execution.responseBody = body
      execution.durationMs = Math.max(0, finishedAt - execution.startedAt)
      execution.lifecycle = execution.mocked ? 'mocked' : 'complete'
    })
    this.correlator.complete(requestId)
    this.onChange()
  }

  private onLoadingFailed(params: Record<string, unknown>): void {
    const requestId = String(params.requestId)
    const canceled = Boolean(params.canceled)
    const errorText = String(params.errorText ?? 'failed')
    this.session.updateByNetworkId(requestId, (execution) => {
      execution.failedReason = errorText
      execution.lifecycle = canceled ? 'cancelled' : 'failed'
      execution.durationMs = Math.max(0, Date.now() - execution.startedAt)
      execution.responseBody = unavailableBody(errorText)
    })
    this.correlator.complete(requestId)
    this.onChange()
  }

  private async readBody(requestId: string): Promise<BodyPayload> {
    try {
      const result = await this.cdp.send<{ body?: string; base64Encoded?: boolean }>(
        'Network.getResponseBody',
        { requestId }
      )
      return decodeCdpBody(result.body, result.base64Encoded)
    } catch {
      return unavailableBody('Response body is not available from CDP')
    }
  }
}

function describeInitiator(initiator: unknown): string | undefined {
  if (!initiator || typeof initiator !== 'object') return undefined
  const type = 'type' in initiator ? String(initiator.type) : undefined
  return type
}
