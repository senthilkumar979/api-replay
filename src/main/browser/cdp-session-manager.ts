import type { Debugger, WebContents } from 'electron'

export type CdpEventHandler = (method: string, params: Record<string, unknown>) => void

export class CdpSessionManager {
  private attached = false
  private handler: CdpEventHandler | undefined
  private messageListener:
    | ((event: Electron.Event, method: string, params: unknown, sessionId: string) => void)
    | undefined

  constructor(private getContents: () => WebContents | undefined) {}

  get debugger(): Debugger | undefined {
    return this.getContents()?.debugger
  }

  async attach(): Promise<void> {
    const dbg = this.debugger
    if (!dbg) throw new Error('No browsing context to attach')
    if (this.attached && dbg.isAttached()) return

    if (!dbg.isAttached()) {
      try {
        dbg.attach('1.3')
      } catch (error) {
        if (!dbg.isAttached()) throw error
      }
    }
    this.attached = true
    this.bind(dbg)
    await dbg.sendCommand('Network.enable')
  }

  async send<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T> {
    const dbg = this.debugger
    if (!dbg?.isAttached()) throw new Error(`CDP is not attached for ${method}`)
    return dbg.sendCommand(method, params) as Promise<T>
  }

  onEvent(handler: CdpEventHandler): void {
    this.handler = handler
  }

  async detach(): Promise<void> {
    const dbg = this.debugger
    this.unbind(dbg)
    if (dbg?.isAttached()) {
      try {
        dbg.detach()
      } catch {
        // Already detached after a crash or navigation.
      }
    }
    this.attached = false
  }

  private bind(dbg: Debugger): void {
    this.unbind(dbg)
    this.messageListener = (_event, method, params) => {
      this.handler?.(method, (params ?? {}) as Record<string, unknown>)
    }
    dbg.on('message', this.messageListener)
    dbg.on('detach', () => {
      this.attached = false
    })
  }

  private unbind(dbg: Debugger | undefined): void {
    if (dbg && this.messageListener) dbg.removeListener('message', this.messageListener)
    this.messageListener = undefined
  }
}
