import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { _electron as electron, type ElectronApplication, type Page } from '@playwright/test'
import electronPath from 'electron'

export async function launchApp(dbPath = joinTempDb()): Promise<{
  app: ElectronApplication
  page: Page
  dbPath: string
}> {
  const executable = typeof electronPath === 'string' ? electronPath : String(electronPath)
  const app = await electron.launch({
    executablePath: executable,
    args: [process.cwd()],
    cwd: process.cwd(),
    timeout: 30_000,
    env: {
      PATH: process.env.PATH ?? '',
      HOME: process.env.HOME ?? '',
      TMPDIR: process.env.TMPDIR ?? '',
      APIREPLAY_DB_PATH: dbPath
    }
  })
  const page = await app.firstWindow()
  return { app, page, dbPath }
}

export function joinTempDb(): string {
  return path.join(mkdtempSync(path.join(tmpdir(), 'apireplay-e2e-')), 'apireplay.sqlite')
}
