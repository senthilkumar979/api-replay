interface StatusBarProps {
  url: string
  isRecording: boolean
  isMockingEnabled: boolean
}

export const StatusBar = ({ url, isRecording, isMockingEnabled }: StatusBarProps) => (
  <div className="flex items-center justify-between border-b border-line bg-ink px-3 py-1 font-mono text-[11px] text-fg-subtle">
    <span data-testid="current-url" className="truncate text-fg-muted">
      {url || 'No page loaded'}
    </span>
    <span className="flex items-center gap-2">
      <span className={isRecording ? 'text-record' : ''}>{isRecording ? 'REC' : 'PAUSED'}</span>
      {isMockingEnabled && <span className="text-mock">MOCKING</span>}
    </span>
  </div>
)
