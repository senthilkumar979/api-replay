import { MAX_CAPTURE_GROUPS, MAX_HISTORY_PER_IDENTITY } from '@shared/constants'
import type { CaptureExecution, CaptureGroup } from '@shared/types'
import { captureIdentity } from '@shared/identity'

export class CaptureSession {
  private readonly groups = new Map<string, CaptureGroup>()
  private readonly networkIndex = new Map<string, string>()
  private savedIdentities = new Map<string, string>()

  setSavedIdentities(identities: Map<string, string>): void {
    this.savedIdentities = identities
    for (const group of this.groups.values()) {
      const savedApiId = this.savedIdentities.get(group.identity)
      group.saved = Boolean(savedApiId)
      group.savedApiId = savedApiId
    }
  }

  clear(): void {
    this.groups.clear()
    this.networkIndex.clear()
  }

  list(): CaptureGroup[] {
    return [...this.groups.values()].sort((a, b) => b.lastActivityAt - a.lastActivityAt)
  }

  getByIdentity(identity: string): CaptureGroup | undefined {
    return this.groups.get(identity)
  }

  upsertExecution(
    url: string,
    method: string,
    resourceType: string,
    execution: CaptureExecution
  ): CaptureGroup {
    const parts = captureIdentity(method, url)
    const existing = this.groups.get(parts.identity)
    const savedApiId = this.savedIdentities.get(parts.identity)

    if (!existing) {
      const group: CaptureGroup = {
        identity: parts.identity,
        method: parts.method,
        origin: parts.origin,
        path: parts.path,
        query: parts.query,
        url,
        resourceType,
        requestCount: 1,
        lastStatus: execution.status,
        lastDurationMs: execution.durationMs,
        lastActivityAt: execution.startedAt,
        saved: Boolean(savedApiId),
        savedApiId,
        mocked: execution.mocked,
        latest: execution,
        history: [execution]
      }
      this.groups.set(parts.identity, group)
      this.networkIndex.set(execution.networkRequestId, parts.identity)
      this.evictIfNeeded()
      return group
    }

    const sameRequest = existing.history.find(
      (item) => item.networkRequestId === execution.networkRequestId
    )
    if (sameRequest) {
      Object.assign(sameRequest, execution, { id: sameRequest.id })
      existing.url = url
      existing.resourceType = resourceType
      existing.lastStatus = sameRequest.status
      existing.lastDurationMs = sameRequest.durationMs
      existing.mocked = sameRequest.mocked
      if (existing.latest.networkRequestId === execution.networkRequestId) existing.latest = sameRequest
      return existing
    }

    existing.requestCount += 1
    existing.url = url
    existing.resourceType = resourceType
    existing.lastStatus = execution.status
    existing.lastDurationMs = execution.durationMs
    existing.lastActivityAt = execution.startedAt
    existing.mocked = execution.mocked
    existing.latest = execution
    existing.history = [execution, ...existing.history].slice(0, MAX_HISTORY_PER_IDENTITY)
    this.networkIndex.set(execution.networkRequestId, parts.identity)
    return existing
  }

  updateByNetworkId(
    networkRequestId: string,
    mutate: (execution: CaptureExecution, group: CaptureGroup) => void
  ): CaptureGroup | undefined {
    const identity = this.networkIndex.get(networkRequestId)
    if (!identity) return undefined
    const group = this.groups.get(identity)
    if (!group) return undefined
    const execution =
      group.latest.networkRequestId === networkRequestId
        ? group.latest
        : group.history.find((item) => item.networkRequestId === networkRequestId)
    if (!execution) return undefined
    mutate(execution, group)
    group.lastStatus = group.latest.status
    group.lastDurationMs = group.latest.durationMs
    group.mocked = group.latest.mocked
    return group
  }

  private evictIfNeeded(): void {
    if (this.groups.size <= MAX_CAPTURE_GROUPS) return
    const oldest = this.list().at(-1)
    if (!oldest) return
    this.groups.delete(oldest.identity)
  }
}
