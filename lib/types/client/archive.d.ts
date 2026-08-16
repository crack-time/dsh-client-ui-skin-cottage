export interface ArchivedItem {
    sessionId: string;
    label: string;
    createdAt: string | null;
}
export declare function ArchiveView({ onClose }: {
    onClose: () => void;
}): React.ReactElement;
