import type { CaptureGroup, CaptureExecution } from '@shared/types'

interface DetailsOverviewProps {
  group: CaptureGroup
  latest: CaptureExecution
}

export const DetailsOverview = ({ group, latest }: DetailsOverviewProps) => {
  const rows = [
    ['Origin', group.origin],
    ['Method', group.method],
    ['Path', group.path],
    ['Query', group.query || '(none)'],
    ['Status', `${latest.status ?? '—'} ${latest.statusText ?? ''}`.trim()],
    ['Lifecycle', latest.lifecycle],
    ['Resource type', group.resourceType],
    ['Count', String(group.requestCount)],
    ['Duration', latest.durationMs == null ? '—' : `${latest.durationMs}ms`],
    ['Started', new Date(latest.startedAt).toLocaleString()],
    ['Mocked', latest.mocked ? 'Yes' : 'No'],
    ['Matched rule', latest.matchedRuleId ?? '—']
  ]

  return (
    <dl className="grid grid-cols-[160px_1fr] gap-x-6 gap-y-3 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-fg-muted">{label}</dt>
          <dd className="break-all font-mono text-[13px] text-fg">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
