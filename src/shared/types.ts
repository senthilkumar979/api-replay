export type BodyState = 'available' | 'empty' | 'unavailable' | 'too-large' | 'unsupported'

export interface BodyPayload {
  state: BodyState
  mimeType?: string
  encoding?: 'utf8' | 'base64'
  text?: string
  sizeBytes?: number
  reason?: string
}

export interface CaptureTiming {
  requestTime?: number
  sendStart?: number
  sendEnd?: number
  receiveHeadersEnd?: number
}

export type CaptureLifecycle =
  | 'pending'
  | 'responding'
  | 'complete'
  | 'failed'
  | 'cancelled'
  | 'mocked'

export interface CaptureExecution {
  id: string
  networkRequestId: string
  fetchRequestId?: string
  startedAt: number
  durationMs?: number
  status?: number
  statusText?: string
  mimeType?: string
  requestHeaders: Record<string, string>
  responseHeaders: Record<string, string>
  requestBody: BodyPayload
  responseBody: BodyPayload
  failedReason?: string
  mocked: boolean
  matchedRuleId?: string
  timing?: CaptureTiming
  initiator?: string
  lifecycle: CaptureLifecycle
}

export interface CaptureGroup {
  identity: string
  method: string
  origin: string
  path: string
  query: string
  url: string
  resourceType: string
  requestCount: number
  lastStatus?: number
  lastDurationMs?: number
  lastActivityAt: number
  saved: boolean
  savedApiId?: string
  mocked: boolean
  latest: CaptureExecution
  history: CaptureExecution[]
}

export interface BrowserState {
  url: string
  canGoBack: boolean
  canGoForward: boolean
  isRecording: boolean
  isMockingEnabled: boolean
  isLoading: boolean
}

export type InterceptionMode = 'mock-response' | 'modify-and-forward'

export interface MatchCriteria {
  origin: string
  path: string
  method: string
  query?: Record<string, string>
  headers?: Record<string, string>
  jsonBody?: Record<string, unknown>
}

export interface RequestOverride {
  method?: string
  url?: string
  headers?: Record<string, string>
  postData?: string
}

export interface ResponseOverride {
  status: number
  statusText?: string
  headers: Record<string, string>
  body: string
}

export interface SavedApi {
  id: string
  name: string
  identity: string
  method: string
  origin: string
  path: string
  query: string
  requestSnapshot: CaptureExecution
  responseSnapshot: CaptureExecution
  createdAt: number
  updatedAt: number
}

export interface MockRule {
  id: string
  savedApiId: string
  enabled: boolean
  priority: number
  interceptionMode: InterceptionMode
  matchCriteria: MatchCriteria
  requestOverride?: RequestOverride
  responseOverride: ResponseOverride
  matchCount: number
  lastMatchedAt?: number
  createdAt: number
  updatedAt: number
}

export interface SaveApiInput {
  name: string
  identity: string
  activateRule: boolean
  replaceExistingId?: string
  saveAsNew?: boolean
}

export interface AppSnapshot {
  browser: BrowserState
  captures: CaptureGroup[]
  savedApis: SavedApi[]
  rules: MockRule[]
}
