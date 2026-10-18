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
    "bots_queue",
    "workspaces",
    "workspace_bots",
    "containers",
    "computers",
    "bot_computers",
    "workspace_computers",
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
     * Bot owner
     */
    user_id?: number | "";
    name?: string;
    /** 
     * One coordinator per owner; everything else is a worker
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
     * The bot's core instructions, in markdown. The bot can rewrite it
     */
    system_prompt?: string;
    /** 
     * What the bot must always remember, in markdown. The bot keeps it up to date
     */
    memory?: string;
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

export type BUN_SQLITE_COBBLE_BOTS_QUEUE = {
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
     * The bot doing the work
     */
    bot_id?: number | "";
    /** 
     * The user message that asked for the work, if any
     */
    message_id?: number | "";
    /** 
     * The task shown in the working-on panel, if any
     */
    task_id?: number | "";
    /** 
     * The computer to run on, if any. Checked against the bot's access when queued
     */
    computer_id?: number | "";
    /** 
     * Short label for the job
     */
    title?: string;
    /** 
     * The brief the bot wrote for itself, in markdown
     */
    instructions?: string;
    /** 
     * Structured parameters the handler needs
     */
    params?: string;
    /** 
     * Latest progress note from the bot, in markdown
     */
    progress?: string;
    /** 
     * State to resume from if the job is picked up again
     */
    checkpoint?: string;
    /** 
     * What the bot reported when it finished, in markdown
     */
    result?: string;
    /** 
     * Unix timestamp of the first claim
     */
    started_at?: number | "";
    /** 
     * Unix timestamp of completion or final failure
     */
    finished_at?: number | "";
    /** 
     * The state of the job. (pending | processing | completed | failed)
     */
    status?: string;
    /** 
     * The number of times the job has been claimed.
     */
    attempts?: number | "";
    /** 
     * The time from which the job can be claimed. (Unix Timestamp)
     */
    available_at?: number | "";
    /** 
     * The time when the job was claimed. (Unix Timestamp)
     */
    locked_at?: number | "";
    /** 
     * The worker that claimed the job.
     */
    locked_by?: string;
    /** 
     * The error from the last failed attempt.
     */
    last_error?: string;
}

export type BUN_SQLITE_COBBLE_WORKSPACES = {
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
    description?: string;
    /** 
     * Shared context in markdown, appended to the prompt of every bot in the workspace
     */
    system_prompt?: string;
    archived?: 0 | 1 | "";
}

export type BUN_SQLITE_COBBLE_WORKSPACE_BOTS = {
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
    workspace_id?: number | "";
    bot_id?: number | "";
}

export type BUN_SQLITE_COBBLE_CONTAINERS = {
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
     * Docker container name, also its hostname on the network
     */
    name?: string;
    /** 
     * Docker container id, once known
     */
    docker_id?: string;
    purpose?: "computer" | "";
    /** 
     * Image the container runs, e.g. ghcr.io/agent-infra/sandbox:latest
     */
    image?: string;
    /** 
     * Docker network shared with the main container
     */
    network?: string;
    /** 
     * Address the main container reaches it on
     */
    hostname?: string;
    /** 
     * Port the service listens on inside the container
     */
    port?: number | "";
    /** 
     * Last known docker state
     */
    status?: "created" | "running" | "paused" | "restarting" | "exited" | "removing" | "dead" | "unknown" | "";
    /** 
     * Extra docker details (ports, volumes, env names, labels)
     */
    metadata?: string;
    /** 
     * Unix timestamp of the last docker inspect
     */
    last_seen_at?: number | "";
}

export type BUN_SQLITE_COBBLE_COMPUTERS = {
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
     * Computer owner
     */
    user_id?: number | "";
    /** 
     * The container this computer runs in
     */
    container_id?: number | "";
    name?: string;
    /** 
     * One main computer per owner; everything else is a sandbox
     */
    kind?: "main" | "sandbox" | "";
    description?: string;
}

export type BUN_SQLITE_COBBLE_BOT_COMPUTERS = {
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
    computer_id?: number | "";
}

export type BUN_SQLITE_COBBLE_WORKSPACE_COMPUTERS = {
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
     * Every bot in this workspace gets access to the computer
     */
    workspace_id?: number | "";
    computer_id?: number | "";
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

export type BUN_SQLITE_COBBLE_ALL_TYPEDEFS = BUN_SQLITE_COBBLE_USERS & BUN_SQLITE_COBBLE_USER_TYPES & BUN_SQLITE_COBBLE_SSO_LOGIN_CODES & BUN_SQLITE_COBBLE_USER_PASSWORDS & BUN_SQLITE_COBBLE_MEDIA & BUN_SQLITE_COBBLE_MEDIA_PARADIGMS & BUN_SQLITE_COBBLE_BOTS & BUN_SQLITE_COBBLE_BOT_MESSAGES & BUN_SQLITE_COBBLE_BOT_TASKS & BUN_SQLITE_COBBLE_BOT_TASK_STEPS & BUN_SQLITE_COBBLE_BOTS_QUEUE & BUN_SQLITE_COBBLE_WORKSPACES & BUN_SQLITE_COBBLE_WORKSPACE_BOTS & BUN_SQLITE_COBBLE_CONTAINERS & BUN_SQLITE_COBBLE_COMPUTERS & BUN_SQLITE_COBBLE_BOT_COMPUTERS & BUN_SQLITE_COBBLE_WORKSPACE_COMPUTERS & BUN_SQLITE_COBBLE_LOGS