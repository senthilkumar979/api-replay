import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { BrowserWindow, app } from 'electron'
import type { AppSnapshot, BrowserState, CaptureExecution, MockRule, SaveApiInput } from '@shared/types'
import { BrowserManager } from './browser/browser-manager'
import { CaptureSession } from './browser/capture-session'
import { CdpSessionManager } from './browser/cdp-session-manager'
import { NetworkRecorder } from './browser/network-recorder'
import { RequestCorrelator } from './browser/request-correlator'
import { RequestInterceptor } from './browser/request-interceptor'
import { requestMatches } from './rules/rule-matcher'
import { openDatabase, type AppDatabase } from './storage/database'
import { RuleRepository } from './storage/rule-repository'
import { SavedApiRepository } from './storage/saved-api-repository'
import { createRuleFromSavedApi, createSavedApi, persistSavedApi } from './app/save-workflow'

export class AppController {
  readonly browser = new BrowserManager()
  readonly session = new CaptureSession()
  readonly correlator = new RequestCorrelator()
  isRecording = true
  isMockingEnabled = false
  isLoading = false
  private window: BrowserWindow | undefined
  readonly savedApis: SavedApiRepository
  readonly rules: RuleRepository
  private readonly cdp = new CdpSessionManager(() => this.browser.contents)
  private recorder!: NetworkRecorder
  private interceptor!: RequestInterceptor

  private constructor(private readonly db: AppDatabase) {
    this.savedApis = new SavedApiRepository(db)
    this.rules = new RuleRepository(db)
  }

  static async create(): Promise<AppController> {
    const db = await openDatabase(
      process.env.APIREPLAY_DB_PATH ?? join(app.getPath('userData'), 'apireplay.sqlite')
    )
    return new AppController(db)
  }

  attachWindow(window: BrowserWindow): void {
    this.window = window
    this.browser.create(window)
    this.recorder = new NetworkRecorder(this.cdp, this.session, this.correlator, () => this.emit())
    this.interceptor = new RequestInterceptor(this.cdp, this.correlator, {
      onMockMatched: (rule, networkId) => this.onMockMatched(rule, networkId),
      onFulfillFailed: (message) => this.window?.webContents.send('mocks:fulfillFailed', { message })
    })
    this.cdp.onEvent((method, params) => {
      if (this.isRecording) this.recorder.handleEvent(method, params)
      void this.interceptor.handleEvent(method, params)
    })
    this.bindContents()
    this.refreshSavedIndex()
    this.interceptor.setRules(this.rules.list())
  }

  async startCdp(): Promise<void> {
    try {
      await this.cdp.attach()
    } catch (error) {
      console.error('[apireplay] CDP attach failed', error)
      throw error
    }
  }

  snapshot(): AppSnapshot {
    return {
      browser: this.browserState(),
      captures: this.session.list(),
      savedApis: this.savedApis.list(),
      rules: this.rules.list()
    }
  }

  async navigate(url: string): Promise<void> {
    this.isLoading = true
    this.emit()
    try {
      await this.startCdp()
      await this.browser.navigate(url, process.env.NODE_ENV !== 'production')
    } finally {
      this.isLoading = false
      this.emit()
    }
  }

  clearCaptures(): void {
    this.session.clear()
    this.correlator.clear()
    this.emit()
  }

  async setRecording(enabled: boolean): Promise<void> {
    this.isRecording = enabled
    this.emit()
  }

  async setMocking(enabled: boolean): Promise<void> {
    this.isMockingEnabled = enabled
    await this.cdp.attach()
    await this.interceptor.setEnabled(enabled)
    this.emit()
  }

  async emergencyDisable(): Promise<void> {
    this.isMockingEnabled = false
    await this.interceptor.setEnabled(false)
    this.emit()
  }

  saveApi(input: SaveApiInput): { duplicates: Array<{ id: string; name: string }> } {
    const group = this.session.getByIdentity(input.identity)
    if (!group) throw new Error('Select a captured API before saving')
    const duplicates = this.savedApis.findByIdentity(input.identity)
    if (duplicates.length > 0 && !input.replaceExistingId && !input.saveAsNew) {
      return { duplicates: duplicates.map((item) => ({ id: item.id, name: item.name })) }
    }
    const api = createSavedApi(group, input)
    if (input.replaceExistingId) {
      const existing = this.savedApis.get(input.replaceExistingId)
      if (existing) api.createdAt = existing.createdAt
    }
    const rule = createRuleFromSavedApi(api, input.activateRule)
    persistSavedApi({
      savedApis: this.savedApis,
      rules: this.rules,
      db: this.db,
      api,
      rule,
      replaceExistingId: input.replaceExistingId
    })
    this.refreshSavedIndex()
    this.interceptor.setRules(this.rules.list())
    this.emit()
    return { duplicates: [] }
  }

  deleteSavedApi(id: string): void {
    const run = this.db.transaction(() => {
      this.rules.deleteBySavedApi(id)
      this.savedApis.delete(id)
    })
    run()
    this.refreshSavedIndex()
    this.interceptor.setRules(this.rules.list())
    this.emit()
  }

  updateRule(rule: MockRule): void {
    this.rules.update({ ...rule, updatedAt: Date.now() })
    this.interceptor.setRules(this.rules.list())
    this.emit()
  }

  interceptorSync(): void {
    this.interceptor.setRules(this.rules.list())
    this.emit()
  }

  duplicateRule(id: string): void {
    const rule = this.rules.get(id)
    if (!rule) throw new Error('Rule not found')
    this.rules.insert({
      ...rule,
      id: randomUUID(),
      enabled: false,
      matchCount: 0,
      lastMatchedAt: undefined,
      createdAt: Date.now(),
      updatedAt: Date.now()
    })
    this.interceptorSync()
  }

  testMatch(ruleId: string, identity: string): boolean {
    const rule = this.rules.get(ruleId)
    const group = this.session.getByIdentity(identity)
    if (!rule || !group) return false
    return requestMatches(rule.matchCriteria, {
      method: group.method,
      url: group.url,
      headers: group.latest.requestHeaders,
      postData: group.latest.requestBody.text
    })
  }

  async shutdown(): Promise<void> {
    await this.emergencyDisable()
    await this.cdp.detach()
    this.db.close()
  }

  private bindContents(): void {
    const contents = this.browser.contents
    if (!contents) return
    contents.on('did-navigate', () => this.emit())
    contents.on('did-navigate-in-page', () => this.emit())
    contents.on('did-start-loading', () => {
      this.isLoading = true
      this.emit()
    })
    contents.on('did-stop-loading', () => {
      this.isLoading = false
      this.emit()
    })
    contents.on('render-process-gone', () => {
      this.isLoading = false
      this.emit()
    })
  }

  private onMockMatched(rule: MockRule, networkId?: string): void {
    this.rules.update({
      ...rule,
      matchCount: rule.matchCount + 1,
      lastMatchedAt: Date.now(),
      updatedAt: rule.updatedAt
    })
    this.interceptor.setRules(this.rules.list())
    const applyMock = (execution: CaptureExecution, group: { mocked: boolean }) => {
      execution.mocked = true
      execution.matchedRuleId = rule.id
      execution.lifecycle = 'mocked'
      execution.status = rule.responseOverride.status
      execution.statusText = rule.responseOverride.statusText
      execution.responseHeaders = rule.responseOverride.headers
      execution.responseBody = {
        state: rule.responseOverride.body ? 'available' : 'empty',
        text: rule.responseOverride.body,
        encoding: 'utf8'
      }
      group.mocked = true
    }

    if (networkId) {
      this.session.updateByNetworkId(networkId, (execution, group) => applyMock(execution, group))
    } else {
      const identity = `${rule.matchCriteria.method} ${rule.matchCriteria.origin}${rule.matchCriteria.path}`
      const group = this.session.getByIdentity(identity)
      if (group) applyMock(group.latest, group)
    }
    this.emit()
  }

  private refreshSavedIndex(): void {
    const map = new Map<string, string>()
    for (const api of this.savedApis.list()) map.set(api.identity, api.id)
    this.session.setSavedIdentities(map)
  }

  private browserState(): BrowserState {
    return {
      url: this.browser.getUrl(),
      canGoBack: this.browser.canGoBack(),
      canGoForward: this.browser.canGoForward(),
      isRecording: this.isRecording,
      isMockingEnabled: this.isMockingEnabled,
      isLoading: this.isLoading
    }
  }

  private emit(): void {
    this.window?.webContents.send('app:snapshotChanged', this.snapshot())
  }
}
