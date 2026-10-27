import { BrowserWindow, WebContentsView } from 'electron'
import { assertAllowedNavigationUrl, normalizeNavigationInput } from '../security/url-policy'

export interface BrowserBounds {
  x: number
  y: number
  width: number
  height: number
}

export class BrowserManager {
  private view: WebContentsView | undefined

  create(parent: BrowserWindow): WebContentsView {
    this.view = new WebContentsView({
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    })
    parent.contentView.addChildView(this.view)
    this.view.setBounds({ x: 0, y: 88, width: 1200, height: 280 })
    this.view.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
    return this.view
  }

  get contents() {
    return this.view?.webContents
  }

  setBounds(bounds: BrowserBounds): void {
    if (!this.view) return
    if (bounds.width < 1 || bounds.height < 1) return
    this.view.setBounds({
      x: Math.round(bounds.x),
      y: Math.round(bounds.y),
      width: Math.round(bounds.width),
      height: Math.round(bounds.height)
    })
  }

  async navigate(input: string, allowFile = false): Promise<string> {
    const normalized = normalizeNavigationInput(input)
    const url = assertAllowedNavigationUrl(normalized, allowFile)
    await this.contents?.loadURL(url.toString())
    return url.toString()
  }

  goBack(): void {
    if (this.contents?.navigationHistory.canGoBack()) this.contents.navigationHistory.goBack()
  }

  goForward(): void {
    if (this.contents?.navigationHistory.canGoForward()) this.contents.navigationHistory.goForward()
  }

  reload(): void {
    this.contents?.reload()
  }

  getUrl(): string {
    return this.contents?.getURL() ?? ''
  }

  canGoBack(): boolean {
    return this.contents?.navigationHistory.canGoBack() ?? false
  }

  canGoForward(): boolean {
    return this.contents?.navigationHistory.canGoForward() ?? false
  }
}
