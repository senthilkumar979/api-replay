import { useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { ChevronLeft, ChevronRight, PanelRightClose, PanelRightOpen } from 'lucide-react'
import type { CaptureGroup, MockRule, SavedApi } from '@shared/types'
import { methodTone } from '../theme/tones'
import { DetailsTabPanels } from './DetailsTabPanels'
import { SaveApiDialog } from './SaveApiDialog'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'request-headers', label: 'Request headers' },
  { id: 'query', label: 'Query' },
  { id: 'request-body', label: 'Request body' },
  { id: 'response-headers', label: 'Response headers' },
  { id: 'response-body', label: 'Response body' },
  { id: 'timing', label: 'Timing' },
  { id: 'history', label: 'History' }
] as const

interface ApiRequestDetailsProps {
  group?: CaptureGroup
  savedApis: SavedApi[]
  rules: MockRule[]
  collapsed: boolean
  onToggleCollapsed: () => void
}

export const ApiRequestDetails = ({
  group,
  savedApis,
  rules,
  collapsed,
  onToggleCollapsed
}: ApiRequestDetailsProps) => {
  const [railCollapsed, setRailCollapsed] = useState(false)

  if (collapsed) {
    return (
      <aside className="flex w-10 flex-col items-center border-l border-line bg-surface py-2">
        <button type="button" aria-label="Expand API details" className="rounded p-1 text-fg-muted hover:bg-overlay hover:text-fg" onClick={onToggleCollapsed}>
          <PanelRightOpen size={16} />
        </button>
      </aside>
    )
  }

  if (!group) {
    return (
      <aside className="flex h-full min-w-0 flex-1 flex-col border-l border-line bg-surface">
        <div className="flex justify-end border-b border-line px-3 py-2">
          <button type="button" aria-label="Collapse API details" className="text-fg-muted hover:text-fg" onClick={onToggleCollapsed}>
            <PanelRightClose size={16} />
          </button>
        </div>
        <p className="flex flex-1 items-center justify-center text-sm text-fg-subtle">Select an API</p>
      </aside>
    )
  }

  const saved = savedApis.find((item) => item.identity === group.identity)
  const rule = rules.find((item) => item.savedApiId === saved?.id)
  const tabs = rule ? [...TABS, { id: 'rule', label: 'Mock rule' }] : TABS

  return (
    <aside className="flex h-full min-w-0 flex-1 flex-col border-l border-line bg-surface">
      <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-xs text-fg-muted">{group.origin}</p>
          <h2 className="truncate text-[15px] font-semibold">
            <span className={`mr-2 font-mono text-xs ${methodTone(group.method)}`}>{group.method}</span>
            <span className="font-mono text-fg">{group.path}</span>
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <SaveApiDialog group={group} />
          <button type="button" aria-label="Collapse API details" className="rounded p-1 text-fg-muted hover:bg-overlay hover:text-fg" onClick={onToggleCollapsed}>
            <PanelRightClose size={16} />
          </button>
        </div>
      </div>
      <Tabs.Root defaultValue="overview" className="flex min-h-0 flex-1">
        <div className="flex border-r border-line bg-raised">
          <Tabs.List className={`flex flex-col gap-0.5 overflow-auto py-3 ${railCollapsed ? 'w-10 px-1' : 'w-44 px-2'}`}>
            {tabs.map((tab) => (
              <Tabs.Trigger
                key={tab.id}
                value={tab.id}
                title={tab.label}
                className="rounded-md px-2 py-1.5 text-left text-[13px] text-fg-muted hover:bg-overlay hover:text-fg data-[state=active]:bg-overlay data-[state=active]:text-accent"
              >
                {railCollapsed ? tab.label.slice(0, 1) : tab.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <button
            type="button"
            aria-label={railCollapsed ? 'Expand tabs' : 'Collapse tabs'}
            className="flex w-4 items-center justify-center border-l border-line text-fg-subtle hover:bg-overlay hover:text-fg"
            onClick={() => setRailCollapsed((value) => !value)}
          >
            {railCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>
        </div>
        <div className="min-h-0 min-w-0 flex-1 overflow-auto p-5">
          <DetailsTabPanels group={group} rule={rule} />
        </div>
      </Tabs.Root>
    </aside>
  )
}
