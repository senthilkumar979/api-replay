import { useEffect } from 'react'
import { useAtom } from 'jotai'
import { snapshotAtom } from '../state/atoms'

export const useAppSnapshot = () => {
  const [snapshot, setSnapshot] = useAtom(snapshotAtom)

  useEffect(() => {
    void window.apireplay.getSnapshot().then(setSnapshot)
    return window.apireplay.onSnapshot(setSnapshot)
  }, [setSnapshot])

  return snapshot
}
