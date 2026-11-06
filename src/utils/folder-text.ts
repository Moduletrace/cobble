import type { StorageFolderPayload } from "@/src/types";

/**
 * The line under the open folder's name: how much is in it, or, for a path
 * that isn't on disk, that it isn't there. A stale folder link must never
 * read as an empty folder.
 */
export function folderSummary({ folder }: { folder: StorageFolderPayload | null }) {
    if (!folder) return "Pick a folder to look inside.";

    if (folder.missing) {
        return `${folder.label}: this folder isn't on disk. Nothing has written it yet, or its link is out of date.`;
    }

    return `${folder.label}: ${folder.total} item(s). Everything a bot, a workspace or a computer keeps for you.`;
}

/**
 * What an empty listing says, and why it is empty when the folder the
 * user asked for isn't there at all.
 */
export function emptyFolderText({
    folder,
    search,
    loading,
    error,
}: {
    folder: StorageFolderPayload | null;
    search: string;
    loading?: boolean;
    error?: string;
}) {
    if (loading) return "Loading...";
    if (error) return error;
    if (search) return `Nothing matches "${search}".`;

    if (folder?.missing) {
        return `There's no ${folder.path || "folder"} in here. It may have been moved or deleted.`;
    }

    return "This folder is empty.";
}
