export function methodTone(method: string): string {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'text-method-get'
    case 'POST':
      return 'text-method-post'
    case 'PUT':
      return 'text-method-put'
    case 'PATCH':
      return 'text-method-patch'
    case 'DELETE':
      return 'text-method-delete'
    default:
      return 'text-fg-muted'
  }
}

export function statusTone(status?: number): string {
  if (!status) return 'text-fg-muted'
  if (status >= 500) return 'text-status-5xx'
  if (status >= 400) return 'text-status-4xx'
  if (status >= 300) return 'text-status-3xx'
  return 'text-status-2xx'
}

export function captureStateTone(mocked: boolean, saved: boolean): string {
  if (mocked) return 'text-mock'
  if (saved) return 'text-accent'
  return 'text-fg-subtle'
}
