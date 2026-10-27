import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useAtom } from 'jotai'
import type { CaptureGroup } from '@shared/types'
import { usePointerResize } from '../hooks/usePointerResize'
import { selectedIdentityAtom } from '../state/atoms'
import { captureStateTone, statusTone } from '../theme/tones'
import { MethodBadge } from './MethodBadge'
import { ColumnResizeHandle } from './SplitHandle'
import { RequestFilters } from './RequestFilters'

interface ApiRequestListProps {
  captures: CaptureGroup[]
}

export const ApiRequestList = ({ captures }: ApiRequestListProps) => {
  const parentRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useAtom(selectedIdentityAtom)
  const pathColumn = usePointerResize({
    axis: 'x',
    min: 96,
    initial: 280,
    getMax: () => Math.max(160, (parentRef.current?.clientWidth ?? 480) - 360)
  })
  const virtualizer = useVirtualizer({
    count: captures.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44
  })
  const columns = `72px ${pathColumn.size}px 56px 72px 64px 48px 72px`

  return (
    <section className="flex min-h-0 min-w-[240px] flex-1 flex-col">
      <RequestFilters />
      <div ref={parentRef} className="min-h-0 flex-1 overflow-auto">
        <div
          className="sticky top-0 z-10 grid gap-2 border-b border-line bg-surface px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-fg-subtle"
          style={{ gridTemplateColumns: columns, minWidth: 'max-content' }}
        >
          <span>Method</span>
          <span className="relative pr-2">
            Path
            <ColumnResizeHandle
              label="Resize path column"
              onPointerDown={pathColumn.onPointerDown}
              onPointerMove={pathColumn.onPointerMove}
              onPointerUp={pathColumn.onPointerUp}
            />
          </span>
          <span>Status</span>
          <span>Type</span>
          <span>Time</span>
          <span>#</span>
          <span>State</span>
        </div>
        <div style={{ height: virtualizer.getTotalSize(), minWidth: 'max-content' }} className="relative">
          {virtualizer.getVirtualItems().map((item) => {
            const group = captures[item.index]
            return (
              <button
                key={group.identity}
                data-testid={`capture-row-${group.path}`}
                onClick={() => setSelected(group.identity)}
                className={`absolute left-0 right-0 grid gap-2 border-b border-line/60 px-3 py-2 text-left text-xs hover:bg-raised ${
                  selected === group.identity ? 'bg-overlay' : ''
                }`}
                style={{ transform: `translateY(${item.start}px)`, gridTemplateColumns: columns }}
              >
                <MethodBadge method={group.method} />
                <span className="truncate font-mono text-fg" title={group.path}>
                  {group.path}
                </span>
                <span className={`font-mono ${statusTone(group.lastStatus)}`}>{group.lastStatus ?? '—'}</span>
                <span className="truncate text-fg-muted">{group.resourceType}</span>
                <span className="font-mono text-fg-muted">{group.lastDurationMs ?? '—'}ms</span>
                <span className="text-fg-muted">{group.requestCount}</span>
                <span className={captureStateTone(group.mocked, group.saved)}>
                  {group.mocked ? 'mocked' : group.saved ? 'saved' : 'live'}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
