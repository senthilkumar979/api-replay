import { atom } from 'jotai'
import { DEFAULT_RESOURCE_TYPE_FILTER } from '@shared/constants'
import type { AppSnapshot } from '@shared/types'

export const snapshotAtom = atom<AppSnapshot>({
  browser: {
    url: '',
    canGoBack: false,
    canGoForward: false,
    isRecording: true,
    isMockingEnabled: false,
    isLoading: false
  },
  captures: [],
  savedApis: [],
  rules: []
})

export const selectedIdentityAtom = atom<string | null>(null)
export const searchAtom = atom('')
export const methodFilterAtom = atom('all')
export const typeFilterAtom = atom(DEFAULT_RESOURCE_TYPE_FILTER)
export const statusFilterAtom = atom('all')
export const stateFilterAtom = atom('all')
export const sortKeyAtom = atom<'recent' | 'duration' | 'status' | 'url'>('recent')
