export interface ArchivedItem {
    sessionId: string;
    /** Native displayTitle fallback chain: durable title → cwd basename → id prefix. */
    title: string;
    createdAt: string | null;
}
/** One workspace group, mirroring the native workspace-browser group shape. */
export interface ArchivedGroup {
    workspaceId: string;
    title: string;
    sessions: ArchivedItem[];
}
export interface ArchivedData {
    groups: ArchivedGroup[];
    ungrouped: ArchivedItem[];
}
export declare function ArchiveView({ onClose }: {
    onClose: () => void;
}): React.ReactElement;
