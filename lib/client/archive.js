import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Archive view for the Pastoral Cottage skin.
 *
 * Mounted IN PLACE over the workspace tree region by src/client/index.ts.
 * Everything is reused from the native workspace browser:
 *  - the toolbar (incl. the view-options button) stays visible and live; the
 *    archive list mirrors its groupBy/orderBy state by polling the same
 *    persisted store key (dsh.workspace.view.v5)
 *  - rows show the native session title + time and a hover "⋯" menu
 *    (rename / restore / delete) mirroring the native rename/fork/archive menu
 * Data and mutations go through the host-half API (src/index.ts).
 */
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useState } from 'react';
const API = '/plugins/@crack/dsh-client-ui-skin-cottage/api';
const VIEW_KEY = 'dsh.workspace.view.v5';
/** Read the native workspace browser's persisted view state (same key the
 * view-options button writes). */
function readViewState() {
    try {
        const raw = localStorage.getItem(VIEW_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            return {
                groupBy: parsed.groupBy === 'flat' ? 'flat' : 'workspace',
                orderBy: parsed.orderBy === 'manual' ? 'manual' : 'updated',
            };
        }
    }
    catch {
        // ignore
    }
    return { groupBy: 'workspace', orderBy: 'updated' };
}
async function getArchived() {
    const res = await fetch(API + '/archived');
    if (!res.ok)
        throw new Error('加载归档列表失败');
    const data = (await res.json());
    return { groups: data.groups ?? [], ungrouped: data.ungrouped ?? [] };
}
async function postAction(action, sessionId) {
    const res = await fetch(API + '/' + action, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId }),
    });
    if (!res.ok) {
        const data = (await res.json().catch(() => null));
        throw new Error(data?.error ?? '操作失败');
    }
}
async function renameSession(sessionId, title) {
    const res = await fetch(API + '/rename-session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId, title }),
    });
    if (!res.ok) {
        const data = (await res.json().catch(() => null));
        throw new Error(data?.error ?? '重命名失败');
    }
}
function formatTime(ms) {
    if (ms === null || ms === undefined)
        return '';
    const d = new Date(ms);
    if (Number.isNaN(d.getTime()))
        return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function ContextMenu({ x, y, items, onPick, onClose, }) {
    return createPortal(_jsxs(_Fragment, { children: [_jsx("div", { className: "cottage-menu-mask", onClick: onClose, onContextMenu: (e) => { e.preventDefault(); onClose(); } }), _jsx("div", { className: "cottage-menu", style: { left: x, top: y }, role: "menu", children: items.map((item) => (_jsx("button", { type: "button", role: "menuitem", className: item.danger ? 'danger' : '', onClick: () => onPick(item.id), children: item.label }, item.id))) })] }), document.body);
}
function SessionRow({ item, busy, menuOpen, onMenuOpen, onRename, onUnarchive, onDelete, }) {
    return (_jsxs("div", { className: 'cottage-archive-item' + (menuOpen ? ' menu-open' : ''), children: [_jsxs("div", { className: "cottage-archive-meta", children: [_jsx("span", { className: "cottage-archive-label", title: item.title, children: item.title }), _jsx("span", { className: "cottage-archive-time", children: formatTime(item.createdAt) })] }), _jsx("button", { type: "button", className: "cottage-archive-more", "aria-label": "\u4F1A\u8BDD\u64CD\u4F5C", disabled: busy === item.sessionId, onClick: (e) => {
                    e.stopPropagation();
                    onMenuOpen(e);
                }, children: "\u22EF" })] }));
}
export function ArchiveView({ onClose }) {
    const [data, setData] = useState({ groups: [], ungrouped: [] });
    const [busy, setBusy] = useState(null);
    const [error, setError] = useState(null);
    const [view, setView] = useState(readViewState);
    const [menu, setMenu] = useState(null);
    // Mirror the native view-options button: poll the shared persisted store key.
    useEffect(() => {
        const timer = window.setInterval(() => {
            const next = readViewState();
            setView((prev) => (prev.groupBy === next.groupBy && prev.orderBy === next.orderBy ? prev : next));
        }, 400);
        return () => window.clearInterval(timer);
    }, []);
    const refresh = useCallback(async () => {
        try {
            setData(await getArchived());
            setError(null);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    }, []);
    useEffect(() => {
        void refresh();
    }, [refresh]);
    const act = async (action, item) => {
        setBusy(item.sessionId);
        setError(null);
        try {
            await postAction(action, item.sessionId);
            setMenu(null);
            await refresh();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
        finally {
            setBusy(null);
        }
    };
    const handleRename = (item) => {
        setMenu(null);
        const title = window.prompt('重命名会话', item.title);
        if (title === null)
            return;
        const trimmed = title.trim();
        if (!trimmed)
            return;
        void (async () => {
            setBusy(item.sessionId);
            setError(null);
            try {
                await renameSession(item.sessionId, trimmed);
                await refresh();
            }
            catch (e) {
                setError(e instanceof Error ? e.message : String(e));
            }
            finally {
                setBusy(null);
            }
        })();
    };
    const handleDelete = (item) => {
        setMenu(null);
        if (!window.confirm(`删除会话「${item.title}」？\n会话日志将被移除，此操作不可恢复。`))
            return;
        void act('delete-session', item);
    };
    const sortSessions = (sessions) => view.orderBy === 'updated'
        ? [...sessions].sort((a, b) => (b.updatedAt ?? b.createdAt ?? 0) - (a.updatedAt ?? a.createdAt ?? 0))
        : sessions;
    const total = data.groups.reduce((n, g) => n + g.sessions.length, 0) + data.ungrouped.length;
    const flat = view.groupBy === 'flat'
        ? sortSessions([...data.groups.flatMap((g) => g.sessions), ...data.ungrouped])
        : null;
    const openMenu = (e, item) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMenu({ item, x: Math.max(8, Math.min(rect.right - 140, window.innerWidth - 148)), y: rect.bottom + 4 });
    };
    const onMenuPick = (id) => {
        if (!menu)
            return;
        if (id === 'rename')
            handleRename(menu.item);
        else if (id === 'unarchive')
            void act('unarchive', menu.item);
        else if (id === 'delete')
            handleDelete(menu.item);
    };
    return (_jsxs("div", { className: "cottage-archive", onClick: (e) => e.stopPropagation(), onKeyDown: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "cottage-archive-head", children: [_jsx("button", { type: "button", className: "cottage-archive-back", onClick: onClose, children: "\u2190 \u8FD4\u56DE" }), _jsxs("span", { className: "cottage-archive-title", children: ["\uD83D\uDCE6 \u5F52\u6863\u4F1A\u8BDD (", total, ")"] }), _jsxs("span", { className: "cottage-archive-viewmode", children: [view.groupBy === 'flat' ? '平铺' : '按工作区', " \u00B7 ", view.orderBy === 'manual' ? '手动' : '按时间'] })] }), error && _jsx("div", { className: "cottage-archive-error", children: error }), _jsxs("div", { className: "cottage-archive-list", children: [total === 0 && _jsx("div", { className: "cottage-archive-empty", children: "\u6682\u65E0\u5F52\u6863\u4F1A\u8BDD" }), flat !== null &&
                        flat.map((item) => (_jsx(SessionRow, { item: item, busy: busy, menuOpen: menu?.item.sessionId === item.sessionId, onMenuOpen: (e) => openMenu(e, item), onRename: handleRename, onUnarchive: (it) => void act('unarchive', it), onDelete: handleDelete }, item.sessionId))), flat === null &&
                        data.groups.map((group) => (_jsxs("div", { className: "cottage-archive-group", children: [_jsx("div", { className: "cottage-archive-group-title", children: group.title }), sortSessions(group.sessions).map((item) => (_jsx(SessionRow, { item: item, busy: busy, menuOpen: menu?.item.sessionId === item.sessionId, onMenuOpen: (e) => openMenu(e, item), onRename: handleRename, onUnarchive: (it) => void act('unarchive', it), onDelete: handleDelete }, item.sessionId)))] }, group.workspaceId))), flat === null &&
                        data.ungrouped.length > 0 && (_jsxs("div", { className: "cottage-archive-group", children: [_jsx("div", { className: "cottage-archive-group-title", children: "\u672A\u5206\u7EC4" }), sortSessions(data.ungrouped).map((item) => (_jsx(SessionRow, { item: item, busy: busy, menuOpen: menu?.item.sessionId === item.sessionId, onMenuOpen: (e) => openMenu(e, item), onRename: handleRename, onUnarchive: (it) => void act('unarchive', it), onDelete: handleDelete }, item.sessionId)))] }))] }), menu && (_jsx(ContextMenu, { x: menu.x, y: menu.y, items: [
                    { id: 'rename', label: '重命名' },
                    { id: 'unarchive', label: '还原会话' },
                    { id: 'delete', label: '删除会话', danger: true },
                ], onPick: onMenuPick, onClose: () => setMenu(null) }))] }));
}
