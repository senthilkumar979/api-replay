import { useMemo } from 'react'
import { useAtomValue } from 'jotai'
import debounce from 'lodash/debounce'
import { useState, useEffect } from 'react'
import type { CaptureGroup } from '@shared/types'
import {
  methodFilterAtom,
  searchAtom,
  sortKeyAtom,
  stateFilterAtom,
  statusFilterAtom,
  typeFilterAtom
} from '../state/atoms'

export const useCaptureFilters = (captures: CaptureGroup[]) => {
  const search = useAtomValue(searchAtom)
  const method = useAtomValue(methodFilterAtom)
  const type = useAtomValue(typeFilterAtom)
  const status = useAtomValue(statusFilterAtom)
  const state = useAtomValue(stateFilterAtom)
  const sortKey = useAtomValue(sortKeyAtom)
  const [debouncedSearch, setDebouncedSearch] = useState(search)

  useEffect(() => {
    const update = debounce((value: string) => setDebouncedSearch(value), 150)
    update(search)
    return () => update.cancel()
  }, [search])

  return useMemo(() => {
    const filtered = captures.filter((group) => {
      if (method !== 'all' && group.method !== method) return false
      if (type !== 'all' && group.resourceType !== type) return false
      if (status === 'failed' && !(group.lastStatus && group.lastStatus >= 400)) return false
      if (status === 'success' && !(group.lastStatus && group.lastStatus < 400)) return false
      if (state === 'saved' && !group.saved) return false
      if (state === 'unsaved' && group.saved) return false
      if (state === 'mocked' && !group.mocked) return false
      if (debouncedSearch) {
        const haystack = `${group.method} ${group.url} ${group.path}`.toLowerCase()
        if (!haystack.includes(debouncedSearch.toLowerCase())) return false
      }
      return true
    })

    return filtered.sort((a, b) => {
      if (sortKey === 'duration') return (b.lastDurationMs ?? 0) - (a.lastDurationMs ?? 0)
      if (sortKey === 'status') return (b.lastStatus ?? 0) - (a.lastStatus ?? 0)
      if (sortKey === 'url') return a.path.localeCompare(b.path)
      return b.lastActivityAt - a.lastActivityAt
    })
  }, [captures, debouncedSearch, method, sortKey, state, status, type])
}
