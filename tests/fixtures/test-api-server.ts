import http from 'node:http'
import { URL } from 'node:url'
import { fixturePage } from './fixture-page'
import { tryServeStatic } from './serve-static'

export interface TestApiServer {
  port: number
  origin: string
  server: http.Server
  getSideEffectCount: () => number
  reset: () => void
  close: () => Promise<void>
}

export interface TestApiServerOptions {
  staticDir?: string
}

const products = [
  { id: '1', name: 'Widget' },
  { id: '2', name: 'Gadget' }
]

export function startTestApiServer(port = 0, options: TestApiServerOptions = {}): Promise<TestApiServer> {
  let sideEffectCount = 0

  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', `http://127.0.0.1`)
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'content-type')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    if (url.pathname === '/api/search' && req.method === 'GET') {
      const query = url.searchParams.get('q') ?? ''
      const matches = products.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
      res.writeHead(200)
      res.end(JSON.stringify({ query, matches }))
      return
    }

    if (options.staticDir && req.method === 'GET' && tryServeStatic(options.staticDir, url.pathname, res)) {
      return
    }

    if (url.pathname === '/' && req.method === 'GET') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.writeHead(200)
      res.end(fixturePage())
      return
    }

    if (url.pathname === '/api/products' && req.method === 'GET') {
      res.writeHead(200)
      res.end(JSON.stringify(products))
      return
    }

    const productMatch = url.pathname.match(/^\/api\/products\/([^/]+)$/)
    if (productMatch && req.method === 'GET') {
      const found = products.find((item) => item.id === productMatch[1])
      if (!found) {
        res.writeHead(404)
        res.end(JSON.stringify({ error: 'Not found' }))
        return
      }
      res.writeHead(200)
      res.end(JSON.stringify(found))
      return
    }

    if (url.pathname === '/api/products' && req.method === 'POST') {
      readBody(req).then((body) => {
        res.writeHead(201)
        res.end(body || JSON.stringify({ created: true }))
      })
      return
    }

    if (url.pathname === '/api/failure' && req.method === 'GET') {
      res.writeHead(503)
      res.end(JSON.stringify({ error: 'Service Unavailable' }))
      return
    }

    if (url.pathname === '/api/empty' && req.method === 'GET') {
      res.writeHead(204)
      res.end()
      return
    }

    if (url.pathname === '/api/delay' && req.method === 'GET') {
      setTimeout(() => {
        res.writeHead(200)
        res.end(JSON.stringify({ delayed: true }))
      }, 250)
      return
    }

    if (url.pathname === '/api/side-effect' && req.method === 'POST') {
      sideEffectCount += 1
      res.writeHead(200)
      res.end(JSON.stringify({ count: sideEffectCount }))
      return
    }

    res.writeHead(404)
    res.end(JSON.stringify({ error: 'Not found' }))
  })

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      const address = server.address()
      const actualPort = typeof address === 'object' && address ? address.port : port
      resolve({
        port: actualPort,
        origin: `http://127.0.0.1:${actualPort}`,
        server,
        getSideEffectCount: () => sideEffectCount,
        reset: () => {
          sideEffectCount = 0
        },
        close: () =>
          new Promise((closeResolve, closeReject) => {
            server.close((error) => (error ? closeReject(error) : closeResolve()))
          })
      })
    })
  })
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(chunk as Buffer))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
  })
}

