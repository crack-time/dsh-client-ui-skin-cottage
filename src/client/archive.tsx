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
import { useCallback, useEffect, useState } from 'react'

const API = '/plugins/@crack/dsh-client-ui-skin-cottage/api'
const VIEW_KEY = 'dsh.workspace.view.v5'

export interface ArchivedItem {
  sessionId: string
  /** Native displayTitle fallback chain: durable title → cwd basename → id prefix. */
  title: string
  createdAt: string | null
}

/** One workspace group, mirroring the native workspace-browser group shape. */
export interface ArchivedGroup {
  workspaceId: string
  title: string
  sessions: ArchivedItem[]
}

export interface ArchivedData {
  groups: ArchivedGroup[]
  ungrouped: ArchivedItem[]
}

async function getArchived(): Promise<ArchivedData> {
  const res = await fetch(API + '/archived')
  if (!res.ok) throw new Error('加载归档列表失败')
  return (await res.json()) as ArchivedData
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

/** Read the native workspace browser's persisted order preference. */
function readNativeOrder(): 'manual' | 'updated' {
  try {
    const raw = localStorage.getItem(VIEW_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { orderBy?: unknown }
      if (parsed.orderBy === 'manual' || parsed.orderBy === 'updated') return parsed.orderBy
    }
  } catch {
    // ignore
  }
  return 'updated'
}

function SessionRow({
  item,
  busy,
  onAct,
}: {
  item: ArchivedItem
  busy: string | null
  onAct: (action: 'unarchive' | 'delete-session', item: ArchivedItem) => Promise<void>
}): React.ReactElement {
  return (
    <div className="cottage-archive-item">
      <div className="cottage-archive-meta">
        <span className="cottage-archive-label" title={item.title}>
          {item.title}
        </span>
        <span className="cottage-archive-time">{formatTime(item.createdAt)}</span>
      </div>
      <div className="cottage-archive-actions">
        <button type="button" disabled={busy === item.sessionId} onClick={() => void onAct('unarchive', item)}>
          恢复
        </button>
        <button
          type="button"
          className="danger"
          disabled={busy === item.sessionId}
          onClick={() => {
            if (window.confirm(`删除会话「${item.title}」？\n会话日志将被移除，此操作不可恢复。`)) {
              void onAct('delete-session', item)
            }
          }}
        >
          删除
        </button>
      </div>
    </div>
  )
}

function formatTime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function ArchiveView({ onClose }: { onClose: () => void }): React.ReactElement {
  const [data, setData] = useState<ArchivedData>({ groups: [], ungrouped: [] })
  const [order, setOrder] = useState<'manual' | 'updated'>(readNativeOrder)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setData(await getArchived())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [])

  // Load once on mount.
  useEffect(() => {
    void refresh()
  }, [refresh])

  const act = async (action: 'unarchive' | 'delete-session', item: ArchivedItem): Promise<void> => {
    setBusy(item.sessionId)
    setError(null)
    try {
      await postAction(action, item.sessionId)
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
    }
  }

  const sortSessions = (sessions: ArchivedItem[]): ArchivedItem[] =>
    order === 'updated'
      ? [...sessions].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
      : sessions
  const total = data.groups.reduce((n, g) => n + g.sessions.length, 0) + data.ungrouped.length

  return (
    <div
      className="cottage-archive"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div className="cottage-archive-head">
        <button type="button" className="cottage-archive-back" onClick={onClose}>
          ← 返回
        </button>
        <span className="cottage-archive-title">📦 归档会话 ({total})</span>
        <div className="cottage-archive-orders" role="group" aria-label="归档排序">
          <button
            type="button"
            className={order === 'updated' ? 'on' : ''}
            onClick={() => setOrder('updated')}
          >
            按时间
          </button>
          <button
            type="button"
            className={order === 'manual' ? 'on' : ''}
            onClick={() => setOrder('manual')}
          >
            按归档顺序
          </button>
        </div>

      </div>
      {error && <div className="cottage-archive-error">{error}</div>}
      <div className="cottage-archive-list">
        {total === 0 && <div className="cottage-archive-empty">暂无归档会话</div>}
        {data.groups.map((group) => (
          <div key={group.workspaceId} className="cottage-archive-group">
            <div className="cottage-archive-group-title">{group.title}</div>
            {sortSessions(group.sessions).map((item) => (
              <SessionRow key={item.sessionId} item={item} busy={busy} onAct={act} />
            ))}
          </div>
        ))}
        {data.ungrouped.length > 0 && (
          <div className="cottage-archive-group">
            <div className="cottage-archive-group-title">未分组</div>
            {sortSessions(data.ungrouped).map((item) => (
              <SessionRow key={item.sessionId} item={item} busy={busy} onAct={act} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
