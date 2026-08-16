export interface ArchivedItem {
    sessionId: string;
    /** Native displayTitle fallback chain: durable title → cwd basename → id prefix. */
    title: string;
    createdAt: string | null;
}
export declare function ArchiveView({ onClose }: {
    onClose: () => void;
}): React.ReactElement;
