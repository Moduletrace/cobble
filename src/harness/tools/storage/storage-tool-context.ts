import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import grabStorageScopes, { type StorageScope } from "@/src/utils/storage-access";

export type StorageToolContext = {
    /**
     * The user the run is for.
     */
    user_id: number | string;
    bot_id: number | string;
    /**
     * The directories the run may touch, itself first.
     */
    scopes: StorageScope[];
    /**
     * The session being answered, when a file can ride on its reply.
     */
    session_id?: number | string;
    /**
     * The workspace the run is in, for embeddings.
     */
    workspace_id?: number | string | null;
    /**
     * Called with a file's media id when a tool wrote it and the bot asked
     * for it to be attached to the reply.
     */
    onAttach?: (params: { media_id: number; name: string }) => void;
};

type Params = {
    bot: Pick<BUN_SQLITE_COBBLE_BOTS, "id" | "kind">;
    user_id: number | string;
    workspace_id?: number | string | null;
    session_id?: number | string;
    /**
     * Every workspace, for the coordinator (it reaches them all).
     */
    all_workspace_ids?: number[];
    onAttach?: StorageToolContext["onAttach"];
};

/**
 * The directories one run may touch, from the bot it's for. The
 * coordinator reaches every bot's and workspace's files; a worker its own,
 * plus its workspace's shared one while it works there.
 */
export default function storageToolContext({
    bot,
    user_id,
    workspace_id,
    session_id,
    all_workspace_ids,
    onAttach,
}: Params): StorageToolContext {
    return {
        user_id,
        bot_id: bot.id || 0,
        scopes: grabStorageScopes({
            bot_id: bot.id || 0,
            bot_kind: bot.kind,
            workspace_id,
            all_workspace_ids,
        }),
        session_id,
        workspace_id,
        onAttach,
    };
}

/**
 * A ref the chat renders as a chip, used in tool results so a file the bot
 * names links to it.
 */
export function fileRef({ file_id }: { file_id: number | string }) {
    return `[file:${file_id}]`;
}

/**
 * A human size: "12.4 KB".
 */
export function formatBytes({ bytes }: { bytes: number }) {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;

    return `${bytes} B`;
}

/**
 * The scope label a tool result shows: "your files" or "the workspace's
 * shared files".
 */
export function describeScope({ scope, owner_id }: StorageScope) {
    return scope == "workspace" ? `the workspace's shared files (#${owner_id})` : "your files";
}

/**
 * Finds a scope the bot named, e.g. "workspace:3" or "bot:2".
 */
export function findNamedScope({
    scopes,
    name,
}: {
    scopes: StorageScope[];
    name?: string | null;
}) {
    if (!name?.trim()) return undefined;

    const [scope, owner] = name.trim().split(":");

    return scopes.find((s) => s.scope == scope && String(s.owner_id) == owner);
}
