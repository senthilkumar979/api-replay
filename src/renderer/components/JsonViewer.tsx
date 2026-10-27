import type { BodyPayload } from '@shared/types'

interface JsonViewerProps {
  title: string
  body: BodyPayload
}

export const JsonViewer = ({ title, body }: JsonViewerProps) => {
  const text = formatBody(body)

  return (
    <div className="flex h-full min-h-[280px] flex-col space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        <div className="flex items-center gap-2 text-xs text-fg-muted">
          <span>{body.state}</span>
          {text && (
            <button
              className="btn-ghost px-2 py-1 text-xs"
              onClick={() => void navigator.clipboard.writeText(text)}
            >
              Copy
            </button>
          )}
        </div>
      </div>
      {body.state !== 'available' && body.state !== 'empty' ? (
        <p className="rounded-md border border-mock/40 bg-mock/10 p-3 text-sm text-mock">
          {body.reason ?? `Body is ${body.state}`}
        </p>
      ) : (
        <pre className="min-h-0 flex-1 overflow-auto rounded-md border border-line bg-ink p-4 font-mono text-[13px] leading-6 text-method-get">
          {text || '(empty)'}
        </pre>
      )}
    </div>
  )
}

function formatBody(body: BodyPayload): string {
  if (!body.text) return ''
  try {
    return JSON.stringify(JSON.parse(body.text), null, 2)
  } catch {
    return body.text
  }
}
