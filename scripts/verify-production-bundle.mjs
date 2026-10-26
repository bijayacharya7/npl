import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const assetDir = fileURLToPath(new URL('../dist/assets/', import.meta.url))
const files = readdirSync(assetDir).filter((name) => name.endsWith('.js'))
if (files.length === 0) throw new Error('No JavaScript assets found. Run the production build first.')
const bundle = files.map((name) => readFileSync(join(assetDir, name), 'utf8')).join('\n')

const forbidden = ['admin/admin', 'Incorrect admin ID or password.', "const ADMIN_PASSWORD='admin'"]
const leaked = forbidden.filter((value) => bundle.includes(value))
if (leaked.length) throw new Error(`Development-only credentials found in production assets: ${leaked.join(', ')}`)

console.log(`Production asset check passed (${files.length} JavaScript file${files.length === 1 ? '' : 's'}).`)
