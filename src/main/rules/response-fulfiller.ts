import type { ResponseOverride } from '@shared/types'
import { toHeaderArray } from '../browser/body-utils'
import type { CdpSessionManager } from '../browser/cdp-session-manager'

const BODYLESS_STATUSES = new Set([204, 205, 304])

export function assertResponseOverride(override: ResponseOverride): void {
  if (override.status < 100 || override.status > 599) {
    throw new Error('Status code must be between 100 and 599')
  }
  if (BODYLESS_STATUSES.has(override.status) && override.body.trim().length > 0) {
    throw new Error(`Status ${override.status} cannot include a response body`)
  }
}

export async function fulfillMockResponse(
  cdp: CdpSessionManager,
  fetchRequestId: string,
  override: ResponseOverride
): Promise<void> {
  assertResponseOverride(override)
  const headers = { ...override.headers }
  const bodyless = BODYLESS_STATUSES.has(override.status)
  const body = bodyless ? undefined : Buffer.from(override.body, 'utf8').toString('base64')

  await cdp.send('Fetch.fulfillRequest', {
    requestId: fetchRequestId,
    responseCode: override.status,
    responsePhrase: override.statusText,
    responseHeaders: toHeaderArray(headers),
    body
  })
}

export async function failMockSafely(
  cdp: CdpSessionManager,
  fetchRequestId: string,
  message: string
): Promise<void> {
  const body = Buffer.from(JSON.stringify({ error: 'Mock fulfillment failed', message }), 'utf8').toString(
    'base64'
  )
  await cdp.send('Fetch.fulfillRequest', {
    requestId: fetchRequestId,
    responseCode: 502,
    responsePhrase: 'Mock Fulfillment Failed',
    responseHeaders: toHeaderArray({ 'Content-Type': 'application/json' }),
    body
  })
}
