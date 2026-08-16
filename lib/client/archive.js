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
/** Read the native workspace browser's persisted view state (the exact
 * store the view-options button and group headers write). */
function readViewState() {
    try {
        const raw = localStorage.getItem(VIEW_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            return {
                groupBy: parsed.groupBy === 'flat' ? 'flat' : 'workspace',
                orderBy: parsed.orderBy === 'manual' ? 'manual' : 'updated',
                groupExpansion: parsed.groupExpansion && typeof parsed.groupExpansion === 'object'
                    ? parsed.groupExpansion
                    : {},
            };
        }
    }
    catch {
        // ignore
    }
    return { groupBy: 'workspace', orderBy: 'updated', groupExpansion: {} };
}
/** Persist a group-expansion change into the shared native store key. */
function writeGroupExpansion(key, expanded) {
    try {
        const state = readViewState();
        const next = { ...state.groupExpansion, [key]: expanded };
        localStorage.setItem(VIEW_KEY, JSON.stringify({ ...state, groupExpansion: next }));
    }
    catch {
        // ignore
    }
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
/** Relative time label mirroring the native row time (now/minutes/hours/days). */
function timeAgo(ms) {
    if (ms === null || ms === undefined)
        return '';
    const diff = Date.now() - ms;
    if (diff < 60000)
        return '刚刚';
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60)
        return `${minutes} 分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)
        return `${hours} 小时前`;
    const days = Math.floor(hours / 24);
    return `${days} 天前`;
}
function ContextMenu({ x, y, items, onPick, onClose, }) {
    return createPortal(_jsxs(_Fragment, { children: [_jsx("div", { className: "cottage-menu-mask", onClick: onClose, onContextMenu: (e) => { e.preventDefault(); onClose(); } }), _jsx("div", { className: "cottage-menu", style: { left: x, top: y }, role: "menu", children: items.map((item) => (_jsx("button", { type: "button", role: "menuitem", className: item.danger ? 'danger' : '', onClick: () => onPick(item.id), children: item.label }, item.id))) })] }), document.body);
}
function SessionRow({ item, busy, menuOpen, onMenuOpen, onOpen, }) {
    return (_jsxs("div", { className: 'cottage-archive-item' + (menuOpen ? ' menu-open' : ''), role: "treeitem", "aria-selected": false, onClick: () => onOpen(item.sessionId), children: [_jsxs("div", { className: "cottage-archive-meta", children: [_jsx("span", { className: "cottage-archive-label", title: item.title, children: item.title }), _jsx("span", { className: "cottage-archive-time", children: timeAgo(item.updatedAt ?? item.createdAt) })] }), _jsx("button", { type: "button", className: "cottage-archive-more", "aria-label": "\u4F1A\u8BDD\u64CD\u4F5C", disabled: busy === item.sessionId, onClick: (e) => {
                    e.stopPropagation();
                    onMenuOpen(e);
                }, children: "\u22EF" })] }));
}
export function ArchiveView({ onClose, onOpenSession, }) {
    const [data, setData] = useState({ groups: [], ungrouped: [] });
    const [busy, setBusy] = useState(null);
    const [error, setError] = useState(null);
    const [view, setView] = useState(readViewState);
    const [menu, setMenu] = useState(null);
    const [expanded, setExpanded] = useState(() => readViewState().groupExpansion);
    // Mirror the native view-options button: poll the shared persisted store key.
    useEffect(() => {
        const timer = window.setInterval(() => {
            const next = readViewState();
            setView((prev) => prev.groupBy === next.groupBy && prev.orderBy === next.orderBy ? prev : next);
            setExpanded((prev) => {
                for (const key of Object.keys(next.groupExpansion)) {
                    if (prev[key] !== next.groupExpansion[key])
                        return { ...next.groupExpansion };
                }
                return prev;
            });
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
                        flat.map((item) => (_jsx(SessionRow, { item: item, busy: busy, menuOpen: menu?.item.sessionId === item.sessionId, onMenuOpen: (e) => openMenu(e, item), onOpen: onOpenSession ?? (() => undefined) }, item.sessionId))), flat === null &&
                        data.groups.map((group) => {
                            const isExpanded = expanded[group.workspaceId] !== false;
                            return (_jsxs("div", { className: "cottage-archive-group", children: [_jsxs("div", { className: "cottage-archive-group-title", role: "treeitem", "aria-expanded": isExpanded, onClick: () => {
                                            const next = !isExpanded;
                                            setExpanded((prev) => ({ ...prev, [group.workspaceId]: next }));
                                            writeGroupExpansion(group.workspaceId, next);
                                        }, children: [_jsx("span", { className: "cottage-archive-folder", children: isExpanded ? '📂' : '📁' }), _jsx("span", { className: 'cottage-archive-arrow' + (isExpanded ? ' open' : ''), children: "\u25B8" }), _jsx("span", { className: "cottage-archive-group-name", children: group.title })] }), isExpanded &&
                                        sortSessions(group.sessions).map((item) => (_jsx(SessionRow, { item: item, busy: busy, menuOpen: menu?.item.sessionId === item.sessionId, onMenuOpen: (e) => openMenu(e, item), onOpen: onOpenSession ?? (() => undefined) }, item.sessionId)))] }, group.workspaceId));
                        }), flat === null &&
                        data.ungrouped.length > 0 && (_jsxs("div", { className: "cottage-archive-group", children: [_jsxs("div", { className: "cottage-archive-group-title", role: "treeitem", "aria-expanded": true, children: [_jsx("span", { className: "cottage-archive-folder", children: "\uD83D\uDCC2" }), _jsx("span", { className: "cottage-archive-arrow open", children: "\u25B8" }), _jsx("span", { className: "cottage-archive-group-name", children: "\u672A\u5206\u7EC4" })] }), sortSessions(data.ungrouped).map((item) => (_jsx(SessionRow, { item: item, busy: busy, menuOpen: menu?.item.sessionId === item.sessionId, onMenuOpen: (e) => openMenu(e, item), onOpen: onOpenSession ?? (() => undefined) }, item.sessionId)))] }))] }), menu && (_jsx(ContextMenu, { x: menu.x, y: menu.y, items: [
                    { id: 'rename', label: '重命名' },
                    { id: 'unarchive', label: '还原会话' },
                    { id: 'delete', label: '删除会话', danger: true },
                ], onPick: onMenuPick, onClose: () => setMenu(null) }))] }));
}
