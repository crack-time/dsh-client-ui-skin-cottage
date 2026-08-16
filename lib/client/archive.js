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
/** Native icon shapes (extracted from @deepseek-ai/dsh-client-ui-primitives). */
function IconFolderOpen() {
    return (_jsxs("svg", { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true", children: [_jsx("path", { fill: "currentColor", d: "M5.19629 1.57104C5.81144 1.5711 6.38623 1.8786 6.72754 2.39038L7.19922 3.09839C7.28454 3.22635 7.42824 3.30344 7.58203 3.30347H12.1699C13.5039 3.30348 14.5859 4.38548 14.5859 5.71948V6.62671C15.2694 7.02689 15.6605 7.85012 15.4385 8.68726L14.3848 12.658C14.1037 13.7164 13.1449 14.4527 12.0498 14.4529H2.91699C1.51651 14.4529 0.451662 13.2814 0.501954 11.9519V3.98706C0.501954 2.65305 1.58396 1.57104 2.91797 1.57104H5.19629ZM3.7793 7.75562C3.30994 7.75562 2.89883 8.07153 2.77832 8.52515L1.91602 11.7722C1.74167 12.4291 2.23734 13.073 2.91699 13.073H12.0498C12.5191 13.0728 12.9304 12.757 13.0508 12.3035L14.1045 8.33374C14.1819 8.04202 13.9619 7.756 13.6602 7.75562H3.7793ZM2.91797 2.9519C2.34625 2.9519 1.88281 3.41534 1.88281 3.98706V7.2937C2.33068 6.7269 3.02249 6.37476 3.7793 6.37476H13.2051V5.71948C13.2051 5.14777 12.7416 4.68434 12.1699 4.68433H7.58203C6.96675 4.6843 6.39209 4.37595 6.05078 3.86401L5.5791 3.15601C5.49379 3.02821 5.34995 2.95196 5.19629 2.9519H2.91797Z" }), _jsx("path", { opacity: "0.2", fill: "currentColor", d: "M13.6602 7.75525C13.9618 7.7556 14.1815 8.04179 14.1045 8.33337L13.0508 12.3031C12.9304 12.7567 12.5191 13.0725 12.0498 13.0726H2.91701C2.23744 13.0725 1.7417 12.4287 1.91603 11.7719L2.77834 8.52478C2.89898 8.07146 3.31018 7.75532 3.77931 7.75525H13.6602ZM5.1963 2.95154C5.34985 2.95159 5.49377 3.02803 5.57912 3.15564L6.0508 3.86365C6.39205 4.37553 6.96685 4.68385 7.58205 4.68396H12.1699C12.7416 4.68396 13.2049 5.14754 13.2051 5.71912V6.37439H3.77931C3.02267 6.37444 2.33067 6.72671 1.88283 7.29333V3.98669C1.88299 3.4152 2.34649 2.95168 2.91798 2.95154H5.1963Z" })] }));
}
function IconFolderClose() {
    return (_jsx("svg", { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true", children: _jsx("path", { fill: "currentColor", transform: "translate(1.5 2.429)", d: "M5.05582 0.518756L4.50669 0.86654L5.05582 0.518756ZM13 9.4837L13.65 9.4837L13.65 3.53962L13 3.53962L12.35 3.53962L12.35 9.4837L13 9.4837ZM11.3264 1.86603L11.3264 1.21603L6.52313 1.21603L6.52313 1.86603L6.52313 2.51603L11.3264 2.51603L11.3264 1.86603ZM5.58054 1.34727L6.12968 0.999489L5.60495 0.170972L5.05582 0.518756L4.50669 0.86654L5.03141 1.69506L5.58054 1.34727ZM4.11323 1.23058e-13L4.11323 -0.65L1.67359 -0.65L1.67359 5.00699e-14L1.67359 0.65L4.11323 0.65L4.11323 1.23058e-13ZM0 1.67359L-0.65 1.67359L-0.65 9.4837L0 9.4837L0.65 9.4837L0.65 1.67359L0 1.67359ZM11.3264 11.1573L11.3264 10.5073L1.67359 10.5073L1.67359 11.1573L1.67359 11.8073L11.3264 11.8073L11.3264 11.1573ZM0 9.4837L-0.65 9.4837C-0.65 10.767 0.390308 11.8073 1.67359 11.8073L1.67359 11.1573L1.67359 10.5073C1.10828 10.5073 0.65 10.049 0.65 9.4837L0 9.4837ZM1.67359 5.00699e-14L1.67359 -0.65C0.390307 -0.65 -0.65 0.390309 -0.65 1.67359L0 1.67359L0.65 1.67359C0.65 1.10828 1.10828 0.65 1.67359 0.65L1.67359 5.00699e-14ZM5.05582 0.518756L5.60495 0.170972C5.28121 -0.340193 4.71829 -0.65 4.11323 -0.65L4.11323 1.23058e-13L4.11323 0.65C4.27282 0.65 4.4213 0.731715 4.50669 0.86654L5.05582 0.518756ZM6.52313 1.86603L6.52313 1.21603C6.36354 1.21603 6.21507 1.13431 6.12968 0.999489L5.58054 1.34727L5.03141 1.69506C5.35515 2.20622 5.91808 2.51603 6.52313 2.51603L6.52313 1.86603ZM13 3.53962L13.65 3.53962C13.65 2.25634 12.6097 1.21603 11.3264 1.21603L11.3264 1.86603L11.3264 2.51603C11.8917 2.51603 12.35 2.97431 12.35 3.53962L13 3.53962ZM13 9.4837L12.35 9.4837C12.35 10.049 11.8917 10.5073 11.3264 10.5073L11.3264 11.1573L11.3264 11.8073C12.6097 11.8073 13.65 10.767 13.65 9.4837L13 9.4837Z" }) }));
}
function IconTriangle() {
    return (_jsx("svg", { width: 14, height: 14, viewBox: "0 0 14 14", fill: "none", "aria-hidden": "true", children: _jsx("path", { d: "M4.25 2.82782L4.25 11.1722C4.25 11.6622 4.84243 11.9076 5.18891 11.5611L9.36109 7.38891C9.57588 7.17412 9.57588 6.82588 9.36109 6.61109L5.18891 2.43891C4.84243 2.09243 4.25 2.33782 4.25 2.82782Z", fill: "currentColor" }) }));
}
function IconEllipsis() {
    return (_jsxs("svg", { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true", children: [_jsx("path", { d: "M4.55146 8.00001C4.55146 8.63513 4.03659 9.15001 3.40146 9.15001C2.76634 9.15001 2.25146 8.63513 2.25146 8.00001C2.25146 7.36488 2.76634 6.85001 3.40146 6.85001C4.03659 6.85001 4.55146 7.36488 4.55146 8.00001Z", fill: "currentColor" }), _jsx("path", { d: "M9.1476 8.00001C9.1476 8.63513 8.63273 9.15001 7.9976 9.15001C7.36248 9.15001 6.8476 8.63513 6.8476 8.00001C6.8476 7.36488 7.36248 6.85001 7.9976 6.85001C8.63273 6.85001 9.1476 7.36488 9.1476 8.00001Z", fill: "currentColor" }), _jsx("path", { d: "M13.7486 8.00001C13.7486 8.63513 13.2338 9.15001 12.5986 9.15001C11.9635 9.15001 11.4486 8.63513 11.4486 8.00001C11.4486 7.36488 11.9635 6.85001 12.5986 6.85001C13.2338 6.85001 13.7486 7.36488 13.7486 8.00001Z", fill: "currentColor" })] }));
}
function ContextMenu({ x, y, items, onPick, onClose, }) {
    return createPortal(_jsxs(_Fragment, { children: [_jsx("div", { className: "cottage-menu-mask", onClick: onClose, onContextMenu: (e) => { e.preventDefault(); onClose(); } }), _jsx("div", { className: "cottage-menu", style: { left: x, top: y }, role: "menu", children: items.map((item) => (_jsx("button", { type: "button", role: "menuitem", className: item.danger ? 'danger' : '', onClick: () => onPick(item.id), children: item.label }, item.id))) })] }), document.body);
}
function SessionRow({ item, busy, menuOpen, onMenuOpen, onOpen, }) {
    return (_jsxs("div", { className: 'cottage-archive-item' + (menuOpen ? ' menu-open' : ''), role: "treeitem", "aria-selected": false, onClick: () => onOpen(item.sessionId), children: [_jsx("span", { className: "cottage-archive-title", title: item.title, children: item.title }), _jsx("span", { className: "cottage-archive-time", children: timeAgo(item.updatedAt ?? item.createdAt) }), _jsx("span", { className: "cottage-archive-actions", children: _jsx("button", { type: "button", className: "cottage-archive-more", "aria-label": "\u4F1A\u8BDD\u64CD\u4F5C", disabled: busy === item.sessionId, onClick: (e) => {
                        e.stopPropagation();
                        onMenuOpen(e);
                    }, children: _jsx(IconEllipsis, {}) }) })] }));
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
    return (_jsxs("div", { className: "cottage-archive", onClick: (e) => e.stopPropagation(), onKeyDown: (e) => e.stopPropagation(), children: [error && _jsx("div", { className: "cottage-archive-error", children: error }), _jsxs("div", { className: "cottage-archive-list", children: [total === 0 && _jsx("div", { className: "cottage-archive-empty", children: "\u6682\u65E0\u5F52\u6863\u4F1A\u8BDD" }), flat !== null &&
                        flat.map((item) => (_jsx(SessionRow, { item: item, busy: busy, menuOpen: menu?.item.sessionId === item.sessionId, onMenuOpen: (e) => openMenu(e, item), onOpen: onOpenSession ?? (() => undefined) }, item.sessionId))), flat === null &&
                        data.groups.map((group) => {
                            const isExpanded = expanded[group.workspaceId] !== false;
                            return (_jsxs("div", { className: "cottage-archive-group", children: [_jsxs("div", { className: "cottage-archive-group-title", role: "treeitem", "aria-expanded": isExpanded, onClick: () => {
                                            const next = !isExpanded;
                                            setExpanded((prev) => ({ ...prev, [group.workspaceId]: next }));
                                            writeGroupExpansion(group.workspaceId, next);
                                        }, children: [_jsx("span", { className: 'cottage-archive-folder' + (isExpanded ? ' open' : ''), children: isExpanded ? _jsx(IconFolderOpen, {}) : _jsx(IconFolderClose, {}) }), _jsx("span", { className: "cottage-archive-chevron", children: _jsx("span", { className: 'cottage-archive-arrow' + (isExpanded ? ' open' : ''), children: _jsx(IconTriangle, {}) }) }), _jsx("span", { className: "cottage-archive-project", children: _jsx("span", { className: "cottage-archive-title", children: group.title }) })] }), isExpanded &&
                                        sortSessions(group.sessions).map((item) => (_jsx(SessionRow, { item: item, busy: busy, menuOpen: menu?.item.sessionId === item.sessionId, onMenuOpen: (e) => openMenu(e, item), onOpen: onOpenSession ?? (() => undefined) }, item.sessionId)))] }, group.workspaceId));
                        }), flat === null &&
                        data.ungrouped.length > 0 && (_jsxs("div", { className: "cottage-archive-group", children: [_jsxs("div", { className: "cottage-archive-group-title", role: "treeitem", "aria-expanded": true, children: [_jsx("span", { className: "cottage-archive-folder open", children: _jsx(IconFolderOpen, {}) }), _jsx("span", { className: "cottage-archive-chevron", children: _jsx("span", { className: "cottage-archive-arrow open", children: _jsx(IconTriangle, {}) }) }), _jsx("span", { className: "cottage-archive-project", children: _jsx("span", { className: "cottage-archive-title", children: "\u672A\u5206\u7EC4" }) })] }), sortSessions(data.ungrouped).map((item) => (_jsx(SessionRow, { item: item, busy: busy, menuOpen: menu?.item.sessionId === item.sessionId, onMenuOpen: (e) => openMenu(e, item), onOpen: onOpenSession ?? (() => undefined) }, item.sessionId)))] }))] }), menu && (_jsx(ContextMenu, { x: menu.x, y: menu.y, items: [
                    { id: 'rename', label: '重命名' },
                    { id: 'unarchive', label: '还原会话' },
                    { id: 'delete', label: '删除会话', danger: true },
                ], onPick: onMenuPick, onClose: () => setMenu(null) }))] }));
}
