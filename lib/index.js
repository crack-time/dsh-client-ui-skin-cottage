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
import { readFile, readdir, unlink } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import z from '@deepseek-ai/schemastery';
import { settingsNamespace } from '@deepseek-ai/dsh-settings';
const BG_PATH = fileURLToPath(new URL('../assets/bg.jpg', import.meta.url));
const BG_ROUTE = '/plugins/@crack/dsh-web-ui-skin/bg.jpg';
const API_PREFIX = '/plugins/@crack/dsh-web-ui-skin/api';
/**
 * Settings card for this skin (surfaced by dsh rc.7's settings page under
 * the "skin" namespace; changes apply live, no restart needed):
 *  - wallpaperUrl: custom wallpaper over the bundled asset (empty = asset);
 *  - glassOpacity: frosted-glass strength of the translucent panels
 *    (client maps it onto the `--skin-glass` token family);
 *  - archiveButton: show/hide the sidebar archive entry.
 */
const SKIN_SETTINGS_SCHEMA = z.object({
    wallpaperUrl: z.string().default(''),
    glassOpacity: z.number().min(0).max(1).default(0.48),
    archiveButton: z.boolean().default(true),
});
/** Required services: the web route registry, the workspace registry, session persistence. */
const inject = ['webServer', 'workspaceRegistry', 'sessionPersistence', 'sessionProjectionCache', 'sessions', 'sessionTitle', 'settings'];
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
 * Delete an archived session. Three cases:
 *  - cold session: remove its durable log artifact, refresh the registry
 *    header index, and drop the archive-set entry;
 *  - live session (opened for browsing): remove it from the in-memory store
 *    (no public dispose API — the enter() disposer is unreachable), then the
 *    cold path. Only archived sessions reach this API, and archiving implies
 *    quiescent work; deleting a genuinely running session is unsupported.
 *  - orphan entry (no persisted header/log): just drop the archive-set entry.
 *
 * After removal a `session/disposed` emit tells the api-proxy to forward
 * `host/session-removed`, so the browser session list drops the row
 * immediately (no stale row until reload). Cold sessions get a detached
 * instance (all listeners guard on live state or only read the id).
 */
async function deleteSession(ctx, sessionId) {
    const sessions = ctx.sessions;
    const persistence = ctx.sessionPersistence;
    let notify = null;
    const live = sessions.get(sessionId);
    if (live !== undefined) {
        // No public dispose: remove the store entry directly (the enter()
        // disposer does exactly this plus unhooking append publication).
        sessions.store?.delete(sessionId);
        notify = live;
    }
    const headers = await persistence.list();
    const header = headers.find((h) => String(h.id) === sessionId);
    if (header) {
        const location = persistence.locate(header);
        if (!location) {
            throw Object.assign(new Error('persistence backend has no per-session artifact'), { code: 400 });
        }
        if (notify === null) {
            // Cold session: build a detached instance purely as the notification
            // carrier (listeners guard on live state or read only the id).
            try {
                const inspection = await persistence.load(sessionId);
                notify = sessions.prepare(sessionId, {
                    seed: inspection.events,
                    meta: inspection.meta,
                    seedSource: 'persistence',
                });
            }
            catch {
                notify = null;
            }
        }
        await unlink(location.path);
    }
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
    if (notify !== null) {
        try {
            ;
            ctx.emit('session/disposed', notify);
        }
        catch { }
    }
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
 * File listing for the '@' mention menu: one directory level of a session's
 * working directory (or the host home when the session has no cwd). The
 * client passes a RELATIVE directory (its navigation state), never an
 * absolute path; this half resolves it against the session cwd and answers
 * with relative paths only, so the browser never needs host paths.
 */
const MENTION_MAX_ENTRIES = 500;
/** Recursive fuzzy search bounds: depth cap and result cap keep huge trees sane. */
const MENTION_SEARCH_DEPTH = 6;
const MENTION_SEARCH_MAX = 60;
/** Directory names never descended into during the '@' search. */
const MENTION_SKIP = new Set(['node_modules', '.git', '.svn', '.hg', '.idea', '.vscode', '.next', 'dist', 'build', '.dsh']);
/**
 * Recursive name search under cwd: returns entries (files and directories)
 * whose base name contains the query, as full relative paths (directories
 * carry a trailing '/'). Shallow matches surface first (the walk matches
 * each level before descending). Caps: depth 6, 60 results.
 */
async function searchMentionFiles(cwd, query) {
    const needle = query.toLowerCase();
    const out = [];
    const walk = async (rel, depth) => {
        if (out.length >= MENTION_SEARCH_MAX || depth > MENTION_SEARCH_DEPTH)
            return;
        const absolute = resolve(cwd, rel || '.');
        let entries;
        try {
            entries = await readdir(absolute, { withFileTypes: true });
        }
        catch {
            return;
        }
        // Match this level before descending (shallow results come first).
        for (const e of entries) {
            if (e.name.startsWith('.') || MENTION_SKIP.has(e.name))
                continue;
            if (e.name.toLowerCase().includes(needle)) {
                const path = rel ? rel.replace(/[\\/]+$/g, '') + '/' + e.name : e.name;
                out.push({ name: e.name, path: e.isDirectory() ? path + '/' : path, isDirectory: e.isDirectory() });
                if (out.length >= MENTION_SEARCH_MAX)
                    return;
            }
        }
        for (const e of entries) {
            if (!e.isDirectory() || e.name.startsWith('.') || MENTION_SKIP.has(e.name))
                continue;
            await walk(rel ? rel + '/' + e.name : e.name, depth + 1);
            if (out.length >= MENTION_SEARCH_MAX)
                return;
        }
    };
    await walk('', 0);
    return out;
}
async function listMentionFiles(ctx, sessionId, rel, query) {
    const persistence = ctx.sessionPersistence;
    let cwd;
    if (sessionId) {
        const headers = await persistence.list();
        // Tolerate both 'session-<uuid>' and bare '<uuid>' spellings.
        const plain = sessionId.replace(/^session-/, '');
        const header = headers.find((h) => {
            const id = String(h.id);
            return id === sessionId || id === 'session-' + plain || id.replace(/^session-/, '') === plain;
        });
        cwd = header?.cwd;
    }
    const base = cwd ?? homedir();
    // Search mode: no directory prefix and a non-empty query — fuzzy-recursive
    // name search across the whole cwd (opencode-style '@ass' finds assets/).
    if (!rel && query) {
        const entries = await searchMentionFiles(base, query);
        return {
            cwd: cwd ?? null,
            dir: '',
            entries,
            truncated: entries.length >= MENTION_SEARCH_MAX,
        };
    }
    const absolute = resolve(base, rel || '.');
    const entries = await readdir(absolute, { withFileTypes: true });
    const rows = entries
        .filter((e) => !e.name.startsWith('.'))
        .map((e) => ({
        name: e.name,
        // Full relative path from the session cwd (client inserts this verbatim)
        path: rel ? rel.replace(/[\\/]+$/g, '') + '/' + e.name : e.name,
        isDirectory: e.isDirectory(),
    }));
    const dirs = rows.filter((e) => e.isDirectory).sort((a, b) => a.name.localeCompare(b.name));
    const files = rows.filter((e) => !e.isDirectory).sort((a, b) => a.name.localeCompare(b.name));
    const ordered = [...dirs, ...files];
    return {
        cwd: cwd ?? null,
        dir: rel,
        entries: ordered.slice(0, MENTION_MAX_ENTRIES),
        truncated: ordered.length > MENTION_MAX_ENTRIES,
    };
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
async function handleApi(ctx, settings, req, res) {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const method = req.method ?? 'GET';
    try {
        if (method === 'GET' && url.pathname === API_PREFIX + '/config') {
            // Current resolved skin settings (schema defaults + user layer). The
            // client re-fetches on the `settings/document-updated` wire event, so
            // card edits apply live without a page reload.
            return sendJson(res, 200, settings.get());
        }
        if (method === 'POST' && url.pathname === API_PREFIX + '/config') {
            // The settings card's write path: a JSON patch over the "skin"
            // namespace user layer. Goes through ctx.settings.update so the schema
            // validates it, the revision bumps, and `settings/document-updated`
            // fans out to every browser half (card + skin) for a live apply.
            const body = JSON.parse((await readBody(req)) || '{}');
            if (!body.patch || typeof body.patch !== 'object' || Array.isArray(body.patch)) {
                return sendJson(res, 400, { error: 'patch (object) required' });
            }
            await settings.update(body.patch);
            return sendJson(res, 200, settings.get());
        }
        if (method === 'GET' && url.pathname === API_PREFIX + '/archived') {
            return sendJson(res, 200, await listArchived(ctx));
        }
        if (method === 'GET' && url.pathname === API_PREFIX + '/mention/files') {
            const sessionId = typeof url.searchParams.get('sessionId') === 'string' ? url.searchParams.get('sessionId') : undefined;
            const dir = url.searchParams.get('dir') ?? '';
            const q = url.searchParams.get('q') ?? '';
            try {
                return sendJson(res, 200, await listMentionFiles(ctx, sessionId, dir, q));
            }
            catch (error) {
                ctx.logger.warn('skin: mention files list failed', error);
                return sendJson(res, 200, {
                    cwd: null,
                    dir,
                    entries: [],
                    truncated: false,
                    error: 'directory-unreadable',
                });
            }
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
        ctx.logger.warn('skin api:', error);
        sendJson(res, status, { error: error instanceof Error ? error.message : String(error) });
    }
}
function apply(ctx) {
    // Register the "skin" settings namespace: dsh rc.7 renders it as a
    // settings card automatically (schemastery schema → form). `applies: 'live'`
    // means card edits reach the client immediately via document-updated.
    const settings = ctx.settings.register(settingsNamespace('skin'), SKIN_SETTINGS_SCHEMA, { applies: 'live' });
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
                        ctx.logger.warn('skin: failed to serve wallpaper', error);
                        res.writeHead(404);
                        res.end();
                    }
                },
            }),
            ctx.webServer.register({
                kind: 'prefix',
                path: API_PREFIX,
                handler: (req, res) => handleApi(ctx, settings, req, res),
            }),
        ];
        return () => disposers.forEach((dispose) => dispose());
    }, 'dsh-web-ui-skin: wallpaper + archive api');
}
export { apply, inject };
