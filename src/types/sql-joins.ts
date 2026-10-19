import type {
    BUN_SQLITE_COBBLE_MEDIA,
    BUN_SQLITE_COBBLE_MEDIA_PARADIGMS,
    BUN_SQLITE_COBBLE_USERS,
    BUN_SQLITE_COBBLE_LOGS,
} from "@/db/types/db";

export type BUN_SQLITE_COBBLE_USERS_JOIN = BUN_SQLITE_COBBLE_USERS & {
    user_types?: string;
    profile_media_id?: number;
    /**
     * The workers assigned to them (`bot_users`), comma separated.
     */
    bot_ids?: string | null;
    /**
     * The workspaces they were added to (`workspace_users`), comma separated.
     */
    workspace_ids?: string | null;
};

export type BUN_SQLITE_COBBLE_MEDIA_PARADIGMS_JOIN =
    BUN_SQLITE_COBBLE_MEDIA_PARADIGMS & {
        user_id?: number;
        first_name?: string;
        last_name?: string;
    };

export type BUN_SQLITE_COBBLE_MEDIA_JOIN = BUN_SQLITE_COBBLE_MEDIA & {
    media_paradigms?: string;
    user?: BUN_SQLITE_COBBLE_USERS_JOIN;
};

export type BUN_SQLITE_COBBLE_LOGS_JOIN = BUN_SQLITE_COBBLE_LOGS & {
    user_first_name?: string;
    user_last_name?: string;
};
