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
import { readFile, unlink } from 'node:fs/promises';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
const BG_PATH = fileURLToPath(new URL('../assets/cottage-bg.jpg', import.meta.url));
const BG_ROUTE = '/plugins/@crack/dsh-client-ui-skin-cottage/bg.jpg';
const API_PREFIX = '/plugins/@crack/dsh-client-ui-skin-cottage/api';
/** Required services: the web route registry, the workspace registry, session persistence. */
const inject = ['webServer', 'workspaceRegistry', 'sessionPersistence', 'sessionProjectionCache', 'sessions', 'sessionTitle'];
function sendJson(res, status, body) {
    const text = JSON.stringify(body);
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
    res.end(text);
}
function readBody(req) {
    return new Promise((resolve, reject) => {
        let data = '';
        req.on('data', (chunk) => {
            data += String(chunk);
            if (data.length > 1000000) {
                reject(Object.assign(new Error('request body too large'), { code: 413 }));
                req.destroy();
            }
        });
        req.on('end', () => resolve(data));
        req.on('error', reject);
    });
}
/** Unarchive: remove the session id from the registry-global archive set. */
async function unarchive(ctx, sessionId) {
    // Registry internals (private in TS, plain methods at runtime) — the exact
    // write path archiveSession() uses, mirrored in reverse.
    const registry = ctx.workspaceRegistry;
    await registry.enqueueOperation(async () => {
        const state = registry.requireState();
        if (!state.archivedSessionIds.includes(sessionId)) {
            throw Object.assign(new Error('session is not archived'), { code: 400 });
        }
        await registry.setState({
            ...state,
            archivedSessionIds: state.archivedSessionIds.filter((id) => id !== sessionId),
        });
    });
}
/**
 * Delete an archived (cold) session: remove its durable log artifact, refresh
 * the registry header index (workspace accounts filter through it), and drop
 * the archive-set entry. Live sessions are refused — killing a session in the
 * in-memory store would corrupt the event-sourced state.
 */
async function deleteSession(ctx, sessionId) {
    const sessions = ctx.sessions;
    if (sessions?.get?.(sessionId)) {
        throw Object.assign(new Error('session is live; stop it before deleting'), { code: 409 });
    }
    const persistence = ctx.sessionPersistence;
    const headers = await persistence.list();
    const header = headers.find((h) => String(h.id) === sessionId);
    if (!header)
        throw Object.assign(new Error('no such session'), { code: 404 });
    const location = persistence.locate(header);
    if (!location) {
        throw Object.assign(new Error('persistence backend has no per-session artifact'), { code: 400 });
    }
    await unlink(location.path);
    // Refresh the registry's canonical-cwd header index so workspace accounts
    // (whose getters filter through it) stop listing the deleted session.
    const registry = ctx.workspaceRegistry;
    await registry.indexHeaders(await persistence.list());
    await registry.enqueueOperation(async () => {
        const state = registry.requireState();
        if (state.archivedSessionIds.includes(sessionId)) {
            await registry.setState({
                ...state,
                archivedSessionIds: state.archivedSessionIds.filter((id) => id !== sessionId),
            });
        }
    });
}
/** Rename a session by id. Live sessions use the official service; cold
 * (archived) sessions are restored through the public persistence path,
 * get a user session/title event appended, and their projection cache is
 * checkpointed so the native title read sees the new value. */
async function renameSession(ctx, sessionId, rawTitle) {
    const title = rawTitle.trim();
    if (title.length === 0)
        throw Object.assign(new Error('title must contain visible characters'), { code: 400 });
    if (title.length > 200)
        throw Object.assign(new Error('title too long'), { code: 400 });
    const sessions = ctx.sessions;
    const live = sessions.get(sessionId);
    if (live !== undefined) {
        const titleService = ctx.sessionTitle;
        const accepted = titleService.rename(live, title);
        return { title: accepted.title };
    }
    // Cold session: restore through the official persistence path.
    const persistence = ctx.sessionPersistence;
    const cache = ctx.sessionProjectionCache;
    const inspection = await persistence.load(sessionId);
    const session = sessions.prepare(sessionId, {
        seed: inspection.events,
        meta: inspection.meta,
        seedSource: 'persistence',
    });
    session.append('session/title', { title, messageSeqs: [], source: { kind: 'user' } });
    await persistence.append(sessionId, session.events.slice(inspection.events.length));
    await cache.write(session);
    return { title };
}
/**
 * Archived list grouped by owning workspace (registry display order; archived
 * sessions keep their workspace account slot, so unarchiving restores the
 * position). Sessions without a workspace land in "ungrouped". Display title
 * follows the native displayTitle fallback chain: durable title projection
 * (sessionTitle) → cwd basename → session id prefix.
 */
async function listArchived(ctx) {
    const registry = ctx.workspaceRegistry;
    const persistence = ctx.sessionPersistence;
    const cache = ctx.sessionProjectionCache;
    const archived = registry.archivedSessionIds;
    const headers = await persistence.list();
    const byId = new Map(headers.map((h) => [String(h.id), h]));
    const makeItem = (id) => {
        const header = byId.get(id);
        const snapshot = header ? cache.cachedSnapshot(header)?.values : undefined;
        const projected = snapshot?.title;
        const cwd = header?.cwd;
        const title = projected && projected.length > 0
            ? projected
            : cwd
                ? basename(String(cwd).replace(/[\\/]+$/, ''))
                : id.slice(0, 8);
        const updatedAt = snapshot?.sessionListMetadata?.lastPromptAt ?? header?.createdAt ?? null;
        return { sessionId: id, title, createdAt: header?.createdAt ?? null, updatedAt };
    };
    const groups = [];
    const ungrouped = [];
    const placed = new Set();
    for (const workspace of registry.list()) {
        const sessions = workspace.sessionIds
            .filter((id) => archived.includes(id))
            .map(makeItem);
        if (sessions.length > 0) {
            groups.push({ workspaceId: workspace.id, title: workspace.title, sessions });
            for (const s of sessions)
                placed.add(s.sessionId);
        }
    }
    for (const id of archived) {
        if (!placed.has(id))
            ungrouped.push(makeItem(id));
    }
    return { groups, ungrouped };
}
async function handleApi(ctx, req, res) {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const method = req.method ?? 'GET';
    try {
        if (method === 'GET' && url.pathname === API_PREFIX + '/archived') {
            return sendJson(res, 200, await listArchived(ctx));
        }
        if (method === 'POST' && (url.pathname === API_PREFIX + '/unarchive' || url.pathname === API_PREFIX + '/delete-session')) {
            const body = JSON.parse((await readBody(req)) || '{}');
            const sessionId = typeof body.sessionId === 'string' ? body.sessionId : '';
            if (!sessionId)
                return sendJson(res, 400, { error: 'sessionId (string) required' });
            if (url.pathname.endsWith('/unarchive')) {
                await unarchive(ctx, sessionId);
            }
            else {
                await deleteSession(ctx, sessionId);
            }
            return sendJson(res, 200, { ok: true });
        }
        if (method === 'POST' && url.pathname === API_PREFIX + '/rename-session') {
            const body = JSON.parse((await readBody(req)) || '{}');
            const sessionId = typeof body.sessionId === 'string' ? body.sessionId : '';
            const title = typeof body.title === 'string' ? body.title : '';
            if (!sessionId || !title)
                return sendJson(res, 400, { error: 'sessionId and title (strings) required' });
            const accepted = await renameSession(ctx, sessionId, title);
            return sendJson(res, 200, accepted);
        }
        sendJson(res, 404, { error: 'not found' });
    }
    catch (error) {
        const status = typeof error?.code === 'number' ? error.code : 500;
        ctx.logger.warn('cottage skin api:', error);
        sendJson(res, status, { error: error instanceof Error ? error.message : String(error) });
    }
}
function apply(ctx) {
    ctx.effect(() => {
        const disposers = [
            ctx.webServer.register({
                kind: 'exact',
                path: BG_ROUTE,
                handler: async (_req, res) => {
                    try {
                        const body = await readFile(BG_PATH);
                        res.writeHead(200, {
                            'content-type': 'image/jpeg',
                            'cache-control': 'public, max-age=86400',
                        });
                        res.end(body);
                    }
                    catch (error) {
                        ctx.logger.warn('cottage skin: failed to serve wallpaper', error);
                        res.writeHead(404);
                        res.end();
                    }
                },
            }),
            ctx.webServer.register({
                kind: 'prefix',
                path: API_PREFIX,
                handler: (req, res) => handleApi(ctx, req, res),
            }),
        ];
        return () => disposers.forEach((dispose) => dispose());
    }, 'ui-skin-cottage: wallpaper + archive api');
}
export { apply, inject };
