import { expect, test } from '@playwright/test'
import { startTestApiServer } from '../fixtures/test-api-server'
import { launchApp } from './helpers'

test('saves an API, mocks it, and does not hit the side-effect endpoint', async () => {
  test.setTimeout(120_000)
  const server = await startTestApiServer()
  const { app, page } = await launchApp()

  await page.getByTestId('address-bar').fill(server.origin)
  await page.getByTestId('navigate').click()
  await page.getByTestId('type-filter').selectOption('Fetch')
  const row = page.getByTestId('capture-row-/api/products')
  await expect(row).toBeVisible({ timeout: 30_000 })
  await row.click()
  await page.getByTestId('save-api').click()
  await page.getByTestId('confirm-save-api').click()
  await expect(page.getByTestId('saved-badge')).toBeVisible()

  await page.getByRole('tab', { name: 'mock rule' }).click()
  await page.getByLabel('Enabled').check()
  await page.getByLabel('Status').fill('503')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await page.getByTestId('mock-toggle').click()
  await page.getByTestId('reload').click()
  await expect(row).toContainText('mocked', { timeout: 30_000 })

  await app.close()
  await server.close()
})
