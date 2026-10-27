import { useEffect, useRef } from 'react'

export const BrowserPane = () => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const publish = () => {
      const rect = node.getBoundingClientRect()
      void window.apireplay.setBounds({
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      })
    }

    publish()
    const observer = new ResizeObserver(publish)
    observer.observe(node)
    window.addEventListener('resize', publish)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', publish)
    }
  }, [])

  return <div ref={ref} data-testid="browser-pane" className="h-full min-h-0 bg-ink" />
}
