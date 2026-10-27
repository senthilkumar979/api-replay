import { MAX_BODY_BYTES } from '@shared/constants'
import type { BodyPayload } from '@shared/types'

export function emptyBody(): BodyPayload {
  return { state: 'empty', sizeBytes: 0, text: '' }
}

export function unavailableBody(reason: string): BodyPayload {
  return { state: 'unavailable', reason }
}

export function unsupportedBody(reason: string): BodyPayload {
  return { state: 'unsupported', reason }
}

export function tooLargeBody(sizeBytes: number): BodyPayload {
  return { state: 'too-large', sizeBytes, reason: `Body exceeds ${MAX_BODY_BYTES} bytes` }
}

export function decodeCdpBody(
  body: string | undefined,
  base64Encoded: boolean | undefined,
  mimeType?: string
): BodyPayload {
  if (body === undefined || body === '') return emptyBody()

  const byteLength = base64Encoded
    ? Math.floor((body.length * 3) / 4)
    : Buffer.byteLength(body, 'utf8')

  if (byteLength > MAX_BODY_BYTES) return tooLargeBody(byteLength)

  if (base64Encoded) {
    const decoded = Buffer.from(body, 'base64')
    const isText = isLikelyText(mimeType, decoded)
    if (!isText) {
      return {
        state: 'available',
        mimeType,
        encoding: 'base64',
        text: body,
        sizeBytes: decoded.length
      }
    }
    return {
      state: 'available',
      mimeType,
      encoding: 'utf8',
      text: decoded.toString('utf8'),
      sizeBytes: decoded.length
    }
  }

  return {
    state: 'available',
    mimeType,
    encoding: 'utf8',
    text: body,
    sizeBytes: byteLength
  }
}

function isLikelyText(mimeType: string | undefined, buffer: Buffer): boolean {
  if (mimeType?.startsWith('text/')) return true
  if (mimeType?.includes('json') || mimeType?.includes('xml') || mimeType?.includes('javascript')) {
    return true
  }
  const sample = buffer.subarray(0, 512)
  return !sample.includes(0)
}

export function headersFromCdp(
  headers: Record<string, string> | undefined
): Record<string, string> {
  if (!headers) return {}
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers)) result[key] = value
  return result
}

export function toHeaderArray(headers: Record<string, string>): Array<{ name: string; value: string }> {
  return Object.entries(headers).map(([name, value]) => ({ name, value }))
}
