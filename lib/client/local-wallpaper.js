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
const DB_NAME = 'dsh-web-ui-skin';
const DB_VERSION = 1;
const STORE = 'wallpaper';
const KEY = 'picked';
function openDb() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            if (!req.result.objectStoreNames.contains(STORE))
                req.result.createObjectStore(STORE);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}
function idbRequest(req) {
    return new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}
async function loadHandle() {
    try {
        const db = await openDb();
        const value = await idbRequest(db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY));
        db.close();
        return value ?? null;
    }
    catch {
        return null;
    }
}
async function storeHandle(handle) {
    try {
        const db = await openDb();
        await idbRequest(db.transaction(STORE, 'readwrite').objectStore(STORE).put(handle, KEY));
        db.close();
    }
    catch { }
}
async function dropHandle() {
    try {
        const db = await openDb();
        await idbRequest(db.transaction(STORE, 'readwrite').objectStore(STORE).delete(KEY));
        db.close();
    }
    catch { }
}
/** Whether this browser can pick local files in place. */
export function supportsLocalPick() {
    return (typeof window !== 'undefined' &&
        typeof window.showOpenFilePicker === 'function');
}
const listeners = new Set();
/** Subscribe to picked-wallpaper changes (skin re-applies, card re-labels). */
export function subscribePicked(listener) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}
function publish() {
    listeners.forEach((listener) => listener());
}
/** The currently active picked wallpaper (blob URL + original file name). */
let current = null;
export function currentPicked() {
    return current;
}
async function activate(handle) {
    if (!handle) {
        if (current)
            URL.revokeObjectURL(current.blobUrl);
        current = null;
        publish();
        return;
    }
    const granted = !handle.queryPermission || (await handle.queryPermission({ mode: 'read' })) === 'granted';
    const ok = granted || (handle.requestPermission ? (await handle.requestPermission({ mode: 'read' })) === 'granted' : false);
    if (!ok)
        return;
    const file = await handle.getFile();
    if (current)
        URL.revokeObjectURL(current.blobUrl);
    current = { blobUrl: URL.createObjectURL(file), name: handle.name };
    publish();
}
/** Restore the persisted handle (call on skin boot; no-op when absent). */
export async function initPicked() {
    await activate(await loadHandle());
}
/** Open the native file dialog and use the picked file in place (zero copy). */
export async function pickAndSet() {
    const picker = window.showOpenFilePicker;
    if (typeof picker !== 'function')
        return false;
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
        });
        if (!handle)
            return false;
        await storeHandle(handle);
        await activate(handle);
        return true;
    }
    catch {
        // User cancelled the dialog or the browser denied access.
        return false;
    }
}
/** Forget the picked file and fall back to the URL setting / built-in. */
export async function clearPicked() {
    await dropHandle();
    await activate(null);
}
/** Revoke any live blob URL (plugin teardown). */
export function disposePicked() {
    if (current)
        URL.revokeObjectURL(current.blobUrl);
    current = null;
}
