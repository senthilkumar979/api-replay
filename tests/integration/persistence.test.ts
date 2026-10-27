import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CaptureSession } from '../../src/main/browser/capture-session'
import { createRuleFromSavedApi, createSavedApi, persistSavedApi } from '../../src/main/app/save-workflow'
import { openDatabase } from '../../src/main/storage/database'
import { RuleRepository } from '../../src/main/storage/rule-repository'
import { SavedApiRepository } from '../../src/main/storage/saved-api-repository'
import type { CaptureExecution } from '@shared/types'

describe('persistence', () => {
  it('does not persist unsaved captures in sqlite', async () => {
    const db = await openDatabase(':memory:')
    const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`).all() as Array<{
      name: string
    }>
    expect(tables.map((row) => row.name)).toEqual(expect.arrayContaining(['saved_apis', 'mock_rules']))
    expect(tables.map((row) => row.name)).not.toContain('captures')
    const session = new CaptureSession()
    session.upsertExecution('http://127.0.0.1/api/products', 'GET', 'Fetch', execution())
    expect(new SavedApiRepository(db).list()).toHaveLength(0)
  })

  it('saves APIs transactionally and keeps them after reopen', async () => {
    const file = join(mkdtempSync(join(tmpdir(), 'apireplay-')), 'data.sqlite')
    const first = await openDatabase(file)
    const savedApis = new SavedApiRepository(first)
    const rules = new RuleRepository(first)
    const session = new CaptureSession()
    const group = session.upsertExecution('http://127.0.0.1/api/products', 'GET', 'Fetch', execution())
    const api = createSavedApi(group, { name: 'Products', identity: group.identity, activateRule: false })
    const rule = createRuleFromSavedApi(api, false)
    persistSavedApi({ savedApis, rules, db: first, api, rule })
    expect(rule.enabled).toBe(false)
    first.close()

    const second = await openDatabase(file)
    expect(new SavedApiRepository(second).list()).toHaveLength(1)
    expect(new RuleRepository(second).list()[0].enabled).toBe(false)
    second.close()
  })

  it('deletes the associated rule with the saved API', async () => {
    const db = await openDatabase(':memory:')
    const savedApis = new SavedApiRepository(db)
    const rules = new RuleRepository(db)
    const session = new CaptureSession()
    const group = session.upsertExecution('http://127.0.0.1/api/products', 'GET', 'Fetch', execution())
    const api = createSavedApi(group, { name: 'Products', identity: group.identity, activateRule: true })
    persistSavedApi({ savedApis, rules, db, api, rule: createRuleFromSavedApi(api, true) })
    const run = db.transaction(() => {
      rules.deleteBySavedApi(api.id)
      savedApis.delete(api.id)
    })
    run()
    expect(savedApis.list()).toHaveLength(0)
    expect(rules.list()).toHaveLength(0)
  })
})

function execution(): CaptureExecution {
  return {
    id: '1',
    networkRequestId: 'n1',
    startedAt: Date.now(),
    requestHeaders: {},
    responseHeaders: { 'Content-Type': 'application/json' },
    requestBody: { state: 'empty' },
    responseBody: { state: 'available', text: '{"ok":true}', encoding: 'utf8' },
    mocked: false,
    lifecycle: 'complete',
    status: 200
  }
}
