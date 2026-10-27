/// <reference types="vite/client" />
import type { ApiReplayPreload } from '../preload/index'

declare global {
  interface Window {
    apireplay: ApiReplayPreload
  }
}

export {}
