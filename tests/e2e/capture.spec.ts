import { expect, test } from '@playwright/test'
import { startTestApiServer } from '../fixtures/test-api-server'
import { launchApp } from './helpers'

test.describe('Electron capture', () => {
  test('records a local API call in the live list', async () => {
    const server = await startTestApiServer()
    const { app, page } = await launchApp()

    await page.getByTestId('address-bar').fill(server.origin)
    await page.getByTestId('navigate').click()
    await page.getByTestId('type-filter').selectOption('Fetch')
    await expect(page.getByTestId('current-url')).toContainText(server.origin, { timeout: 15_000 })
    await expect(page.getByTestId('capture-row-/api/products')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId('capture-row-/api/products')).toContainText('GET')

    await app.close()
    await server.close()
  })
})
