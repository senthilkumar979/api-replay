import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { startTestApiServer } from '../fixtures/test-api-server'

describe('fixture API server', () => {
  it('serves products, failures, empty bodies, and side effects', async () => {
    const server = await startTestApiServer()
    const json = async (path: string, init?: RequestInit) => {
      const response = await fetch(`${server.origin}${path}`, init)
      return { status: response.status, body: await response.text() }
    }

    expect((await json('/api/products')).status).toBe(200)
    expect((await json('/api/failure')).status).toBe(503)
    expect((await json('/api/empty')).status).toBe(204)
    expect((await json('/api/products', { method: 'POST', body: '{"name":"Nub"}' })).status).toBe(201)
    await json('/api/side-effect', { method: 'POST' })
    await json('/api/side-effect', { method: 'POST' })
    expect(server.getSideEffectCount()).toBe(2)
    const search = await json('/api/search?q=Gadget')
    expect(search.status).toBe(200)
    expect(search.body).toContain('Gadget')
    await server.close()
  })

  it('serves the playground when staticDir is set', async () => {
    const staticDir = join(dirname(fileURLToPath(import.meta.url)), '../../playground')
    const server = await startTestApiServer(0, { staticDir })
    const page = await fetch(server.origin)
    const css = await fetch(`${server.origin}/styles.css`)
    expect(page.headers.get('content-type')).toContain('text/html')
    expect(await page.text()).toContain('ApiReplay playground')
    expect(css.status).toBe(200)
    await server.close()
  })
})
