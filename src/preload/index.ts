import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannel } from '@shared/ipc'
import type { AppSnapshot, MockRule } from '@shared/types'

const api = {
  getSnapshot: () => ipcRenderer.invoke(IpcChannel.appGetSnapshot) as Promise<AppSnapshot>,
  navigate: (url: string) => ipcRenderer.invoke(IpcChannel.browserNavigate, { url }),
  goBack: () => ipcRenderer.invoke(IpcChannel.browserGoBack),
  goForward: () => ipcRenderer.invoke(IpcChannel.browserGoForward),
  reload: () => ipcRenderer.invoke(IpcChannel.browserReload),
  setBounds: (bounds: { x: number; y: number; width: number; height: number }) =>
    ipcRenderer.invoke(IpcChannel.browserSetBounds, bounds),
  setRecording: (enabled: boolean) => ipcRenderer.invoke(IpcChannel.recordingSetEnabled, { enabled }),
  clearCaptures: () => ipcRenderer.invoke(IpcChannel.capturesClear),
  setMocking: (enabled: boolean) => ipcRenderer.invoke(IpcChannel.mocksSetGlobalEnabled, { enabled }),
  emergencyDisable: () => ipcRenderer.invoke(IpcChannel.mocksEmergencyDisable),
  saveApi: (input: {
    name: string
    identity: string
    activateRule: boolean
    replaceExistingId?: string
    saveAsNew?: boolean
  }) => ipcRenderer.invoke(IpcChannel.savedApisSave, input),
  deleteSavedApi: (id: string) => ipcRenderer.invoke(IpcChannel.savedApisDelete, { id }),
  updateRule: (rule: Partial<MockRule> & { id: string }) =>
    ipcRenderer.invoke(IpcChannel.rulesUpdate, rule),
  setRuleEnabled: (id: string, enabled: boolean) =>
    ipcRenderer.invoke(IpcChannel.rulesSetEnabled, { id, enabled }),
  deleteRule: (id: string) => ipcRenderer.invoke(IpcChannel.rulesDelete, { id }),
  duplicateRule: (id: string) => ipcRenderer.invoke(IpcChannel.rulesDuplicate, { id }),
  setRulePriority: (id: string, priority: number) =>
    ipcRenderer.invoke(IpcChannel.rulesSetPriority, { id, priority }),
  testMatch: (ruleId: string, identity: string) =>
    ipcRenderer.invoke(IpcChannel.rulesTestMatch, { ruleId, identity }),
  onSnapshot: (listener: (snapshot: AppSnapshot) => void) => {
    const handler = (_event: unknown, snapshot: AppSnapshot) => listener(snapshot)
    ipcRenderer.on(IpcChannel.snapshotChanged, handler)
    return () => {
      ipcRenderer.removeListener(IpcChannel.snapshotChanged, handler)
    }
  }
}

contextBridge.exposeInMainWorld('apireplay', api)

export type ApiReplayPreload = typeof api
