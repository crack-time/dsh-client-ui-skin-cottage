import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Archive view for the Pastoral Cottage skin.
 *
 * Renders IN PLACE over the workspace browser's tree region (mounted by
 * src/client/index.ts into an absolute overlay container) — same layout
 * vocabulary as the native list, just archived sessions. Talks to the
 * host-half API (src/index.ts). The sidebar entry button (injected next to
 * "Add workspace") toggles the view.
 *
 * Sorting follows the native workspace browser's "view options": reads
 * `dsh.workspace.view.v5` (the browser's persisted view state) for the
 * initial order and offers the same manual/updated toggle locally.
 */
import { useCallback, useEffect, useState } from 'react';
const API = '/plugins/@crack/dsh-client-ui-skin-cottage/api';
const VIEW_KEY = 'dsh.workspace.view.v5';
async function getArchived() {
    const res = await fetch(API + '/archived');
    if (!res.ok)
        throw new Error('加载归档列表失败');
    const data = (await res.json());
    return data.items ?? [];
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
/** Read the native workspace browser's persisted order preference. */
function readNativeOrder() {
    try {
        const raw = localStorage.getItem(VIEW_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.orderBy === 'manual' || parsed.orderBy === 'updated')
                return parsed.orderBy;
        }
    }
    catch {
        // ignore
    }
    return 'updated';
}
function formatTime(iso) {
    if (!iso)
        return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()))
        return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export function ArchiveView({ onClose }) {
    const [items, setItems] = useState([]);
    const [order, setOrder] = useState(readNativeOrder);
    const [busy, setBusy] = useState(null);
    const [error, setError] = useState(null);
    const refresh = useCallback(async () => {
        try {
            setItems(await getArchived());
            setError(null);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    }, []);
    // Load once on mount.
    useEffect(() => {
        void refresh();
    }, [refresh]);
    const act = async (action, item) => {
        setBusy(item.sessionId);
        setError(null);
        try {
            await postAction(action, item.sessionId);
            await refresh();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
        finally {
            setBusy(null);
        }
    };
    const sorted = order === 'updated'
        ? [...items].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
        : items;
    return (_jsxs("div", { className: "cottage-archive", onClick: (e) => e.stopPropagation(), onKeyDown: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "cottage-archive-head", children: [_jsx("button", { type: "button", className: "cottage-archive-back", onClick: onClose, children: "\u2190 \u8FD4\u56DE" }), _jsxs("span", { className: "cottage-archive-title", children: ["\uD83D\uDCE6 \u5F52\u6863\u4F1A\u8BDD (", items.length, ")"] }), _jsxs("div", { className: "cottage-archive-orders", role: "group", "aria-label": "\u5F52\u6863\u6392\u5E8F", children: [_jsx("button", { type: "button", className: order === 'updated' ? 'on' : '', onClick: () => setOrder('updated'), children: "\u6309\u65F6\u95F4" }), _jsx("button", { type: "button", className: order === 'manual' ? 'on' : '', onClick: () => setOrder('manual'), children: "\u6309\u5F52\u6863\u987A\u5E8F" })] })] }), error && _jsx("div", { className: "cottage-archive-error", children: error }), _jsxs("ul", { className: "cottage-archive-list", children: [sorted.length === 0 && _jsx("li", { className: "cottage-archive-empty", children: "\u6682\u65E0\u5F52\u6863\u4F1A\u8BDD" }), sorted.map((item) => (_jsxs("li", { className: "cottage-archive-item", children: [_jsxs("div", { className: "cottage-archive-meta", children: [_jsx("span", { className: "cottage-archive-label", title: item.sessionId, children: item.label }), _jsx("span", { className: "cottage-archive-time", children: formatTime(item.createdAt) })] }), _jsxs("div", { className: "cottage-archive-actions", children: [_jsx("button", { type: "button", disabled: busy === item.sessionId, onClick: () => void act('unarchive', item), children: "\u6062\u590D" }), _jsx("button", { type: "button", className: "danger", disabled: busy === item.sessionId, onClick: () => {
                                            if (window.confirm(`删除会话「${item.label}」？\n会话日志将被移除，此操作不可恢复。`)) {
                                                void act('delete-session', item);
                                            }
                                        }, children: "\u5220\u9664" })] })] }, item.sessionId)))] })] }));
}
