/**
 * '@' file-mention source for the Pastoral Cottage skin.
 *
 * Registers an InputTriggerSource on the '@' trigger (the same pipeline that
 * powers the '/' command menu): typing '@' in the composer opens the native
 * candidate menu listing the current session's working directory. Picking an
 * entry inserts a native reference CHIP (U+FFFC placeholder) showing the
 * short base name; the full relative path rides the codec (clipboard and
 * model serialization), so the input stays compact while the model still
 * sees '@relative/path'.
 *
 * The file listing comes from the host half (src/index.ts): the browser
 * never receives absolute paths — every entry path is relative to the
 * session cwd, and navigation passes relative directories back.
 *
 * Note: InputTriggerSource.onPick is SYNCHRONOUS and receives only the
 * candidate (no query/directory context), so the full relative path is
 * encoded in the candidate's display name (directories carry a trailing
 * '/'); onPick decides file vs directory from that trailing slash.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { InputTriggerCandidate, InputTriggerSource } from '@deepseek-ai/dsh-client-ui-input-trigger/client'

const API = '/plugins/@crack/dsh-client-ui-skin-cottage/api'

/** Host answer for one directory level (see listMentionFiles in src/index.ts). */
interface MentionListing {
  cwd: string | null
  dir: string
  entries: Array<{ name: string; path: string; isDirectory: boolean }>
  truncated: boolean
  error?: string
}

/** Split a '@' query (e.g. 'src/fo' / 'src/' / '') into directory rel + name prefix. */
function splitQuery(query: string): { rel: string; prefix: string } {
  const slash = query.lastIndexOf('/')
  if (slash === -1) return { rel: '', prefix: query }
  return { rel: query.slice(0, slash + 1), prefix: query.slice(slash + 1) }
}

async function listLevel(sessionId: string, rel: string, query: string, signal: AbortSignal): Promise<MentionListing> {
  const params = new URLSearchParams()
  if (sessionId) params.set('sessionId', sessionId)
  if (rel) params.set('dir', rel)
  else if (query) params.set('q', query)
  const res = await fetch(API + '/mention/files?' + params.toString(), { signal })
  if (!res.ok) return { cwd: null, dir: rel, entries: [], truncated: false }
  const data = (await res.json()) as Partial<MentionListing>
  return {
    cwd: data.cwd ?? null,
    dir: data.dir ?? rel,
    entries: data.entries ?? [],
    truncated: data.truncated === true,
    error: data.error,
  }
}

function makeCandidate(e: { name: string; path: string; isDirectory: boolean }): InputTriggerCandidate {
  return {
    // Short base name in the (max-width 40%) name slot; the full relative
    // path rides the description slot, whose flex:1 keeps the menu as wide
    // as the '/' command menu (min(537px,100%)) instead of truncating.
    name: e.name,
    description: e.isDirectory ? e.path + '/' : e.path,
    // MenuView renders item.icon as-is (a ReactNode): emoji is enough.
    icon: e.isDirectory ? '📁' : '📄',
  }
}

/**
 * Build the '@' file source. Picking a directory returns '@dir/' — the
 * native input machine re-runs detection with query 'dir/' and the menu
 * lists that directory, giving unlimited navigation with zero client state.
 */
/**
 * Tokens this plugin has inserted as real @-references, per session.
 * Backspace interception (registerMentionDelete) consults this set so only
 * our own mentions get whole-token deletion — ordinary '@' text is never
 * disturbed.
 */
export const mentionTokens = new Map<string, Set<string>>()

function recordMentionToken(sessionId: string, token: string): void {
  let set = mentionTokens.get(sessionId)
  if (!set) { set = new Set(); mentionTokens.set(sessionId, set) }
  set.add(token)
}

export function createFileMentionSource(): InputTriggerSource {
  return {
    trigger: '@',
    name: '文件',
    order: 0,
    async candidates(session, { query, signal }) {
      const { rel, prefix } = splitQuery(query)
      const listing = await listLevel(session.sessionId, rel, prefix, signal)
      if (listing.error) return []
      if (rel) {
        // List mode: host returned one directory level; filter by name prefix.
        const needle = prefix.toLowerCase()
        return listing.entries
          .filter((e) => e.name.toLowerCase().startsWith(needle))
          .map(makeCandidate)
      }
      // Search mode (host matched names containing the query) or the root
      // listing on bare '@' — no extra client-side filtering.
      return listing.entries.map(makeCandidate)
    },
    onPick({ candidate, session }) {
      // Full relative path lives in the description slot (dirs end with '/').
      const path = candidate.description ?? candidate.name
      const clean = path.endsWith('/') ? path.slice(0, -1) : path
      // Insert REAL text (no U+FFFC placeholder): the draft carries
      // '@path ' verbatim, so the width auto-adapts and the caret stays
      // aligned. Whole-token deletion is handled by registerMentionDelete.
      recordMentionToken(session.sessionId, clean)
      return { text: '@' + clean + ' ' }
    },
  }
}

/**
 * Client-side registration of the '@' file source under an effect disposer.
 * Call from the skin's apply(). The menu group title is the source name
 * itself ('文件'); the native slash.menu dictionary is single-occupant, so
 * no extra locale registration is attempted.
 */
export function registerFileMention(ctx: ClientContext): void {
  registerMentionDelete(ctx)
  const inputTriggers = ctx.get('inputTriggers')!
  const source = createFileMentionSource()
  ctx.effect(() => inputTriggers.registerSource(source), 'ui-skin-cottage: @ file source')
}
/**
 * Whole-token deletion for our '@' mentions: intercept Backspace on the
 * composer textarea; when the caret sits right after one of the tokens this
 * plugin inserted (recorded in mentionTokens), delete the whole token in one
 * step instead of one character.
 *
 * Reads the live draft through the public conversation.input facade
 * (ctx.conversation.input.shell(id).state), rewrites it via setDraft — the
 * same single write path the composer itself uses, so undo/history behave
 * like a normal edit.
 */
export function registerMentionDelete(ctx: ClientContext): void {
  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.key !== 'Backspace' || e.defaultPrevented) return
    const target = e.target as HTMLElement | null
    if (!target || target.tagName !== 'TEXTAREA') return
    if (!target.className.includes('uV2eYG_input')) return
    const ta = target as HTMLTextAreaElement
    if (ta.selectionStart !== ta.selectionEnd) return
    const caret = ta.selectionStart
    if (caret === 0) return

    // Current session shell
    let sessions
    try {
      sessions = ctx.get('sessions')
    } catch {
      return
    }
    const list = (sessions as { list?: unknown }).list as {
      getSnapshot: () => { current?: string }
    } | undefined
    const current = list?.getSnapshot().current
    if (!current) return
    let conversation
    try {
      conversation = ctx.get('conversation')
    } catch {
      return
    }
    const input = (conversation as { input?: unknown }).input as
      | { shell: (id: string) => { state?: { getSnapshot?: () => { draft?: string } }; setDraft?: (t: string) => void } | undefined }
      | undefined
    const shell = input?.shell(current)
    if (!shell?.state?.getSnapshot || !shell.setDraft) return
    const draft = shell.state.getSnapshot().draft
    if (draft === undefined) return
    if (caret > draft.length) return

    // Scan left from the caret for '@<token>' (no whitespace inside).
    let start = caret - 1
    while (start > 0 && !/\s/.test(draft.charAt(start - 1))) start--
    if (draft.charAt(start) !== '@') return
    const token = draft.slice(start + 1, caret)
    const set = mentionTokens.get(current)
    if (!set || !set.has(token)) return

    // Whole-token delete.
    e.preventDefault()
    shell.setDraft(draft.slice(0, start) + draft.slice(caret))
  }

  document.addEventListener('keydown', onKeyDown, true)
  ctx.effect(() => () => {
    document.removeEventListener('keydown', onKeyDown, true)
  }, 'ui-skin-cottage: mention delete')
}
