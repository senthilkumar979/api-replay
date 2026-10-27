import { useEffect, useState } from 'react'
import { useAtomValue } from 'jotai'
import { PanelBottom } from 'lucide-react'
import { useCaptureFilters } from './hooks/useCaptureFilters'
import { useAppSnapshot } from './hooks/useAppSnapshot'
import { usePointerResize } from './hooks/usePointerResize'
import { selectedIdentityAtom } from './state/atoms'
import { ApiRequestDetails } from './components/ApiRequestDetails'
import { ApiRequestList } from './components/ApiRequestList'
import { BrowserPane } from './components/BrowserPane'
import { BrowserToolbar } from './components/BrowserToolbar'
import { SplitHandle } from './components/SplitHandle'
import { StatusBar } from './components/StatusBar'

export const App = () => {
  const snapshot = useAppSnapshot()
  const selectedIdentity = useAtomValue(selectedIdentityAtom)
  const captures = useCaptureFilters(snapshot.captures)
  const selected = snapshot.captures.find((item) => item.identity === selectedIdentity)
  const [detailsCollapsed, setDetailsCollapsed] = useState(false)
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false)
  const browserPane = usePointerResize({
    axis: 'y',
    min: 140,
    initial: 280,
    getMax: () => Math.max(180, window.innerHeight - 220)
  })
  const detailsPane = usePointerResize({
    axis: 'x',
    invert: true,
    min: 480,
    initial: Math.round(window.innerWidth * 0.58),
    getMax: () => Math.max(480, window.innerWidth - 320)
  })

  useEffect(() => {
    if (selectedIdentity && !inspectorCollapsed) setDetailsCollapsed(false)
  }, [inspectorCollapsed, selectedIdentity])

  return (
    <div className="flex h-full flex-col bg-ink text-fg">
      <BrowserToolbar
        browser={snapshot.browser}
        inspectorCollapsed={inspectorCollapsed}
        onToggleInspector={() => setInspectorCollapsed((value) => !value)}
      />
      <StatusBar
        url={snapshot.browser.url}
        isRecording={snapshot.browser.isRecording}
        isMockingEnabled={snapshot.browser.isMockingEnabled}
      />
      <div
        className={inspectorCollapsed ? 'min-h-0 flex-1' : 'min-h-[140px] shrink-0'}
        style={inspectorCollapsed ? undefined : { height: browserPane.size }}
      >
        <BrowserPane />
      </div>
      {inspectorCollapsed ? (
        <button
          type="button"
          data-testid="show-inspector"
          className="flex h-8 items-center justify-center gap-2 border-t border-line bg-surface text-xs text-fg-muted hover:bg-raised hover:text-fg"
          onClick={() => setInspectorCollapsed(false)}
        >
          <PanelBottom size={14} />
          Show inspector
        </button>
      ) : (
        <>
          <SplitHandle
            axis="y"
            label="Resize inspector"
            onPointerDown={browserPane.onPointerDown}
            onPointerMove={browserPane.onPointerMove}
            onPointerUp={browserPane.onPointerUp}
          />
          <div className="flex min-h-[220px] min-w-0 flex-1 overflow-hidden">
            <ApiRequestList captures={captures} />
            {!detailsCollapsed && (
              <SplitHandle
                axis="x"
                label="Resize API details"
                onPointerDown={detailsPane.onPointerDown}
                onPointerMove={detailsPane.onPointerMove}
                onPointerUp={detailsPane.onPointerUp}
              />
            )}
            <div
              className={detailsCollapsed ? 'shrink-0' : 'min-w-[480px] shrink-0'}
              style={{ width: detailsCollapsed ? 40 : detailsPane.size }}
            >
              <ApiRequestDetails
                group={selected}
                savedApis={snapshot.savedApis}
                rules={snapshot.rules}
                collapsed={detailsCollapsed}
                onToggleCollapsed={() => setDetailsCollapsed((value) => !value)}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
