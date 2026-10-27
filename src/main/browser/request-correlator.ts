export interface InFlightRequest {
  networkRequestId: string
  fetchRequestId?: string
  url: string
  method: string
  resourceType: string
  startedAt: number
  documentURL?: string
  executionId: string
}

export class RequestCorrelator {
  private readonly byNetworkId = new Map<string, InFlightRequest>()
  private readonly fetchToNetwork = new Map<string, string>()

  start(request: InFlightRequest): void {
    this.byNetworkId.set(request.networkRequestId, request)
    if (request.fetchRequestId) {
      this.fetchToNetwork.set(request.fetchRequestId, request.networkRequestId)
    }
  }

  bindFetch(fetchRequestId: string, networkId: string): InFlightRequest | undefined {
    this.fetchToNetwork.set(fetchRequestId, networkId)
    const inflight = this.byNetworkId.get(networkId)
    if (inflight) inflight.fetchRequestId = fetchRequestId
    return inflight
  }

  getByNetworkId(networkRequestId: string): InFlightRequest | undefined {
    return this.byNetworkId.get(networkRequestId)
  }

  getByFetchId(fetchRequestId: string): InFlightRequest | undefined {
    const networkId = this.fetchToNetwork.get(fetchRequestId)
    if (!networkId) return undefined
    return this.byNetworkId.get(networkId)
  }

  complete(networkRequestId: string): void {
    const inflight = this.byNetworkId.get(networkRequestId)
    if (inflight?.fetchRequestId) this.fetchToNetwork.delete(inflight.fetchRequestId)
    this.byNetworkId.delete(networkRequestId)
  }

  clear(): void {
    this.byNetworkId.clear()
    this.fetchToNetwork.clear()
  }
}
