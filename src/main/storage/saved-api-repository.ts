import type { SavedApi } from '@shared/types'
import type { AppDatabase } from './database'

interface SavedApiRow {
  id: string
  name: string
  identity: string
  method: string
  origin: string
  path: string
  query: string
  request_snapshot: string
  response_snapshot: string
  created_at: number
  updated_at: number
}

export class SavedApiRepository {
  constructor(private readonly db: AppDatabase) {}

  list(): SavedApi[] {
    return (this.db.prepare('SELECT * FROM saved_apis ORDER BY updated_at DESC').all() as SavedApiRow[]).map(
      mapRow
    )
  }

  findByIdentity(identity: string): SavedApi[] {
    return (
      this.db
        .prepare('SELECT * FROM saved_apis WHERE identity = $identity ORDER BY created_at ASC')
        .all({ identity }) as SavedApiRow[]
    ).map(mapRow)
  }

  get(id: string): SavedApi | undefined {
    const row = this.db.prepare('SELECT * FROM saved_apis WHERE id = $id').get({ id }) as SavedApiRow | undefined
    return row ? mapRow(row) : undefined
  }

  insert(api: SavedApi): void {
    this.db
      .prepare(
        `INSERT INTO saved_apis (
          id, name, identity, method, origin, path, query,
          request_snapshot, response_snapshot, created_at, updated_at
        ) VALUES ($id, $name, $identity, $method, $origin, $path, $query,
          $request_snapshot, $response_snapshot, $created_at, $updated_at)`
      )
      .run({
        id: api.id,
        name: api.name,
        identity: api.identity,
        method: api.method,
        origin: api.origin,
        path: api.path,
        query: api.query,
        request_snapshot: JSON.stringify(api.requestSnapshot),
        response_snapshot: JSON.stringify(api.responseSnapshot),
        created_at: api.createdAt,
        updated_at: api.updatedAt
      })
  }

  update(api: SavedApi): void {
    this.db
      .prepare(
        `UPDATE saved_apis SET name = $name, request_snapshot = $request_snapshot,
         response_snapshot = $response_snapshot, updated_at = $updated_at WHERE id = $id`
      )
      .run({
        id: api.id,
        name: api.name,
        request_snapshot: JSON.stringify(api.requestSnapshot),
        response_snapshot: JSON.stringify(api.responseSnapshot),
        updated_at: api.updatedAt
      })
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM saved_apis WHERE id = $id').run({ id })
  }
}

function mapRow(row: SavedApiRow): SavedApi {
  return {
    id: row.id,
    name: row.name,
    identity: row.identity,
    method: row.method,
    origin: row.origin,
    path: row.path,
    query: row.query,
    requestSnapshot: JSON.parse(row.request_snapshot),
    responseSnapshot: JSON.parse(row.response_snapshot),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}
