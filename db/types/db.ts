export const BunSQLiteTables = [
    "users",
    "user_types",
    "sso_login_codes",
    "user_passwords",
    "media",
    "media_paradigms",
    "bots",
    "bot_messages",
    "bot_tasks",
    "bot_task_steps",
    "logs",
] as const

export type BUN_SQLITE_COBBLE_USERS = {
    /** 
     * The unique identifier of the record.
     */
    id?: number | "";
    /** 
     * The time when the record was created. (Unix Timestamp)
     */
    created_at?: number | "";
    /** 
     * The time when the record was updated. (Unix Timestamp)
     */
    updated_at?: number | "";
    first_name?: string;
    last_name?: string;
    email?: string;
    username?: string;
    bio?: string;
    archived?: 0 | 1 | "";
}

export type BUN_SQLITE_COBBLE_USER_TYPES = {
    /** 
     * The unique identifier of the record.
     */
    id?: number | "";
    /** 
     * The time when the record was created. (Unix Timestamp)
     */
    created_at?: number | "";
    /** 
     * The time when the record was updated. (Unix Timestamp)
     */
    updated_at?: number | "";
    user_id?: number | "";
    user_type?: string;
}

export type BUN_SQLITE_COBBLE_SSO_LOGIN_CODES = {
    /** 
     * The unique identifier of the record.
     */
    id?: number | "";
    /** 
     * The time when the record was created. (Unix Timestamp)
     */
    created_at?: number | "";
    /** 
     * The time when the record was updated. (Unix Timestamp)
     */
    updated_at?: number | "";
    user_id?: number | "";
    code?: string;
}

export type BUN_SQLITE_COBBLE_USER_PASSWORDS = {
    /** 
     * The unique identifier of the record.
     */
    id?: number | "";
    /** 
     * The time when the record was created. (Unix Timestamp)
     */
    created_at?: number | "";
    /** 
     * The time when the record was updated. (Unix Timestamp)
     */
    updated_at?: number | "";
    user_id?: number | "";
    password_hash?: string;
}

export type BUN_SQLITE_COBBLE_MEDIA = {
    /** 
     * The unique identifier of the record.
     */
    id?: number | "";
    /** 
     * The time when the record was created. (Unix Timestamp)
     */
    created_at?: number | "";
    /** 
     * The time when the record was updated. (Unix Timestamp)
     */
    updated_at?: number | "";
    user_id?: number | "";
    title?: string;
    description?: string;
    summary?: string;
    media_type?: "image" | "video" | "document" | "";
    media_write_path?: string;
    media_thumbnail_write_path?: string;
    mime_type?: string;
    text_content?: string;
    is_primary?: 0 | 1 | "";
    is_rag_ingested?: 0 | 1 | "";
    is_private?: 0 | 1 | "";
    archived?: 0 | 1 | "";
}

export type BUN_SQLITE_COBBLE_MEDIA_PARADIGMS = {
    /** 
     * The unique identifier of the record.
     */
    id?: number | "";
    /** 
     * The time when the record was created. (Unix Timestamp)
     */
    created_at?: number | "";
    /** 
     * The time when the record was updated. (Unix Timestamp)
     */
    updated_at?: number | "";
    media_id?: number | "";
    media_paradigm?: "user-profile-image" | "generic" | "event" | "";
}

export type BUN_SQLITE_COBBLE_BOTS = {
    /** 
     * The unique identifier of the record.
     */
    id?: number | "";
    /** 
     * The time when the record was created. (Unix Timestamp)
     */
    created_at?: number | "";
    /** 
     * The time when the record was updated. (Unix Timestamp)
     */
    updated_at?: number | "";
    /** 
     * Workspace owner
     */
    user_id?: number | "";
    name?: string;
    /** 
     * One coordinator per workspace; everything else is a worker
     */
    kind?: "worker" | "coordinator" | "";
    /** 
     * Permanent identity hue. Null for the coordinator
     */
    hue?: "ember" | "amber" | "moss" | "teal" | "cobalt" | "violet" | "rose" | "";
    /** 
     * The bot's job in one line. Null for the coordinator
     */
    role?: string;
    /** 
     * The bot's status, shown as its face
     */
    face?: "idle" | "working" | "done" | "asleep" | "needs-you" | "";
    /** 
     * Short status sentence, e.g. "Waiting on you"
     */
    status_line?: string;
    /** 
     * The bot's core instructions, in markdown
     */
    system_prompt?: string;
    unread?: 0 | 1 | "";
    /** 
     * Unix timestamp of the latest message, for rail ordering
     */
    last_activity_at?: number | "";
}

export type BUN_SQLITE_COBBLE_BOT_MESSAGES = {
    /** 
     * The unique identifier of the record.
     */
    id?: number | "";
    /** 
     * The time when the record was created. (Unix Timestamp)
     */
    created_at?: number | "";
    /** 
     * The time when the record was updated. (Unix Timestamp)
     */
    updated_at?: number | "";
    bot_id?: number | "";
    author?: "bot" | "user" | "";
    text?: string;
    /** 
     * Renders the Needs you chip under the message
     */
    needs_you?: 0 | 1 | "";
}

export type BUN_SQLITE_COBBLE_BOT_TASKS = {
    /** 
     * The unique identifier of the record.
     */
    id?: number | "";
    /** 
     * The time when the record was created. (Unix Timestamp)
     */
    created_at?: number | "";
    /** 
     * The time when the record was updated. (Unix Timestamp)
     */
    updated_at?: number | "";
    bot_id?: number | "";
    title?: string;
    status?: "active" | "done" | "";
    /** 
     * "Open computer" target
     */
    computer_url?: string;
}

export type BUN_SQLITE_COBBLE_BOT_TASK_STEPS = {
    /** 
     * The unique identifier of the record.
     */
    id?: number | "";
    /** 
     * The time when the record was created. (Unix Timestamp)
     */
    created_at?: number | "";
    /** 
     * The time when the record was updated. (Unix Timestamp)
     */
    updated_at?: number | "";
    task_id?: number | "";
    label?: string;
    state?: "done" | "active" | "pending" | "";
    position?: number | "";
}

export type BUN_SQLITE_COBBLE_LOGS = {
    /** 
     * The unique identifier of the record.
     */
    id?: number | "";
    /** 
     * The time when the record was created. (Unix Timestamp)
     */
    created_at?: number | "";
    /** 
     * The time when the record was updated. (Unix Timestamp)
     */
    updated_at?: number | "";
    /** 
     * Log title used for searching and identification
     */
    title?: string;
    /** 
     * Log category used for filtering
     */
    category?: "auth" | "websocket" | "cron" | "system" | "error" | "";
    /** 
     * User who triggered the action, if any
     */
    user_id?: number | "";
    /** 
     * Plain text version of the log, full-text searchable
     */
    plain_text?: string;
    /** 
     * Markdown version of the log for formatted viewing
     */
    markdown?: string;
    /** 
     * HTML version of the log for frontend rendering
     */
    html?: string;
    /** 
     * Extra structured log data (ids, values, errors)
     */
    metadata?: string;
    /** 
     * Client IP address that triggered the action, if any
     */
    ip_address?: string;
}

export type BUN_SQLITE_COBBLE_ALL_TYPEDEFS = BUN_SQLITE_COBBLE_USERS & BUN_SQLITE_COBBLE_USER_TYPES & BUN_SQLITE_COBBLE_SSO_LOGIN_CODES & BUN_SQLITE_COBBLE_USER_PASSWORDS & BUN_SQLITE_COBBLE_MEDIA & BUN_SQLITE_COBBLE_MEDIA_PARADIGMS & BUN_SQLITE_COBBLE_BOTS & BUN_SQLITE_COBBLE_BOT_MESSAGES & BUN_SQLITE_COBBLE_BOT_TASKS & BUN_SQLITE_COBBLE_BOT_TASK_STEPS & BUN_SQLITE_COBBLE_LOGS