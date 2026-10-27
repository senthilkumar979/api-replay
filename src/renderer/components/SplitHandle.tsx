interface SplitHandleProps {
  axis: 'x' | 'y'
  label: string
  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void
  onPointerMove: (event: React.PointerEvent<HTMLButtonElement>) => void
  onPointerUp: () => void
}

export const SplitHandle = ({ axis, label, onPointerDown, onPointerMove, onPointerUp }: SplitHandleProps) => {
  const isColumn = axis === 'x'

  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className={
        isColumn
          ? 'w-1.5 shrink-0 cursor-col-resize border-0 bg-line hover:bg-accent'
          : 'h-1.5 w-full shrink-0 cursor-row-resize border-0 bg-line hover:bg-accent'
      }
    />
  )
}

interface ColumnResizeHandleProps {
  label: string
  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void
  onPointerMove: (event: React.PointerEvent<HTMLButtonElement>) => void
  onPointerUp: () => void
}

export const ColumnResizeHandle = ({
  label,
  onPointerDown,
  onPointerMove,
  onPointerUp
}: ColumnResizeHandleProps) => (
  <button
    type="button"
    aria-label={label}
    onPointerDown={onPointerDown}
    onPointerMove={onPointerMove}
    onPointerUp={onPointerUp}
    className="absolute top-0 -right-1 z-10 h-full w-2 cursor-col-resize border-0 bg-transparent hover:bg-accent"
  />
)
