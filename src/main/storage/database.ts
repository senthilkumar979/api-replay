import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import type { Database as SqlJsDatabase, SqlValue } from 'sql.js'

export interface Statement {
  run: (...params: unknown[]) => void
  get: (...params: unknown[]) => unknown
  all: (...params: unknown[]) => unknown[]
}

export interface AppDatabase {
  exec: (sql: string) => void
  prepare: (sql: string) => Statement
  transaction: (fn: () => void) => () => void
  close: () => void
}

export async function openDatabase(filePath: string): Promise<AppDatabase> {
  // sql-asm.js avoids WASM instantiation issues in the Electron main process.
  const loaded = await import('sql.js/dist/sql-wasm-inline.js')
  const initSqlJs = loaded.default as (config?: Record<string, never>) => Promise<{
    Database: new (data?: Uint8Array) => SqlJsDatabase
  }>
  const SQL = await initSqlJs()
  const native =
    filePath === ':memory:'
      ? new SQL.Database()
      : new SQL.Database(readExisting(filePath))

  native.run('PRAGMA foreign_keys = ON;')
  migrate(native)
  persist(filePath, native)

  let inTransaction = false
  const persistIfNeeded = () => {
    if (!inTransaction) persist(filePath, native)
  }

  return {
    exec(sql: string) {
      native.exec(sql)
      persistIfNeeded()
    },
    prepare(sql: string): Statement {
      return {
        run: (...params: unknown[]) => {
          native.run(sql, toSqlParams(params))
          persistIfNeeded()
        },
        get: (...params: unknown[]) => {
          const stmt = native.prepare(sql)
          if (params.length > 0) stmt.bind(toSqlParams(params))
          const row = stmt.step() ? stmt.getAsObject() : undefined
          stmt.free()
          return row
        },
        all: (...params: unknown[]) => {
          const stmt = native.prepare(sql)
          if (params.length > 0) stmt.bind(toSqlParams(params))
          const rows: Record<string, unknown>[] = []
          while (stmt.step()) rows.push(stmt.getAsObject())
          stmt.free()
          return rows
        }
      }
    },
    transaction(fn: () => void) {
      return () => {
        native.run('BEGIN')
        inTransaction = true
        try {
          fn()
          native.run('COMMIT')
          inTransaction = false
          persistIfNeeded()
        } catch (error) {
          native.run('ROLLBACK')
          inTransaction = false
          throw error
        }
      }
    },
    close() {
      persistIfNeeded()
      native.close()
    }
  }
}

function migrate(db: SqlJsDatabase): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS saved_apis (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      identity TEXT NOT NULL,
      method TEXT NOT NULL,
      origin TEXT NOT NULL,
      path TEXT NOT NULL,
      query TEXT NOT NULL,
      request_snapshot TEXT NOT NULL,
      response_snapshot TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS mock_rules (
      id TEXT PRIMARY KEY,
      saved_api_id TEXT NOT NULL REFERENCES saved_apis(id) ON DELETE CASCADE,
      enabled INTEGER NOT NULL DEFAULT 0,
      priority INTEGER NOT NULL DEFAULT 100,
      interception_mode TEXT NOT NULL DEFAULT 'mock-response',
      match_criteria TEXT NOT NULL,
      request_override TEXT,
      response_override TEXT NOT NULL,
      match_count INTEGER NOT NULL DEFAULT 0,
      last_matched_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_saved_apis_identity ON saved_apis(identity);
    CREATE INDEX IF NOT EXISTS idx_mock_rules_saved_api ON mock_rules(saved_api_id);
  `)
}

function readExisting(filePath: string): Uint8Array | undefined {
  try {
    return new Uint8Array(readFileSync(filePath))
  } catch {
    mkdirSync(dirname(filePath), { recursive: true })
    return undefined
  }
}

function persist(filePath: string, db: SqlJsDatabase): void {
  if (filePath === ':memory:') return
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, Buffer.from(db.export()))
}

function toSqlParams(params: unknown[]): SqlValue[] | Record<string, SqlValue> {
  if (params.length === 1 && params[0] && typeof params[0] === 'object' && !Array.isArray(params[0])) {
    const named: Record<string, SqlValue> = {}
    for (const [key, value] of Object.entries(params[0] as Record<string, unknown>)) {
      named[`$${key.replace(/^[@:$]/, '')}`] = value as SqlValue
    }
    return named
  }
  return params as SqlValue[]
}
