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
import { createPortal } from 'react-dom'
import { useCallback, useEffect, useState } from 'react'

const API = '/plugins/@crack/dsh-client-ui-skin-cottage/api'
const VIEW_KEY = 'dsh.workspace.view.v5'

export interface ArchivedItem {
  sessionId: string
  /** Native displayTitle fallback chain: durable title → cwd basename → id prefix. */
  title: string
  /** Epoch-millis creation timestamp (host header.createdAt). */
  createdAt: number | null
  /** Last prompt time (activity) for the native 'updated' ordering; falls back to createdAt. */
  updatedAt: number | null
}

export interface ArchivedGroup {
  workspaceId: string
  title: string
  sessions: ArchivedItem[]
}

export interface ArchivedData {
  groups: ArchivedGroup[]
  ungrouped: ArchivedItem[]
}

type OrderBy = 'manual' | 'updated'
type GroupBy = 'workspace' | 'flat'

/** Read the native workspace browser's persisted view state (same key the
 * view-options button writes). */
function readViewState(): { groupBy: GroupBy; orderBy: OrderBy } {
  try {
    const raw = localStorage.getItem(VIEW_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { groupBy?: unknown; orderBy?: unknown }
      return {
        groupBy: parsed.groupBy === 'flat' ? 'flat' : 'workspace',
        orderBy: parsed.orderBy === 'manual' ? 'manual' : 'updated',
      }
    }
  } catch {
    // ignore
  }
  return { groupBy: 'workspace', orderBy: 'updated' }
}

async function getArchived(): Promise<ArchivedData> {
  const res = await fetch(API + '/archived')
  if (!res.ok) throw new Error('加载归档列表失败')
  const data = (await res.json()) as Partial<ArchivedData>
  return { groups: data.groups ?? [], ungrouped: data.ungrouped ?? [] }
}

async function postAction(action: 'unarchive' | 'delete-session', sessionId: string): Promise<void> {
  const res = await fetch(API + '/' + action, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error ?? '操作失败')
  }
}

async function renameSession(sessionId: string, title: string): Promise<void> {
  const res = await fetch(API + '/rename-session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sessionId, title }),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error ?? '重命名失败')
  }
}

function formatTime(ms: number | null): string {
  if (ms === null || ms === undefined) return ''
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Context menu item, mirroring the native row menu (rename / restore / delete). */
interface MenuItem {
  id: string
  label: string
  danger?: boolean
}

function ContextMenu({
  x,
  y,
  items,
  onPick,
  onClose,
}: {
  x: number
  y: number
  items: MenuItem[]
  onPick: (id: string) => void
  onClose: () => void
}): React.ReactPortal {
  return createPortal(
    <>
      <div className="cottage-menu-mask" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose() }} />
      <div className="cottage-menu" style={{ left: x, top: y }} role="menu">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            className={item.danger ? 'danger' : ''}
            onClick={() => onPick(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </>,
    document.body,
  )
}

function SessionRow({
  item,
  busy,
  menuOpen,
  onMenuOpen,
  onRename,
  onUnarchive,
  onDelete,
}: {
  item: ArchivedItem
  busy: string | null
  menuOpen: boolean
  onMenuOpen: (e: React.MouseEvent) => void
  onRename: (item: ArchivedItem) => void
  onUnarchive: (item: ArchivedItem) => void
  onDelete: (item: ArchivedItem) => void
}): React.ReactElement {
  return (
    <div className={'cottage-archive-item' + (menuOpen ? ' menu-open' : '')}>
      <div className="cottage-archive-meta">
        <span className="cottage-archive-label" title={item.title}>
          {item.title}
        </span>
        <span className="cottage-archive-time">{formatTime(item.createdAt)}</span>
      </div>
      <button
        type="button"
        className="cottage-archive-more"
        aria-label="会话操作"
        disabled={busy === item.sessionId}
        onClick={(e) => {
          e.stopPropagation()
          onMenuOpen(e)
        }}
      >
        ⋯
      </button>
    </div>
  )
}

export function ArchiveView({ onClose }: { onClose: () => void }): React.ReactElement {
  const [data, setData] = useState<ArchivedData>({ groups: [], ungrouped: [] })
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<{ groupBy: GroupBy; orderBy: OrderBy }>(readViewState)
  const [menu, setMenu] = useState<{ item: ArchivedItem; x: number; y: number } | null>(null)

  // Mirror the native view-options button: poll the shared persisted store key.
  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = readViewState()
      setView((prev) => (prev.groupBy === next.groupBy && prev.orderBy === next.orderBy ? prev : next))
    }, 400)
    return () => window.clearInterval(timer)
  }, [])

  const refresh = useCallback(async () => {
    try {
      setData(await getArchived())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const act = async (action: 'unarchive' | 'delete-session', item: ArchivedItem): Promise<void> => {
    setBusy(item.sessionId)
    setError(null)
    try {
      await postAction(action, item.sessionId)
      setMenu(null)
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
    }
  }

  const handleRename = (item: ArchivedItem): void => {
    setMenu(null)
    const title = window.prompt('重命名会话', item.title)
    if (title === null) return
    const trimmed = title.trim()
    if (!trimmed) return
    void (async () => {
      setBusy(item.sessionId)
      setError(null)
      try {
        await renameSession(item.sessionId, trimmed)
        await refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        setBusy(null)
      }
    })()
  }

  const handleDelete = (item: ArchivedItem): void => {
    setMenu(null)
    if (!window.confirm(`删除会话「${item.title}」？\n会话日志将被移除，此操作不可恢复。`)) return
    void act('delete-session', item)
  }

  const sortSessions = (sessions: ArchivedItem[]): ArchivedItem[] =>
    view.orderBy === 'updated'
      ? [...sessions].sort((a, b) => (b.updatedAt ?? b.createdAt ?? 0) - (a.updatedAt ?? a.createdAt ?? 0))
      : sessions

  const total = data.groups.reduce((n, g) => n + g.sessions.length, 0) + data.ungrouped.length
  const flat =
    view.groupBy === 'flat'
      ? sortSessions([...data.groups.flatMap((g) => g.sessions), ...data.ungrouped])
      : null

  const openMenu = (e: React.MouseEvent, item: ArchivedItem): void => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setMenu({ item, x: Math.max(8, Math.min(rect.right - 140, window.innerWidth - 148)), y: rect.bottom + 4 })
  }

  const onMenuPick = (id: string): void => {
    if (!menu) return
    if (id === 'rename') handleRename(menu.item)
    else if (id === 'unarchive') void act('unarchive', menu.item)
    else if (id === 'delete') handleDelete(menu.item)
  }

  return (
    <div className="cottage-archive" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <div className="cottage-archive-head">
        <button type="button" className="cottage-archive-back" onClick={onClose}>
          ← 返回
        </button>
        <span className="cottage-archive-title">📦 归档会话 ({total})</span>
        <span className="cottage-archive-viewmode">
          {view.groupBy === 'flat' ? '平铺' : '按工作区'} · {view.orderBy === 'manual' ? '手动' : '按时间'}
        </span>
      </div>
      {error && <div className="cottage-archive-error">{error}</div>}
      <div className="cottage-archive-list">
        {total === 0 && <div className="cottage-archive-empty">暂无归档会话</div>}
        {flat !== null &&
          flat.map((item) => (
            <SessionRow
              key={item.sessionId}
              item={item}
              busy={busy}
              menuOpen={menu?.item.sessionId === item.sessionId}
              onMenuOpen={(e) => openMenu(e, item)}
              onRename={handleRename}
              onUnarchive={(it) => void act('unarchive', it)}
              onDelete={handleDelete}
            />
          ))}
        {flat === null &&
          data.groups.map((group) => (
            <div key={group.workspaceId} className="cottage-archive-group">
              <div className="cottage-archive-group-title">{group.title}</div>
              {sortSessions(group.sessions).map((item) => (
                <SessionRow
                  key={item.sessionId}
                  item={item}
                  busy={busy}
                  menuOpen={menu?.item.sessionId === item.sessionId}
                  onMenuOpen={(e) => openMenu(e, item)}
                  onRename={handleRename}
                  onUnarchive={(it) => void act('unarchive', it)}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ))}
        {flat === null &&
          data.ungrouped.length > 0 && (
            <div className="cottage-archive-group">
              <div className="cottage-archive-group-title">未分组</div>
              {sortSessions(data.ungrouped).map((item) => (
                <SessionRow
                  key={item.sessionId}
                  item={item}
                  busy={busy}
                  menuOpen={menu?.item.sessionId === item.sessionId}
                  onMenuOpen={(e) => openMenu(e, item)}
                  onRename={handleRename}
                  onUnarchive={(it) => void act('unarchive', it)}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
      </div>
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={[
            { id: 'rename', label: '重命名' },
            { id: 'unarchive', label: '还原会话' },
            { id: 'delete', label: '删除会话', danger: true },
          ]}
          onPick={onMenuPick}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  )
}
