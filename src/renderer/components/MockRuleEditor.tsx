import { useState } from 'react'
import { RESPONSE_PRESETS } from '@shared/constants'
import type { MockRule } from '@shared/types'

interface MockRuleEditorProps {
  rule: MockRule
  identity: string
  originalBody: string
}

export const MockRuleEditor = ({ rule, identity, originalBody }: MockRuleEditorProps) => {
  const [status, setStatus] = useState(rule.responseOverride.status)
  const [body, setBody] = useState(rule.responseOverride.body)
  const [headers, setHeaders] = useState(JSON.stringify(rule.responseOverride.headers, null, 2))
  const [mode, setMode] = useState(rule.interceptionMode)
  const [priority, setPriority] = useState(rule.priority)
  const [message, setMessage] = useState('')

  const save = async () => {
    setMessage('')
    let parsedHeaders: Record<string, string>
    try {
      parsedHeaders = JSON.parse(headers) as Record<string, string>
    } catch {
      setMessage('Headers must be valid JSON')
      return
    }
    if (mode === 'modify-and-forward' && isProductionOrigin(rule.matchCriteria.origin)) {
      const confirmed = window.confirm('This forwards a modified request to a production origin. Continue?')
      if (!confirmed) return
    }
    await window.apireplay.updateRule({
      id: rule.id,
      interceptionMode: mode,
      priority,
      responseOverride: { ...rule.responseOverride, status, body, headers: parsedHeaders }
    })
    setMessage('Saved')
  }

  return (
    <div className="space-y-3 text-sm">
      <p className="text-xs text-fg-muted">
        Matches {rule.matchCriteria.method} {rule.matchCriteria.origin}
        {rule.matchCriteria.path}
      </p>
      <label className="flex items-center gap-2">
        Enabled
        <input
          type="checkbox"
          checked={rule.enabled}
          onChange={(event) => void window.apireplay.setRuleEnabled(rule.id, event.target.checked)}
        />
      </label>
      <label className="block">
        Mode
        <select
          value={mode}
          onChange={(event) => setMode(event.target.value as MockRule['interceptionMode'])}
          className="field-input"
        >
          <option value="mock-response">Mock response</option>
          <option value="modify-and-forward">Modify and forward</option>
        </select>
      </label>
      <label className="block">
        Status
        <input
          type="number"
          value={status}
          onChange={(event) => setStatus(Number(event.target.value))}
          className="field-input"
        />
      </label>
      <label className="block">
        Priority
        <input
          type="number"
          value={priority}
          onChange={(event) => setPriority(Number(event.target.value))}
          className="field-input"
        />
      </label>
      <div className="flex flex-wrap gap-1">
        {RESPONSE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            className="btn-ghost px-2 py-1 text-xs"
            onClick={() => {
              if (!window.confirm(`Apply ${preset.status} preset?`)) return
              setStatus(preset.status)
              setBody(preset.body)
            }}
          >
            {preset.status}
          </button>
        ))}
      </div>
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        className="h-32 w-full rounded-md border border-line bg-ink p-2 font-mono text-xs text-fg"
      />
      <textarea
        value={headers}
        onChange={(event) => setHeaders(event.target.value)}
        className="h-24 w-full rounded-md border border-line bg-ink p-2 font-mono text-xs text-fg"
      />
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" onClick={() => void save()}>
          Save changes
        </button>
        <button className="btn-ghost" onClick={() => setBody(originalBody)}>
          Restore captured
        </button>
        <button className="btn-ghost" onClick={() => void window.apireplay.duplicateRule(rule.id)}>
          Duplicate
        </button>
        <button className="btn-danger" onClick={() => void window.apireplay.deleteRule(rule.id)}>
          Delete rule
        </button>
        <button
          className="btn-ghost"
          onClick={async () => {
            const matched = await window.apireplay.testMatch(rule.id, identity)
            setMessage(matched ? 'Current capture matches' : 'Current capture does not match')
          }}
        >
          Test match
        </button>
      </div>
      <p className="text-xs text-fg-muted">
        Matches: {rule.matchCount}
        {rule.lastMatchedAt ? ` · last ${new Date(rule.lastMatchedAt).toLocaleTimeString()}` : ''}
      </p>
      {message && <p className="text-xs text-accent">{message}</p>}
    </div>
  )
}

function isProductionOrigin(origin: string): boolean {
  return !/localhost|127\.0\.0\.1/i.test(origin)
}
