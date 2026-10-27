import { randomUUID } from 'node:crypto'
import { DEFAULT_RULE_PRIORITY } from '@shared/constants'
import type { CaptureGroup, MockRule, SavedApi, SaveApiInput } from '@shared/types'
import type { AppDatabase } from '../storage/database'
import type { RuleRepository } from '../storage/rule-repository'
import type { SavedApiRepository } from '../storage/saved-api-repository'

export function createSavedApi(group: CaptureGroup, input: SaveApiInput): SavedApi {
  const now = Date.now()
  return {
    id: input.replaceExistingId ?? randomUUID(),
    name: input.name,
    identity: group.identity,
    method: group.method,
    origin: group.origin,
    path: group.path,
    query: group.query,
    requestSnapshot: group.latest,
    responseSnapshot: group.latest,
    createdAt: now,
    updatedAt: now
  }
}

export function createRuleFromSavedApi(api: SavedApi, enabled: boolean): MockRule {
  const now = Date.now()
  const headers = { ...api.responseSnapshot.responseHeaders }
  if (api.responseSnapshot.mimeType && !headerHas(headers, 'content-type')) {
    headers['Content-Type'] = api.responseSnapshot.mimeType
  }
  return {
    id: randomUUID(),
    savedApiId: api.id,
    enabled,
    priority: DEFAULT_RULE_PRIORITY,
    interceptionMode: 'mock-response',
    matchCriteria: {
      origin: api.origin,
      path: api.path,
      method: api.method
    },
    responseOverride: {
      status: api.responseSnapshot.status ?? 200,
      statusText: api.responseSnapshot.statusText,
      headers,
      body: api.responseSnapshot.responseBody.text ?? ''
    },
    matchCount: 0,
    createdAt: now,
    updatedAt: now
  }
}

export function persistSavedApi(args: {
  savedApis: SavedApiRepository
  rules: RuleRepository
  db: AppDatabase
  api: SavedApi
  rule: MockRule
  replaceExistingId?: string
}): void {
  const run = args.db.transaction(() => {
    if (args.replaceExistingId) {
      args.savedApis.update(args.api)
      const existingRules = args.rules.listBySavedApi(args.api.id)
      if (existingRules[0]) {
        args.rules.update({
          ...existingRules[0],
          responseOverride: args.rule.responseOverride,
          matchCriteria: args.rule.matchCriteria,
          updatedAt: Date.now()
        })
        return
      }
      args.rules.insert(args.rule)
      return
    }
    args.savedApis.insert(args.api)
    args.rules.insert(args.rule)
  })
  run()
}

function headerHas(headers: Record<string, string>, name: string): boolean {
  return Object.keys(headers).some((key) => key.toLowerCase() === name)
}
