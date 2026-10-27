import { startTestApiServer } from './test-api-server'

async function main(): Promise<void> {
  const server = await startTestApiServer(4010)
  console.log(`Fixture API listening on ${server.origin}`)
}

void main()
