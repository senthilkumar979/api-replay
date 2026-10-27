import { ipcMain } from 'electron'
import { IpcChannel } from '@shared/ipc'
import { z } from 'zod'
import {
  boundsSchema,
  enabledSchema,
  idSchema,
  navigateSchema,
  saveApiSchema,
  setPrioritySchema,
  testMatchSchema,
  updateRuleSchema
} from '@shared/schemas'
import type { AppController } from '../app-controller'

export function registerIpcHandlers(controller: AppController): void {
  ipcMain.handle(IpcChannel.appGetSnapshot, () => controller.snapshot())
  ipcMain.handle(IpcChannel.browserNavigate, async (_event, payload) => {
    const { url } = navigateSchema.parse(payload)
    await controller.navigate(url)
  })
  ipcMain.handle(IpcChannel.browserGoBack, () => controller.browser.goBack())
  ipcMain.handle(IpcChannel.browserGoForward, () => controller.browser.goForward())
  ipcMain.handle(IpcChannel.browserReload, () => controller.browser.reload())
  ipcMain.handle(IpcChannel.browserSetBounds, (_event, payload) => {
    controller.browser.setBounds(boundsSchema.parse(payload))
  })
  ipcMain.handle(IpcChannel.recordingSetEnabled, async (_event, payload) => {
    await controller.setRecording(enabledSchema.parse(payload).enabled)
  })
  ipcMain.handle(IpcChannel.capturesClear, () => controller.clearCaptures())
  ipcMain.handle(IpcChannel.mocksSetGlobalEnabled, async (_event, payload) => {
    await controller.setMocking(enabledSchema.parse(payload).enabled)
  })
  ipcMain.handle(IpcChannel.mocksEmergencyDisable, async () => controller.emergencyDisable())
  ipcMain.handle(IpcChannel.savedApisSave, (_event, payload) => controller.saveApi(saveApiSchema.parse(payload)))
  ipcMain.handle(IpcChannel.savedApisDelete, (_event, payload) => {
    controller.deleteSavedApi(idSchema.parse(payload).id)
  })
  ipcMain.handle(IpcChannel.rulesUpdate, (_event, payload) => {
    const input = updateRuleSchema.parse(payload)
    const existing = controller.rules.get(input.id)
    if (!existing) throw new Error('Rule not found')
    controller.updateRule({ ...existing, ...input, id: existing.id })
  })
  ipcMain.handle(IpcChannel.rulesSetEnabled, (_event, payload) => {
    const { id, enabled } = z.object({ id: z.string().min(1), enabled: z.boolean() }).parse(payload)
    const existing = controller.rules.get(id)
    if (!existing) throw new Error('Rule not found')
    controller.updateRule({ ...existing, enabled })
  })
  ipcMain.handle(IpcChannel.rulesDelete, (_event, payload) => {
    controller.rules.delete(idSchema.parse(payload).id)
    controller.interceptorSync()
  })
  ipcMain.handle(IpcChannel.rulesDuplicate, (_event, payload) => {
    controller.duplicateRule(idSchema.parse(payload).id)
  })
  ipcMain.handle(IpcChannel.rulesSetPriority, (_event, payload) => {
    const { id, priority } = setPrioritySchema.parse(payload)
    const existing = controller.rules.get(id)
    if (!existing) throw new Error('Rule not found')
    controller.updateRule({ ...existing, priority })
  })
  ipcMain.handle(IpcChannel.rulesTestMatch, (_event, payload) => {
    const { ruleId, identity } = testMatchSchema.parse(payload)
    return controller.testMatch(ruleId, identity)
  })
}
