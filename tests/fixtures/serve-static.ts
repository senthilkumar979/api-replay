import { existsSync, readFileSync, statSync } from 'node:fs'
import { extname, resolve } from 'node:path'
import type http from 'node:http'

const MIME: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
}

export function tryServeStatic(
  root: string,
  pathname: string,
  res: http.ServerResponse
): boolean {
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '')
  const filePath = resolve(root, relative)
  if (!filePath.startsWith(resolve(root))) return false
  if (!existsSync(filePath) || !statSync(filePath).isFile()) return false
  res.setHeader('Content-Type', MIME[extname(filePath)] ?? 'application/octet-stream')
  res.writeHead(200)
  res.end(readFileSync(filePath))
  return true
}
