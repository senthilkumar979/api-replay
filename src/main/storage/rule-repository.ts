import type { MockRule } from '@shared/types'
import type { AppDatabase } from './database'

interface RuleRow {
  id: string
  saved_api_id: string
  enabled: number
  priority: number
  interception_mode: MockRule['interceptionMode']
  match_criteria: string
  request_override: string | null
  response_override: string
  match_count: number
  last_matched_at: number | null
  created_at: number
  updated_at: number
}

export class RuleRepository {
  constructor(private readonly db: AppDatabase) {}

  list(): MockRule[] {
    return (
      this.db.prepare('SELECT * FROM mock_rules ORDER BY priority DESC, created_at ASC').all() as RuleRow[]
    ).map(mapRow)
  }

  get(id: string): MockRule | undefined {
    const row = this.db.prepare('SELECT * FROM mock_rules WHERE id = $id').get({ id }) as RuleRow | undefined
    return row ? mapRow(row) : undefined
  }

  listBySavedApi(savedApiId: string): MockRule[] {
    return (
      this.db.prepare('SELECT * FROM mock_rules WHERE saved_api_id = $saved_api_id').all({
        saved_api_id: savedApiId
      }) as RuleRow[]
    ).map(mapRow)
  }

  insert(rule: MockRule): void {
    this.db
      .prepare(
        `INSERT INTO mock_rules (
          id, saved_api_id, enabled, priority, interception_mode, match_criteria,
          request_override, response_override, match_count, last_matched_at, created_at, updated_at
        ) VALUES ($id, $saved_api_id, $enabled, $priority, $interception_mode, $match_criteria,
          $request_override, $response_override, $match_count, $last_matched_at, $created_at, $updated_at)`
      )
      .run(toRow(rule))
  }

  update(rule: MockRule): void {
    this.db
      .prepare(
        `UPDATE mock_rules SET enabled = $enabled, priority = $priority,
         interception_mode = $interception_mode, match_criteria = $match_criteria,
         request_override = $request_override, response_override = $response_override,
         match_count = $match_count, last_matched_at = $last_matched_at, updated_at = $updated_at
         WHERE id = $id`
      )
      .run(toRow(rule))
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM mock_rules WHERE id = $id').run({ id })
  }

  deleteBySavedApi(savedApiId: string): void {
    this.db.prepare('DELETE FROM mock_rules WHERE saved_api_id = $saved_api_id').run({ saved_api_id: savedApiId })
  }
}

function mapRow(row: RuleRow): MockRule {
  return {
    id: row.id,
    savedApiId: row.saved_api_id,
    enabled: Boolean(row.enabled),
    priority: row.priority,
    interceptionMode: row.interception_mode,
    matchCriteria: JSON.parse(row.match_criteria),
    requestOverride: row.request_override ? JSON.parse(row.request_override) : undefined,
    responseOverride: JSON.parse(row.response_override),
    matchCount: row.match_count,
    lastMatchedAt: row.last_matched_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function toRow(rule: MockRule) {
  return {
    id: rule.id,
    saved_api_id: rule.savedApiId,
    enabled: rule.enabled ? 1 : 0,
    priority: rule.priority,
    interception_mode: rule.interceptionMode,
    match_criteria: JSON.stringify(rule.matchCriteria),
    request_override: rule.requestOverride ? JSON.stringify(rule.requestOverride) : null,
    response_override: JSON.stringify(rule.responseOverride),
    match_count: rule.matchCount,
    last_matched_at: rule.lastMatchedAt ?? null,
    created_at: rule.createdAt,
    updated_at: rule.updatedAt
  }
}
