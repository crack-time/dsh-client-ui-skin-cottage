// Dev watch: recompile on every src/ change and rebuild the client bundle.
// Runs tsc (host + client) and tsdown in watch mode concurrently.
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = dirname(fileURLToPath(import.meta.url))
const bin = (name) => resolve(root, 'node_modules', '.bin', name + (process.platform === 'win32' ? '.cmd' : ''))

const procs = [
  { name: 'tsc host', cmd: bin('tsc'), args: ['-p', 'tsconfig.json', '--watch'] },
  { name: 'tsc client', cmd: bin('tsc'), args: ['-p', 'tsconfig.client.json', '--watch'] },
  { name: 'tsdown', cmd: bin('tsdown'), args: ['--watch'] },
]

for (const p of procs) {
  const child = spawn(p.cmd, p.args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' })
  child.on('error', (err) => console.error(`[${p.name}] failed to start: ${err.message}`))
  child.on('exit', (code) => console.error(`[${p.name}] exited with code ${code}`))
}

process.on('SIGINT', () => process.exit(0))
console.log('[dev] watching src/ — tsc + tsdown will rebuild on change')
