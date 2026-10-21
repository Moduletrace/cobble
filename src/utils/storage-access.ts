import type { BotFileScope } from "@/src/dict/bot-file-dict";

/**
 * One storage directory a run may read and write: a bot's own
 * (`DATA_DIR/bots/<owner_id>`) or a workspace's shared one
 * (`DATA_DIR/workspaces/<owner_id>`).
 */
export type StorageScope = {
    scope: BotFileScope;
    owner_id: number;
};

type Params = {
    bot_id: number;
    /**
     * `coordinator`: it reaches every bot's and every workspace's files.
     */
    bot_kind?: string | null;
    /**
     * The workspace the run is in, if any. A worker then reaches that
     * workspace's shared files too.
     */
    workspace_id?: number | string | null;
    /**
     * Every workspace, for the coordinator (it isn't a member of one, it
     * reaches them all). Filled by the caller that already read them.
     */
    all_workspace_ids?: number[];
};

/**
 * The directories a run may touch, itself first. A worker: its own, plus
 * its workspace's shared one while it works there. The coordinator: every
 * bot's and every workspace's, its own first.
 *
 * Enforced by every file tool, never left to the prompt: a bot that names
 * a directory it doesn't reach is told so.
 */
export default function grabStorageScopes({
    bot_id,
    bot_kind,
    workspace_id,
    all_workspace_ids = [],
}: Params): StorageScope[] {
    const own: StorageScope = { scope: "bot", owner_id: Number(bot_id) };

    if (bot_kind == "coordinator") {
        return [
            own,
            ...all_workspace_ids
                .filter((id) => Number(id) > 0)
                .map((id): StorageScope => ({ scope: "workspace", owner_id: Number(id) })),
        ];
    }

    return workspace_id ? [own, { scope: "workspace", owner_id: Number(workspace_id) }] : [own];
}

/**
 * Whether a scope is one of the run's.
 */
export function canReachScope({
    scopes,
    scope,
    owner_id,
}: {
    scopes: StorageScope[];
    scope: BotFileScope;
    owner_id: number | string;
}) {
    return scopes.some((s) => s.scope == scope && s.owner_id == Number(owner_id));
}

/**
 * A scope's label for tools and messages: "your files" for a bot's own,
 * the workspace's name for a shared one.
 */
export function storageScopeKey({ scope, owner_id }: StorageScope) {
    return `${scope}:${owner_id}`;
}
