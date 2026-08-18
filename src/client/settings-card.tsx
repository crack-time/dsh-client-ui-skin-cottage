import { useEffect, useState } from 'react'
import { IconChevronDownOutline14 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import {
  clearPicked,
  currentPicked,
  pickAndSet,
  subscribePicked,
  supportsLocalPick,
} from './local-wallpaper.js'

/**
 * Settings-dialog card for the "cottage" skin namespace (dsh rc.7 feature).
 *
 * The host registers the namespace (ctx.settings.register) and serves
 * GET/POST /api/config; the settings dialog's "configurable plugins" tab
 * dispatches the `settings.plugin.item` slot BY namespace key, so this card
 * must be registered into that slot with `key: 'cottage'` to show up. The
 * slot system renders our component with `t` (bound to our locale dict) plus
 * whatever `inject()` returns (here: a uSES snapshot hook + applyPatch).
 *
 * The card mirrors the built-in plugin cards (shell / agent-loop /
 * web-search) structurally: a collapsible card shell with a title + chevron
 * header, an "unsaved" badge while a staged edit differs from the server,
 * the form fields in the expanded body, and a staged save / discard footer.
 * We cannot import their PluginCard component (client bundle purity), so the
 * chrome is re-implemented here with the same class names' CSS values.
 */

/** The three knobs the card edits — keep in sync with the host schema. */
export interface CottageSettings {
  wallpaperUrl: string
  glassOpacity: number
  archiveButton: boolean
}

export const COTTAGE_DEFAULTS: CottageSettings = {
  wallpaperUrl: '',
  glassOpacity: 0.48,
  archiveButton: true,
}

/** Snapshot the card renders from; `loaded` flips once the first read landed. */
export type CottageCardState = CottageSettings & { loaded: boolean }

/** Host endpoint for the URL field's settings read/write. */
export const COTTAGE_CONFIG_URL = '/plugins/@crack/dsh-client-ui-skin-cottage/api/config'

/** Tiny uSES-compatible snapshot store; the slot system exposes `hooks.*` as `use*`. */
export function createCottageCardStore() {
  let state: CottageCardState = { ...COTTAGE_DEFAULTS, loaded: false }
  const listeners = new Set<() => void>()
  return {
    getSnapshot: (): CottageCardState => state,
    set(next: CottageCardState) {
      state = next
      listeners.forEach((listener) => listener())
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

/** Locale dictionary for the card (title / description / labels / hints). */
export const COTTAGE_CARD_LOCALE = {
  zh: {
    title: '壁纸',
    description: '壁纸设置',
    wallpaperUrl: '自定义壁纸 URL',
    wallpaperUrlHint: '留空使用内置壁纸',
    pick: '选择本机图片…',
    removeLocal: '移除本机图片',
    picked: '当前使用本机图片：',
    unsupported: '当前浏览器不支持本机图片选择（仅 Chrome/Edge）',
    save: '保存',
    saving: '保存中…',
    discard: '放弃修改',
    unsaved: '未保存',
    expand: '展开',
    collapse: '折叠',
    saveFailed: '保存失败，请重试',
  },
  en: {
    title: 'Wallpaper',
    description: 'Wallpaper settings',
    wallpaperUrl: 'Custom wallpaper URL',
    wallpaperUrlHint: 'Leave empty for the bundled wallpaper',
    pick: 'Choose local image…',
    removeLocal: 'Remove local image',
    picked: 'Using local image: ',
    unsupported: 'Local image picking needs Chrome/Edge',
    save: 'Save',
    saving: 'Saving…',
    discard: 'Discard',
    unsaved: 'Unsaved',
    expand: 'Expand',
    collapse: 'Collapse',
    saveFailed: 'Save failed, please retry',
  },
} as const

export type CottageCardProps = {
  t: (key: string) => string
  useCottageCard: <T>(select: (state: CottageCardState) => T) => T
  applyPatch: (patch: Partial<CottageSettings>) => Promise<{ ok: boolean; error?: string }>
}

const cn = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(' ')

/** The settings-dialog card for the cottage namespace (slot key 'cottage'). */
export function CottageSettingsCard(props: CottageCardProps) {
  const { t, useCottageCard, applyPatch } = props
  const snapshot = useCottageCard((state) => state)
  const available = snapshot.loaded
  const [open, setOpen] = useState(false)
  const [wallpaper, setWallpaper] = useState(COTTAGE_DEFAULTS.wallpaperUrl)
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)

  const server = snapshot.wallpaperUrl ?? COTTAGE_DEFAULTS.wallpaperUrl
  const dirty = wallpaper.trim() !== server

  // Sync the staged form to fresh server snapshots, but never clobber an
  // in-progress edit (dirty): server pushes are ignored while the user types.
  useEffect(() => {
    if (dirty) return
    setWallpaper(server)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot])

  if (!available) return null

  async function commit() {
    setSaving(true)
    setFailed(false)
    try {
      const outcome = await applyPatch({ wallpaperUrl: wallpaper.trim() })
      if (!outcome.ok) setFailed(true)
    } catch {
      setFailed(true)
    } finally {
      setSaving(false)
    }
  }

  // Picked local wallpaper: the File System Access API opens the native file
  // dialog and hands us a HANDLE to the file in place — nothing is copied to
  // DSH. The handle is persisted (IndexedDB) by local-wallpaper.ts and the
  // skin applies it via the picked-change subscription.
  const [busy, setBusy] = useState(false)
  const [pickedName, setPickedName] = useState<string | null>(null)
  useEffect(() => {
    const sync = () => setPickedName(currentPicked()?.name ?? null)
    sync()
    return subscribePicked(sync)
  }, [])
  const canPickLocally = supportsLocalPick()

  async function handlePick() {
    if (!canPickLocally) return
    setBusy(true)
    setFailed(false)
    const ok = await pickAndSet()
    if (!ok) setFailed(true)
    setBusy(false)
  }

  async function handleClearLocal() {
    setBusy(true)
    setFailed(false)
    await clearPicked()
    setBusy(false)
  }

  const title = t('title')
  return (
    <li
      data-cottage-settings
      className={cn('cottage-settings-card', open && 'cottage-settings-card-open')}
    >
      <button
        type="button"
        className="cottage-settings-header"
        aria-expanded={open}
        aria-label={`${t(open ? 'collapse' : 'expand')}: ${title}`}
        onClick={() => setOpen(!open)}
      >
        <span className="cottage-settings-headText">
          <span className="cottage-settings-name">{title}</span>
          <span className="cottage-settings-description">{t('description')}</span>
        </span>
        {dirty ? <span className="cottage-settings-pending">{t('unsaved')}</span> : null}
        <IconChevronDownOutline14
          className={cn('cottage-settings-chevron', open && 'cottage-settings-chevron-open')}
        />
      </button>
      {open ? (
        <div className="cottage-settings-body">
          <label className="cottage-settings-row">
            <span className="cottage-settings-label">{t('wallpaperUrl')}</span>
            <input
              type="text"
              value={wallpaper}
              placeholder="https://…"
              spellCheck={false}
              onChange={(e) => setWallpaper(e.target.value)}
            />
            <span className="cottage-settings-controls">
              {canPickLocally ? (
                <button
                  type="button"
                  className="cottage-settings-pick"
                  disabled={busy}
                  onClick={() => {
                    void handlePick()
                  }}
                >
                  {t('pick')}
                </button>
              ) : (
                <span className="cottage-settings-hint">{t('unsupported')}</span>
              )}
              {pickedName ? (
                <button
                  type="button"
                  className="cottage-settings-pick"
                  disabled={busy}
                  onClick={() => {
                    void handleClearLocal()
                  }}
                >
                  {t('removeLocal')}
                </button>
              ) : null}
            </span>
            {pickedName ? (
              <span className="cottage-settings-hint">
                {t('picked')}
                {pickedName}
              </span>
            ) : null}
            <span className="cottage-settings-hint">{t('wallpaperUrlHint')}</span>
          </label>
          <div className="cottage-settings-footer">
            {failed ? (
              <p className="cottage-settings-failed" role="status">
                {t('saveFailed')}
              </p>
            ) : null}
            <button
              type="button"
              className="cottage-settings-discard"
              disabled={!dirty || saving}
              onClick={() => {
                setWallpaper(server)
                setFailed(false)
              }}
            >
              {t('discard')}
            </button>
            <button
              type="button"
              className="cottage-settings-save"
              disabled={!dirty || saving}
              onClick={() => {
                void commit()
              }}
            >
              {saving ? t('saving') : t('save')}
            </button>
          </div>
        </div>
      ) : null}
    </li>
  )
}

/**
 * Register the card into the settings dialog:
 *  - locale dictionary under a namespace we own;
 *  - one `settings.plugin.item` slot entry keyed by the 'cottage' namespace.
 * The dialog dispatches it only while the host serves that namespace, so our
 * own registration stays invisible if the settings service is absent.
 */
export function installCottageSettingsCard(
  ctx: ClientContext,
  store: ReturnType<typeof createCottageCardStore>,
): void {
  const dict = 'cottage-skin'
  try {
    const locale = (ctx as unknown as { locale?: { register: (ns: string, dict: unknown) => void } }).locale
    locale?.register(dict, COTTAGE_CARD_LOCALE)
  } catch {}
  try {
    const slots = (ctx as unknown as {
      slots?: {
        inject: (slot: string, provider: () => Generator<unknown, void, unknown>) => void
        register: (options: Record<string, unknown>, component: unknown) => unknown
      }
    }).slots
    slots?.inject('settings.plugin.item', function* () {
      yield slots.register(
        {
          name: 'settings.plugin.item',
          key: 'cottage',
          locale: dict,
          inject: () => ({
            hooks: { cottageCard: store },
            applyPatch: async (patch: Partial<CottageSettings>) => {
              try {
                const res = await fetch(COTTAGE_CONFIG_URL, {
                  method: 'POST',
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify({ patch }),
                })
                if (!res.ok) {
                  const text = await res.text()
                  return { ok: false, error: text.slice(0, 200) }
                }
                return { ok: true }
              } catch {
                return { ok: false, error: 'network' }
              }
            },
          }),
        },
        CottageSettingsCard,
      )
    })
  } catch {}
}