import { useRef, useState } from 'react'

interface UsePointerResizeOptions {
  axis: 'x' | 'y'
  invert?: boolean
  min: number
  getMax: () => number
  initial: number
}

export const usePointerResize = ({ axis, invert = false, min, getMax, initial }: UsePointerResizeOptions) => {
  const [size, setSize] = useState(initial)
  const drag = useRef<{ start: number; size: number } | null>(null)

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = {
      start: axis === 'x' ? event.clientX : event.clientY,
      size
    }
  }

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!drag.current) return
    const point = axis === 'x' ? event.clientX : event.clientY
    const delta = point - drag.current.start
    const next = drag.current.size + (invert ? -delta : delta)
    setSize(Math.min(getMax(), Math.max(min, next)))
  }

  const onPointerUp = () => {
    drag.current = null
  }

  return { size, setSize, onPointerDown, onPointerMove, onPointerUp }
}
