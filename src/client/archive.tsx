/**
 * Archive panel for the Pastoral Cottage skin.
 *
 * Renders into the `shell.overlay` list slot (additive frame-wide layer) and
 * talks to the host-half API (src/index.ts). The sidebar entry button is
 * injected by src/client/index.ts next to the "Add workspace" button; the two
 * sides are bridged with a window CustomEvent.
 *
 * Sorting follows the native workspace browser's "view options": the panel
 * reads `dsh.workspace.view.v5` (the browser's persisted view state) for its
 * initial order and offers the same manual/updated toggle locally.
 */
import { useCallback, useEffect, useState } from 'react'

const API = '/plugins/@crack/dsh-client-ui-skin-cottage/api'
const VIEW_KEY = 'dsh.workspace.view.v5'

export interface ArchivedItem {
  sessionId: string
  label: string
  createdAt: string | null
}

async function getArchived(): Promise<ArchivedItem[]> {
  const res = await fetch(API + '/archived')
  if (!res.ok) throw new Error('加载归档列表失败')
  const data = (await res.json()) as { items: ArchivedItem[] }
  return data.items ?? []
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

function formatTime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function ArchivePanel(_props: unknown): React.ReactElement | null {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<ArchivedItem[]>([])
  const [order, setOrder] = useState<'manual' | 'updated'>(readNativeOrder)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setItems(await getArchived())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [])

  // Toggle bridge: the DOM-injected sidebar button dispatches this event.
  useEffect(() => {
    const onToggle = () => {
      setOpen((v) => {
        const next = !v
        if (next) void refresh()
        return next
      })
    }
    window.addEventListener('cottage:archive-toggle', onToggle)
    return () => window.removeEventListener('cottage:archive-toggle', onToggle)
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

  if (!open) return null

  const sorted =
    order === 'updated'
      ? [...items].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
      : items

  return (
    <div
      className="cottage-archive"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div className="cottage-archive-head">
        <span className="cottage-archive-title">📦 归档会话 ({items.length})</span>
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
        <button
          type="button"
          className="cottage-archive-close"
          aria-label="关闭归档面板"
          onClick={() => setOpen(false)}
        >
          ✕
        </button>
      </div>
      {error && <div className="cottage-archive-error">{error}</div>}
      <ul className="cottage-archive-list">
        {sorted.length === 0 && <li className="cottage-archive-empty">暂无归档会话</li>}
        {sorted.map((item) => (
          <li key={item.sessionId} className="cottage-archive-item">
            <div className="cottage-archive-meta">
              <span className="cottage-archive-label" title={item.sessionId}>
                {item.label}
              </span>
              <span className="cottage-archive-time">{formatTime(item.createdAt)}</span>
            </div>
            <div className="cottage-archive-actions">
              <button
                type="button"
                disabled={busy === item.sessionId}
                onClick={() => void act('unarchive', item)}
              >
                恢复
              </button>
              <button
                type="button"
                className="danger"
                disabled={busy === item.sessionId}
                onClick={() => {
                  if (window.confirm(`删除会话「${item.label}」？\n会话日志将被移除，此操作不可恢复。`)) {
                    void act('delete-session', item)
                  }
                }}
              >
                删除
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
