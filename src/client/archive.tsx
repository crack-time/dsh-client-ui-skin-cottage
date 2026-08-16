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

interface ViewState {
  groupBy: GroupBy
  orderBy: OrderBy
  /** Collapsed workspace groups, shared with the native browser (same key). */
  groupExpansion: Record<string, boolean>
}

/** Read the native workspace browser's persisted view state (the exact
 * store the view-options button and group headers write). */
function readViewState(): ViewState {
  try {
    const raw = localStorage.getItem(VIEW_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as {
        groupBy?: unknown
        orderBy?: unknown
        groupExpansion?: unknown
      }
      return {
        groupBy: parsed.groupBy === 'flat' ? 'flat' : 'workspace',
        orderBy: parsed.orderBy === 'manual' ? 'manual' : 'updated',
        groupExpansion:
          parsed.groupExpansion && typeof parsed.groupExpansion === 'object'
            ? (parsed.groupExpansion as Record<string, boolean>)
            : {},
      }
    }
  } catch {
    // ignore
  }
  return { groupBy: 'workspace', orderBy: 'updated', groupExpansion: {} }
}

/** Persist a group-expansion change into the shared native store key. */
function writeGroupExpansion(key: string, expanded: boolean): void {
  try {
    const state = readViewState()
    const next = { ...state.groupExpansion, [key]: expanded }
    localStorage.setItem(VIEW_KEY, JSON.stringify({ ...state, groupExpansion: next }))
  } catch {
    // ignore
  }
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

/** Relative time label mirroring the native row time (now/minutes/hours/days). */
function timeAgo(ms: number | null): string {
  if (ms === null || ms === undefined) return ''
  const diff = Date.now() - ms
  if (diff < 60_000) return '刚刚'
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  return `${days} 天前`
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
  onOpen,
}: {
  item: ArchivedItem
  busy: string | null
  menuOpen: boolean
  onMenuOpen: (e: React.MouseEvent) => void
  onOpen: (sessionId: string) => void
}): React.ReactElement {
  return (
    <div
      className={'cottage-archive-item' + (menuOpen ? ' menu-open' : '')}
      role="treeitem"
      aria-selected={false}
      onClick={() => onOpen(item.sessionId)}
    >
      <div className="cottage-archive-meta">
        <span className="cottage-archive-label" title={item.title}>
          {item.title}
        </span>
        <span className="cottage-archive-time">{timeAgo(item.updatedAt ?? item.createdAt)}</span>
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

export function ArchiveView({
  onClose,
  onOpenSession,
}: {
  onClose: () => void
  onOpenSession?: (sessionId: string) => void
}): React.ReactElement {
  const [data, setData] = useState<ArchivedData>({ groups: [], ungrouped: [] })
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<{ groupBy: GroupBy; orderBy: OrderBy }>(readViewState)
  const [menu, setMenu] = useState<{ item: ArchivedItem; x: number; y: number } | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => readViewState().groupExpansion)

  // Mirror the native view-options button: poll the shared persisted store key.
  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = readViewState()
      setView((prev) =>
        prev.groupBy === next.groupBy && prev.orderBy === next.orderBy ? prev : next,
      )
      setExpanded((prev) => {
        for (const key of Object.keys(next.groupExpansion)) {
          if (prev[key] !== next.groupExpansion[key]) return { ...next.groupExpansion }
        }
        return prev
      })
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
              onOpen={onOpenSession ?? (() => undefined)}
              
              
            />
          ))}
        {flat === null &&
          data.groups.map((group) => {
            const isExpanded = expanded[group.workspaceId] !== false
            return (
              <div key={group.workspaceId} className="cottage-archive-group">
                <div
                  className="cottage-archive-group-title"
                  role="treeitem"
                  aria-expanded={isExpanded}
                  onClick={() => {
                    const next = !isExpanded
                    setExpanded((prev) => ({ ...prev, [group.workspaceId]: next }))
                    writeGroupExpansion(group.workspaceId, next)
                  }}
                >
                  <span className="cottage-archive-folder">{isExpanded ? '📂' : '📁'}</span>
                  <span className={'cottage-archive-arrow' + (isExpanded ? ' open' : '')}>▸</span>
                  <span className="cottage-archive-group-name">{group.title}</span>
                </div>
                {isExpanded &&
                  sortSessions(group.sessions).map((item) => (
                    <SessionRow
                      key={item.sessionId}
                      item={item}
                      busy={busy}
                      menuOpen={menu?.item.sessionId === item.sessionId}
                      onMenuOpen={(e) => openMenu(e, item)}
                      onOpen={onOpenSession ?? (() => undefined)}
                      
                      
                    />
                  ))}
              </div>
            )
          })}
        {flat === null &&
          data.ungrouped.length > 0 && (
            <div className="cottage-archive-group">
              <div className="cottage-archive-group-title" role="treeitem" aria-expanded>
                <span className="cottage-archive-folder">📂</span>
                <span className="cottage-archive-arrow open">▸</span>
                <span className="cottage-archive-group-name">未分组</span>
              </div>
              {sortSessions(data.ungrouped).map((item) => (
                <SessionRow
                  key={item.sessionId}
                  item={item}
                  busy={busy}
                  menuOpen={menu?.item.sessionId === item.sessionId}
                  onMenuOpen={(e) => openMenu(e, item)}
                  onOpen={onOpenSession ?? (() => undefined)}
                  
                  
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
