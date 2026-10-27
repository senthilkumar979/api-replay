export const APP_NAME = 'ApiReplay'
export const MAX_BODY_BYTES = 1_048_576
export const MAX_HISTORY_PER_IDENTITY = 50
export const MAX_CAPTURE_GROUPS = 2000
export const PAUSED_REQUEST_TIMEOUT_MS = 10_000
export const DEFAULT_RULE_PRIORITY = 100

export const INTERCEPTABLE_RESOURCE_TYPES = ['XHR', 'Fetch'] as const
export const DEFAULT_RESOURCE_TYPE_FILTER = 'XHR'
export const RESOURCE_TYPE_FILTERS = [
  'XHR',
  'Fetch',
  'Document',
  'Script',
  'Stylesheet',
  'Image',
  'Font',
  'Media',
  'WebSocket',
  'Preflight',
  'Other'
] as const

export const RESPONSE_PRESETS = [
  { id: '200', status: 200, statusText: 'OK', body: '{"ok":true}' },
  { id: '201', status: 201, statusText: 'Created', body: '{"created":true}' },
  { id: '204', status: 204, statusText: 'No Content', body: '' },
  { id: '400', status: 400, statusText: 'Bad Request', body: '{"error":"Bad Request"}' },
  { id: '401', status: 401, statusText: 'Unauthorized', body: '{"error":"Unauthorized"}' },
  { id: '403', status: 403, statusText: 'Forbidden', body: '{"error":"Forbidden"}' },
  { id: '404', status: 404, statusText: 'Not Found', body: '{"error":"Not Found"}' },
  { id: '422', status: 422, statusText: 'Unprocessable Entity', body: '{"error":"Validation Error"}' },
  { id: '429', status: 429, statusText: 'Too Many Requests', body: '{"error":"Too Many Requests"}' },
  { id: '500', status: 500, statusText: 'Internal Server Error', body: '{"error":"Internal Server Error"}' },
  { id: '503', status: 503, statusText: 'Service Unavailable', body: '{"error":"Service Unavailable"}' }
] as const
