import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { startTestApiServer } from '../tests/fixtures/test-api-server'

async function main(): Promise<void> {
  const dir = dirname(fileURLToPath(import.meta.url))
  const server = await startTestApiServer(4020, { staticDir: dir })
  console.log(`ApiReplay playground: ${server.origin}`)
}

void main()
