/**
 * Host loader entry for the Pastoral Cottage skin.
 *
 * Registers:
 *  - one exact route serving the wallpaper asset (client bundle references it
 *    by URL, so the bundle stays small);
 *  - the archive-management API under /api (unarchive / delete-session /
 *    archived list). DSH ships archiveSession but no unarchive or session
 *    delete, so the host half re-implements them against the workspace
 *    registry's own write path (enqueueOperation / requireState / setState —
 *    the same private surface archiveSession itself uses; TS privacy is
 *    compile-time only).
 */
import { readFile, unlink } from 'node:fs/promises'
import { basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
// Importing these types loads the cordis Context declaration-merges:
// webServer (dsh-host-webserver), workspaceRegistry (dsh-workspace),
// sessions (dsh-session), sessionPersistence (dsh-session-persistence).
import type { WebRoute } from '@deepseek-ai/dsh-host-webserver'
import type { WorkspaceRegistry } from '@deepseek-ai/dsh-workspace'
import type { SessionStore } from '@deepseek-ai/dsh-session'
import type { SessionPersistence } from '@deepseek-ai/dsh-session-persistence'
import type { SessionProjectionCache } from '@deepseek-ai/dsh-session-projection-cache'
import type { SessionTitleService } from '@deepseek-ai/dsh-session-title'

const BG_PATH = fileURLToPath(new URL('../assets/cottage-bg.jpg', import.meta.url))
const BG_ROUTE = '/plugins/@crack/dsh-client-ui-skin-cottage/bg.jpg'
const API_PREFIX = '/plugins/@crack/dsh-client-ui-skin-cottage/api'

/** Required services: the web route registry, the workspace registry, session persistence. */
const inject = ['webServer', 'workspaceRegistry', 'sessionPersistence', 'sessionProjectionCache', 'sessions', 'sessionTitle']

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const text = JSON.stringify(body)
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(text)
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += String(chunk)
      if (data.length > 1_000_000) {
        reject(Object.assign(new Error('request body too large'), { code: 413 }))
        req.destroy()
      }
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

/** Unarchive: remove the session id from the registry-global archive set. */
async function unarchive(ctx: Context, sessionId: string): Promise<void> {
  // Registry internals (private in TS, plain methods at runtime) — the exact
  // write path archiveSession() uses, mirrored in reverse.
  const registry = ctx.workspaceRegistry as unknown as {
    enqueueOperation: (op: () => Promise<void>) => Promise<void>
    requireState: () => { archivedSessionIds: string[] }
    setState: (state: unknown) => Promise<void>
  }
  await registry.enqueueOperation(async () => {
    const state = registry.requireState()
    if (!state.archivedSessionIds.includes(sessionId)) {
      throw Object.assign(new Error('session is not archived'), { code: 400 })
    }
    await registry.setState({
      ...state,
      archivedSessionIds: state.archivedSessionIds.filter((id) => id !== sessionId),
    })
  })
}

/**
 * Delete an archived (cold) session: remove its durable log artifact, refresh
 * the registry header index (workspace accounts filter through it), and drop
 * the archive-set entry. Live sessions are refused — killing a session in the
 * in-memory store would corrupt the event-sourced state.
 */
async function deleteSession(ctx: Context, sessionId: string): Promise<void> {
  const sessions = ctx.sessions as unknown as { get: (id: string) => unknown } | undefined
  if (sessions?.get?.(sessionId)) {
    throw Object.assign(new Error('session is live; stop it before deleting'), { code: 409 })
  }
  const persistence = ctx.sessionPersistence as unknown as {
    list: () => Promise<Array<{ id: unknown; cwd?: string; createdAt?: number }>>
    locate: (meta: unknown) => { path: string } | undefined
  }
  const headers = await persistence.list()
  const header = headers.find((h) => String(h.id) === sessionId)
  if (!header) throw Object.assign(new Error('no such session'), { code: 404 })
  const location = persistence.locate(header)
  if (!location) {
    throw Object.assign(new Error('persistence backend has no per-session artifact'), { code: 400 })
  }
  await unlink(location.path)
  // Refresh the registry's canonical-cwd header index so workspace accounts
  // (whose getters filter through it) stop listing the deleted session.
  const registry = ctx.workspaceRegistry as unknown as {
    indexHeaders: (headers: unknown[]) => Promise<void>
    enqueueOperation: (op: () => Promise<void>) => Promise<void>
    requireState: () => { archivedSessionIds: string[] }
    setState: (state: unknown) => Promise<void>
  }
  await registry.indexHeaders(await persistence.list())
  await registry.enqueueOperation(async () => {
    const state = registry.requireState()
    if (state.archivedSessionIds.includes(sessionId)) {
      await registry.setState({
        ...state,
        archivedSessionIds: state.archivedSessionIds.filter((id) => id !== sessionId),
      })
    }
  })
}


/** Rename a session by id. Live sessions use the official service; cold
 * (archived) sessions are restored through the public persistence path,
 * get a user session/title event appended, and their projection cache is
 * checkpointed so the native title read sees the new value. */
async function renameSession(ctx: Context, sessionId: string, rawTitle: string): Promise<{ title: string }> {
  const title = rawTitle.trim()
  if (title.length === 0) throw Object.assign(new Error('title must contain visible characters'), { code: 400 })
  if (title.length > 200) throw Object.assign(new Error('title too long'), { code: 400 })
  const sessions = ctx.sessions as unknown as {
    get: (id: string) => unknown
    prepare: (id?: string, options?: unknown) => {
      append: (type: string, data: unknown) => void
      events: readonly unknown[]
    }
  }
  const live = sessions.get(sessionId)
  if (live !== undefined) {
    const titleService = ctx.sessionTitle as unknown as { rename: (session: unknown, title: string) => unknown }
    const accepted = titleService.rename(live, title) as { title: string }
    return { title: accepted.title }
  }
  // Cold session: restore through the official persistence path.
  const persistence = ctx.sessionPersistence as unknown as {
    load: (id: string) => Promise<{ meta: unknown; events: readonly unknown[] }>
    append: (id: string, events: readonly unknown[]) => Promise<void>
  }
  const cache = ctx.sessionProjectionCache as unknown as { write: (session: unknown) => Promise<void> }
  const inspection = await persistence.load(sessionId)
  const session = sessions.prepare(sessionId, {
    seed: inspection.events,
    meta: inspection.meta,
    seedSource: 'persistence',
  })
  session.append('session/title', { title, messageSeqs: [], source: { kind: 'user' } })
  await persistence.append(sessionId, session.events.slice(inspection.events.length))
  await cache.write(session)
  return { title }
}

/**
 * Archived list grouped by owning workspace (registry display order; archived
 * sessions keep their workspace account slot, so unarchiving restores the
 * position). Sessions without a workspace land in "ungrouped". Display title
 * follows the native displayTitle fallback chain: durable title projection
 * (sessionTitle) → cwd basename → session id prefix.
 */
async function listArchived(ctx: Context): Promise<{
  groups: Array<{ workspaceId: string; title: string; sessions: ArchivedSession[] }>
  ungrouped: ArchivedSession[]
}> {
  const registry = ctx.workspaceRegistry as unknown as {
    archivedSessionIds: readonly string[]
    list: () => Array<{ id: string; title: string; sessionIds: readonly string[] }>
  }
  const persistence = ctx.sessionPersistence as unknown as {
    list: () => Promise<Array<{ id: unknown; cwd?: string; createdAt?: number }>>
  }
  const cache = ctx.sessionProjectionCache as unknown as {
    cachedSnapshot: (meta: unknown) => {
      values?: { title?: string | null; sessionListMetadata?: { lastPromptAt?: number | null } }
    } | undefined
  }
  const archived = registry.archivedSessionIds
  const headers = await persistence.list()
  const byId = new Map(headers.map((h) => [String(h.id), h]))
  const makeItem = (id: string): ArchivedSession => {
    const header = byId.get(id)
    const snapshot = header ? cache.cachedSnapshot(header)?.values : undefined
    const projected = snapshot?.title
    const cwd = header?.cwd
    const title =
      projected && projected.length > 0
        ? projected
        : cwd
          ? basename(String(cwd).replace(/[\\/]+$/, ''))
          : id.slice(0, 8)
    const updatedAt = snapshot?.sessionListMetadata?.lastPromptAt ?? header?.createdAt ?? null
    return { sessionId: id, title, createdAt: header?.createdAt ?? null, updatedAt }
  }
  const groups: Array<{ workspaceId: string; title: string; sessions: ArchivedSession[] }> = []
  const ungrouped: ArchivedSession[] = []
  const placed = new Set<string>()
  for (const workspace of registry.list()) {
    const sessions = workspace.sessionIds
      .filter((id) => archived.includes(id))
      .map(makeItem)
    if (sessions.length > 0) {
      groups.push({ workspaceId: workspace.id, title: workspace.title, sessions })
      for (const s of sessions) placed.add(s.sessionId)
    }
  }
  for (const id of archived) {
    if (!placed.has(id)) ungrouped.push(makeItem(id))
  }
  return { groups, ungrouped }
}

/** One archived session row (wire shape for /api/archived). */
interface ArchivedSession {
  sessionId: string
  title: string
  createdAt: number | null
  /** Last prompt time (activity) for the native 'updated' ordering; falls back to createdAt. */
  updatedAt: number | null
}

async function handleApi(ctx: Context, req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const method = req.method ?? 'GET'
  try {
    if (method === 'GET' && url.pathname === API_PREFIX + '/archived') {
      return sendJson(res, 200, await listArchived(ctx))
    }
    if (method === 'POST' && (url.pathname === API_PREFIX + '/unarchive' || url.pathname === API_PREFIX + '/delete-session')) {
      const body = JSON.parse((await readBody(req)) || '{}') as { sessionId?: unknown }
      const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
      if (!sessionId) return sendJson(res, 400, { error: 'sessionId (string) required' })
      if (url.pathname.endsWith('/unarchive')) {
        await unarchive(ctx, sessionId)
      } else {
        await deleteSession(ctx, sessionId)
      }
      return sendJson(res, 200, { ok: true })
    }
    if (method === 'POST' && url.pathname === API_PREFIX + '/rename-session') {
      const body = JSON.parse((await readBody(req)) || '{}') as { sessionId?: unknown; title?: unknown }
      const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
      const title = typeof body.title === 'string' ? body.title : ''
      if (!sessionId || !title) return sendJson(res, 400, { error: 'sessionId and title (strings) required' })
      const accepted = await renameSession(ctx, sessionId, title)
      return sendJson(res, 200, accepted)
    }
    sendJson(res, 404, { error: 'not found' })
  } catch (error) {
    const status = typeof (error as { code?: unknown })?.code === 'number' ? (error as { code: number }).code : 500
    ctx.logger.warn('cottage skin api:', error)
    sendJson(res, status, { error: error instanceof Error ? error.message : String(error) })
  }
}

function apply(ctx: Context) {
  ctx.effect(() => {
    const disposers = [
      ctx.webServer.register({
        kind: 'exact',
        path: BG_ROUTE,
        handler: async (_req, res) => {
          try {
            const body = await readFile(BG_PATH)
            res.writeHead(200, {
              'content-type': 'image/jpeg',
              'cache-control': 'public, max-age=86400',
            })
            res.end(body)
          } catch (error) {
            ctx.logger.warn('cottage skin: failed to serve wallpaper', error)
            res.writeHead(404)
            res.end()
          }
        },
      } satisfies WebRoute),
      ctx.webServer.register({
        kind: 'prefix',
        path: API_PREFIX,
        handler: (req, res) => handleApi(ctx, req, res),
      } satisfies WebRoute),
    ]
    return () => disposers.forEach((dispose) => dispose())
  }, 'ui-skin-cottage: wallpaper + archive api')
}

export { apply, inject }
