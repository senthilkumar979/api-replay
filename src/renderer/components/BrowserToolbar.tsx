import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, CircleStop, PanelBottom, PanelBottomClose, Radio, RefreshCw, ShieldOff } from 'lucide-react'
import type { BrowserState } from '@shared/types'
import { APP_NAME } from '@shared/constants'
import appIcon from '../assets/icon.png'

interface BrowserToolbarProps {
  browser: BrowserState
  inspectorCollapsed: boolean
  onToggleInspector: () => void
}

export const BrowserToolbar = ({ browser, inspectorCollapsed, onToggleInspector }: BrowserToolbarProps) => {
  const [url, setUrl] = useState(browser.url)

  useEffect(() => {
    if (browser.url) setUrl(browser.url)
  }, [browser.url])

  return (
    <header className="flex items-center gap-1.5 border-b border-line bg-surface px-3 py-1.5">
      <div className="flex items-center gap-2 pr-2">
        <img src={appIcon} alt={APP_NAME} width={24} height={24} className="h-6 w-6 rounded-md" />
        <span className="text-[13px] font-semibold tracking-wide text-fg">{APP_NAME}</span>
      </div>
      <button className="toolbar-btn" disabled={!browser.canGoBack} onClick={() => void window.apireplay.goBack()}>
        <ArrowLeft size={15} />
      </button>
      <button className="toolbar-btn" disabled={!browser.canGoForward} onClick={() => void window.apireplay.goForward()}>
        <ArrowRight size={15} />
      </button>
      <button data-testid="reload" className="toolbar-btn" onClick={() => void window.apireplay.reload()}>
        <RefreshCw size={15} />
      </button>
      <form
        className="flex min-w-0 flex-1 overflow-hidden rounded-md border border-line bg-ink focus-within:border-accent"
        onSubmit={(event) => {
          event.preventDefault()
          void window.apireplay.navigate(url)
        }}
      >
        <input
          data-testid="address-bar"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="Enter a URL"
          className="h-7 min-w-0 flex-1 border-0 bg-transparent px-3 text-[13px] text-fg outline-none"
        />
        <button data-testid="navigate" className="h-7 bg-accent px-3 text-[12px] font-semibold text-accent-fg">
          Go
        </button>
      </form>
      <button
        data-testid="recording-toggle"
        className={`toolbar-chip ${browser.isRecording ? 'border-record/40 bg-record/10 text-record' : ''}`}
        onClick={() => void window.apireplay.setRecording(!browser.isRecording)}
      >
        {browser.isRecording ? <Radio size={13} className="rec-pulse" /> : <CircleStop size={13} />}
        {browser.isRecording ? 'Recording' : 'Paused'}
      </button>
      <button className="toolbar-chip" onClick={() => void window.apireplay.clearCaptures()}>
        Clear
      </button>
      <button
        data-testid="mock-toggle"
        className={`toolbar-chip ${browser.isMockingEnabled ? 'border-mock/40 bg-mock/10 text-mock' : ''}`}
        onClick={() => void window.apireplay.setMocking(!browser.isMockingEnabled)}
      >
        Mocks {browser.isMockingEnabled ? 'on' : 'off'}
      </button>
      <button
        data-testid="emergency-disable"
        className="toolbar-chip border-record/40 text-record hover:bg-record/10"
        onClick={() => void window.apireplay.emergencyDisable()}
      >
        <ShieldOff size={13} />
        Disable
      </button>
      <button data-testid="inspector-toggle" className="toolbar-chip" onClick={onToggleInspector}>
        {inspectorCollapsed ? <PanelBottom size={13} /> : <PanelBottomClose size={13} />}
        {inspectorCollapsed ? 'Inspector' : 'Hide'}
      </button>
    </header>
  )
}
