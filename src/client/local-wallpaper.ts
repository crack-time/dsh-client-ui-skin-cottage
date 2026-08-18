/**
 * Browser-side "use the picked local file in place" wallpaper source.
 *
 * A plain <input type="file"> cannot yield a local path, so the File System
 * Access API is the zero-copy way to keep using the file at its original
 * location: we persist the file HANDLE in IndexedDB (not the bytes), re-ask
 * for read permission on boot, and turn the file into a blob URL for the
 * skin. Nothing is copied anywhere. Browsers without showOpenFilePicker
 * (Safari/Firefox) simply keep the default wallpaper.
 */

const DB_NAME = 'dsh-web-ui-skin'
const DB_VERSION = 1
const STORE = 'wallpaper'
const KEY = 'picked'

/** Minimal structural types (older DOM libs may lack full FileSystemHandle). */
export type LocalPickerHandle = {
  name: string
  getFile: () => Promise<File>
  queryPermission?: (options: { mode: 'read' }) => Promise<unknown>
  requestPermission?: (options: { mode: 'read' }) => Promise<unknown>
}

export interface PickedWallpaper {
  blobUrl: string
  name: string
}

type Listener = () => void

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function idbRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function loadHandle(): Promise<LocalPickerHandle | null> {
  try {
    const db = await openDb()
    const value = await idbRequest(db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY))
    db.close()
    return (value as LocalPickerHandle | undefined) ?? null
  } catch {
    return null
  }
}

async function storeHandle(handle: LocalPickerHandle): Promise<void> {
  try {
    const db = await openDb()
    await idbRequest(db.transaction(STORE, 'readwrite').objectStore(STORE).put(handle, KEY))
    db.close()
  } catch {}
}

async function dropHandle(): Promise<void> {
  try {
    const db = await openDb()
    await idbRequest(db.transaction(STORE, 'readwrite').objectStore(STORE).delete(KEY))
    db.close()
  } catch {}
}

/** Whether this browser can pick local files in place. */
export function supportsLocalPick(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as unknown as { showOpenFilePicker?: unknown }).showOpenFilePicker === 'function'
  )
}

const listeners = new Set<Listener>()

/** Subscribe to picked-wallpaper changes (skin re-applies, card re-labels). */
export function subscribePicked(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function publish() {
  listeners.forEach((listener) => listener())
}

/** The currently active picked wallpaper (blob URL + original file name). */
let current: PickedWallpaper | null = null
export function currentPicked(): PickedWallpaper | null {
  return current
}

async function activate(handle: LocalPickerHandle | null): Promise<void> {
  if (!handle) {
    if (current) URL.revokeObjectURL(current.blobUrl)
    current = null
    publish()
    return
  }
  const granted =
    !handle.queryPermission || (await handle.queryPermission({ mode: 'read' })) === 'granted'
  const ok = granted || (handle.requestPermission ? (await handle.requestPermission({ mode: 'read' })) === 'granted' : false)
  if (!ok) return
  const file = await handle.getFile()
  if (current) URL.revokeObjectURL(current.blobUrl)
  current = { blobUrl: URL.createObjectURL(file), name: handle.name }
  publish()
}

/** Restore the persisted handle (call on skin boot; no-op when absent). */
export async function initPicked(): Promise<void> {
  await activate(await loadHandle())
}

/** Open the native file dialog and use the picked file in place (zero copy). */
export async function pickAndSet(): Promise<boolean> {
  const picker = (window as unknown as {
    showOpenFilePicker?: (options: unknown) => Promise<LocalPickerHandle[]>
  }).showOpenFilePicker
  if (typeof picker !== 'function') return false
  try {
    const [handle] = await picker({
      types: [
        {
          description: 'Images',
          accept: {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/webp': ['.webp'],
            'image/gif': ['.gif'],
          },
        },
      ],
      excludeAcceptAllOption: false,
    })
    if (!handle) return false
    await storeHandle(handle)
    await activate(handle)
    return true
  } catch {
    // User cancelled the dialog or the browser denied access.
    return false
  }
}

/** Forget the picked file and fall back to the URL setting / built-in. */
export async function clearPicked(): Promise<void> {
  await dropHandle()
  await activate(null)
}

/** Revoke any live blob URL (plugin teardown). */
export function disposePicked(): void {
  if (current) URL.revokeObjectURL(current.blobUrl)
  current = null
}