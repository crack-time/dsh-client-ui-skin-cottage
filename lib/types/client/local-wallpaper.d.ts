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
/** Minimal structural types (older DOM libs may lack full FileSystemHandle). */
export type LocalPickerHandle = {
    name: string;
    getFile: () => Promise<File>;
    queryPermission?: (options: {
        mode: 'read';
    }) => Promise<unknown>;
    requestPermission?: (options: {
        mode: 'read';
    }) => Promise<unknown>;
};
export interface PickedWallpaper {
    blobUrl: string;
    name: string;
}
type Listener = () => void;
/** Whether this browser can pick local files in place. */
export declare function supportsLocalPick(): boolean;
/** Subscribe to picked-wallpaper changes (skin re-applies, card re-labels). */
export declare function subscribePicked(listener: Listener): () => void;
export declare function currentPicked(): PickedWallpaper | null;
/** Restore the persisted handle (call on skin boot; no-op when absent). */
export declare function initPicked(): Promise<void>;
/** Open the native file dialog and use the picked file in place (zero copy). */
export declare function pickAndSet(): Promise<boolean>;
/** Forget the picked file and fall back to the URL setting / built-in. */
export declare function clearPicked(): Promise<void>;
/** Revoke any live blob URL (plugin teardown). */
export declare function disposePicked(): void;
export {};
