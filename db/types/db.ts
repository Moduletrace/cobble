export const BunSQLiteTables = [
    "users",
    "user_types",
    "sso_login_codes",
    "user_passwords",
    "media",
    "media_paradigms",
    "bots",
    "bot_sessions",
    "bot_messages",
    "bot_message_reactions",
    "bot_tasks",
    "bot_task_steps",
    "bots_queue",
    "bots_queue_updates",
    "cron_jobs",
    "workspaces",
    "workspace_bots",
    "workspace_users",
    "bot_users",
    "bot_user_memories",
    "bot_user_faces",
    "bot_message_media",
    "containers",
    "computers",
    "bot_computers",
    "workspace_computers",
    "harness_providers",
    "harness_models",
    "harness_settings",
    "bot_harness_settings",
    "workspace_harness_settings",
    "mcp_servers",
    "custom_tools",
    "bot_mcp_servers",
    "workspace_mcp_servers",
    "bot_custom_tools",
    "workspace_custom_tools",
    "logs",
    "user_presence",
    "push_subscriptions",
    "envs",
    "bot_files",
    "bot_file_chunks",
    "bot_file_vectors",
    "file_ingest_queue",
    "app_settings",
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
    media_type?: "image" | "video" | "document" | "audio" | "";
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
    media_paradigm?: "user-profile-image" | "generic" | "event" | "bot-attachment" | "bot-image" | "workspace-image" | "bot-file" | "";
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
     * Who created the bot. Not a foreign key, and not access: bots belong to the install, reached through `bot_users` and `workspace_users`
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
     * The bot's core instructions, in markdown. The bot can rewrite it
     */
    system_prompt?: string;
    /** 
     * What the bot must always remember, in markdown, the same for every user it works with: never about one user (that's `bot_user_memories`). The bot keeps it up to date
     */
    memory?: string;
    /** 
     * The computer the bot works on in its own chat. Not a foreign key: null, or a computer it lost access to, means its main one. In a workspace it works on the workspace's computer
     */
    computer_id?: number | "";
    /** 
     * A custom picture (a private `media` row, paradigm `bot-image`) shown instead of the stone. The hue still applies. Not a foreign key: a missing row means the stone
     */
    image_media_id?: number | "";
}

export type BUN_SQLITE_COBBLE_BOT_SESSIONS = {
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
     * The user the conversation is with: only they see it, and the bot's runs in it work for them
     */
    user_id?: number | "";
    /** 
     * The bot
     */
    bot_id?: number | "";
    /** 
     * The workspace the conversation is in. Null: the bot's own chat
     */
    workspace_id?: number | "";
    /** 
     * Written by the bot from the session's first exchange
     */
    title?: string;
    /** 
     * What happened in the session (markdown), written by the bot and refreshed as it goes, then carried into the next one
     */
    summary?: string;
    /** 
     * How many of the session's messages the summary covers, so a stale one is rewritten before it's carried into the next session
     */
    summary_message_count?: number | "";
    /** 
     * The session this one carries on from (its summary goes into the prompt). Not a foreign key
     */
    previous_session_id?: number | "";
    /** 
     * One active session per conversation
     */
    status?: "active" | "closed" | "";
    unread?: 0 | 1 | "";
    /** 
     * Unix timestamp of the latest message, for ordering
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
    /** 
     * The session the message is in
     */
    session_id?: number | "";
    /** 
     * The session's workspace, kept here to route the message without a join. Null: the bot's own chat
     */
    workspace_id?: number | "";
    author?: "bot" | "user" | "";
    text?: string;
    /** 
     * Renders the Needs you chip under the message
     */
    needs_you?: 0 | 1 | "";
    /** 
     * The message this one replies to, quoted above it. Not a foreign key, so deleting the quoted message only drops the quote
     */
    reply_to_message_id?: number | "";
}

export type BUN_SQLITE_COBBLE_BOT_MESSAGE_REACTIONS = {
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
    message_id?: number | "";
    /** 
     * The user who reacted. Null for a bot's own reaction
     */
    user_id?: number | "";
    /** 
     * The bot that reacted. Null for a user's reaction
     */
    bot_id?: number | "";
    /** 
     * One of BotMessageReactions
     */
    emoji?: string;
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
    /** 
     * The session the task was started from; its result is posted there
     */
    session_id?: number | "";
    /** 
     * The session's workspace. Null: the bot's own chat
     */
    workspace_id?: number | "";
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
     * task (long-running work, shown in the working-on panel) or reply (answers the user in chat)
     */
    kind?: "task" | "reply" | "";
    /** 
     * The bot doing the work
     */
    bot_id?: number | "";
    /** 
     * The session the result is posted in
     */
    session_id?: number | "";
    /** 
     * The session's workspace: its context, computers and models apply. Null: the bot's own chat
     */
    workspace_id?: number | "";
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
     * The bot that handed this job over (the coordinator, through delegate_task). It gets the result or failure in its own conversation. Not a foreign key, so the job outlives it
     */
    requested_by_bot_id?: number | "";
    /** 
     * The requesting bot's session the job was handed over from. The report goes to that conversation's active session. Not a foreign key
     */
    requested_by_session_id?: number | "";
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

export type BUN_SQLITE_COBBLE_BOTS_QUEUE_UPDATES = {
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
     * The job
     */
    bots_queue_id?: number | "";
    /** 
     * The bot doing the work (the job's), to read a bot's updates without a join
     */
    bot_id?: number | "";
    /** 
     * tool (the bot called tools) or note (it wrote something without calling one)
     */
    kind?: "tool" | "note" | "";
    /** 
     * The update in one line, e.g. "Using sandbox_execute_bash"
     */
    text?: string;
    /** 
     * JSON details: the step index, tool names, the model
     */
    metadata?: string;
}

export type BUN_SQLITE_COBBLE_CRON_JOBS = {
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
     * The owner
     */
    user_id?: number | "";
    /** 
     * The bot that runs it
     */
    bot_id?: number | "";
    /** 
     * The workspace it runs in (context, computers, models, and the conversation its results go to); null for the bot's own chat
     */
    workspace_id?: number | "";
    title?: string;
    /** 
     * The brief each run gets (markdown), like a task's
     */
    instructions?: string;
    /** 
     * A Bun.cron expression (5 fields or a nickname like @daily), in UTC
     */
    schedule?: string;
    /** 
     * The computer its runs use; null for the bot's current one when it runs. Not a foreign key
     */
    computer_id?: number | "";
    enabled?: 0 | 1 | "";
    /** 
     * Turns itself off after this many runs (1 for a one-off); null runs until stopped
     */
    max_runs?: number | "";
    run_count?: number | "";
    /** 
     * Unix ms of the next run; null once it can't run again
     */
    next_run_at?: number | "";
    /** 
     * Unix ms of the last run queued
     */
    last_run_at?: number | "";
    /** 
     * The `bots_queue` job of the last run. Not a foreign key: finished jobs are pruned
     */
    last_job_id?: number | "";
    /** 
     * Why the last run couldn't be queued or was skipped; cleared by the next run
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
     * Who created the workspace. Not a foreign key, and not access: workspaces belong to the install, reached through `workspace_users`
     */
    user_id?: number | "";
    name?: string;
    description?: string;
    /** 
     * Shared context in markdown, in the prompt of every bot working in the workspace
     */
    system_prompt?: string;
    /** 
     * The default computer: where the workspace's tasks run. Set to the first computer linked; null when none is. Not a foreign key
     */
    computer_id?: number | "";
    /** 
     * The workspace's picture (a private `media` row, paradigm `workspace-image`). Not a foreign key: a missing row means the default icon
     */
    image_media_id?: number | "";
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
    /** 
     * The bot's instructions for this workspace (markdown), after the workspace's own. The bot, the coordinator and the user can rewrite them
     */
    system_prompt?: string;
    /** 
     * What the bot must remember in this workspace (markdown), after its core memory
     */
    memory?: string;
}

export type BUN_SQLITE_COBBLE_WORKSPACE_USERS = {
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
    user_id?: number | "";
}

export type BUN_SQLITE_COBBLE_BOT_USERS = {
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
    user_id?: number | "";
}

export type BUN_SQLITE_COBBLE_BOT_USER_MEMORIES = {
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
    user_id?: number | "";
    /** 
     * What the bot must remember about this user (markdown), after its core memory. The bot keeps it up to date
     */
    memory?: string;
}

export type BUN_SQLITE_COBBLE_BOT_USER_FACES = {
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
    user_id?: number | "";
    /** 
     * The bot's status for this user, shown as its face
     */
    face?: "idle" | "working" | "done" | "asleep" | "needs-you" | "";
    /** 
     * Short status sentence, e.g. "Waiting on you"
     */
    status_line?: string;
}

export type BUN_SQLITE_COBBLE_BOT_MESSAGE_MEDIA = {
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
    message_id?: number | "";
    media_id?: number | "";
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
     * Its IP address on the network, tried when the hostname can't be reached (a dev server outside docker)
     */
    ip_address?: string;
    /** 
     * Port the service listens on inside the container
     */
    port?: number | "";
    /** 
     * Last known docker state
     */
    status?: "creating" | "failed" | "created" | "starting" | "running" | "unhealthy" | "paused" | "restarting" | "exited" | "removing" | "dead" | "unknown" | "";
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
     * Who created the computer. Not a foreign key, and not access: computers belong to the install, reached through the bots that use them
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
    /** 
     * CPU cores the container may use (docker NanoCpus), set when the computer is created
     */
    cpus?: number | "";
    /** 
     * Memory limit of the container in MB, set when the computer is created
     */
    memory_mb?: number | "";
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

export type BUN_SQLITE_COBBLE_HARNESS_PROVIDERS = {
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
     * Which provider preset this is
     */
    kind?: "openrouter" | "openai" | "anthropic" | "google" | "deepseek" | "groq" | "mistral" | "xai" | "ollama" | "custom" | "";
    name?: string;
    /** 
     * API base URL, e.g. https://openrouter.ai/api/v1
     */
    base_url?: string;
    /** 
     * API key, encrypted with ENCRYPTION_KEY. Never sent to the client
     */
    api_key?: string;
    enabled?: 0 | 1 | "";
    /** 
     * Unix timestamp of the last model list sync
     */
    last_synced_at?: number | "";
    /** 
     * Why the last model list sync failed, if it did
     */
    sync_error?: string;
}

export type BUN_SQLITE_COBBLE_HARNESS_MODELS = {
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
    provider_id?: number | "";
    /** 
     * The provider's model id, e.g. deepseek/deepseek-v4.1-flash:free
     */
    slug?: string;
    name?: string;
    free?: 0 | 1 | "";
    /** 
     * 0 once the provider stops listing it
     */
    available?: 0 | 1 | "";
    /** 
     * JSON array, e.g. ["text","image"]
     */
    input_modalities?: string;
    /** 
     * JSON array, e.g. ["text"], ["speech"], ["image"]
     */
    output_modalities?: string;
    supports_tools?: 0 | 1 | "";
    context_length?: number | "";
    max_output_tokens?: number | "";
    /** 
     * JSON array of voice names, for speech models
     */
    voices?: string;
    /** 
     * Artificial Analysis intelligence index
     */
    intelligence_score?: number | "";
    /** 
     * Artificial Analysis agentic index
     */
    agentic_score?: number | "";
    released_at?: number | "";
    /** 
     * When the provider retires the model
     */
    expires_at?: number | "";
    /** 
     * Unix timestamp of the last sync that listed it
     */
    last_seen_at?: number | "";
}

export type BUN_SQLITE_COBBLE_HARNESS_SETTINGS = {
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
    harness?: "text" | "vision" | "transcription" | "speech" | "image" | "embedding" | "";
    /** 
     * harness_models row picked by a super admin. Null picks automatically. Not a foreign key, so removing a provider leaves the setting
     */
    model_id?: number | "";
    /** 
     * harness_providers row this harness is limited to (its pick and automatic picks). Null: any provider. Not a foreign key; removing the provider clears it
     */
    provider_id?: number | "";
    /** 
     * When the picked model fails, try the automatic picks
     */
    fallback?: 0 | 1 | "";
    /** 
     * 0 turns the harness off. Text is always on
     */
    enabled?: 0 | 1 | "";
    /** 
     * Harness options, e.g. {"voice":"george"} for speech
     */
    options?: string;
}

export type BUN_SQLITE_COBBLE_BOT_HARNESS_SETTINGS = {
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
     * The worker bot that overrides the default. The coordinator always uses the defaults
     */
    bot_id?: number | "";
    harness?: "text" | "vision" | "transcription" | "speech" | "image" | "embedding" | "";
    /** 
     * harness_models row picked for this bot. Null picks automatically. Not a foreign key, like harness_settings
     */
    model_id?: number | "";
    /** 
     * harness_providers row this bot's harness is limited to. Null: any provider. Not a foreign key, like harness_settings
     */
    provider_id?: number | "";
    /** 
     * When the picked model fails, try the automatic picks
     */
    fallback?: 0 | 1 | "";
    /** 
     * 0 turns the harness off for this bot. Text is always on
     */
    enabled?: 0 | 1 | "";
    /** 
     * Harness options, e.g. {"voice":"george"} for speech
     */
    options?: string;
}

export type BUN_SQLITE_COBBLE_WORKSPACE_HARNESS_SETTINGS = {
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
     * The workspace
     */
    workspace_id?: number | "";
    harness?: "text" | "vision" | "transcription" | "speech" | "image" | "embedding" | "";
    /** 
     * harness_models row picked for this workspace. Null picks automatically. Not a foreign key, like harness_settings
     */
    model_id?: number | "";
    /** 
     * harness_providers row this workspace's harness is limited to. Null: any provider. Not a foreign key, like harness_settings
     */
    provider_id?: number | "";
    /** 
     * When the picked model fails, try the automatic picks
     */
    fallback?: 0 | 1 | "";
    /** 
     * 0 turns the harness off in this workspace. Text is always on
     */
    enabled?: 0 | 1 | "";
    /** 
     * Harness options, e.g. {"voice":"george"} for speech
     */
    options?: string;
}

export type BUN_SQLITE_COBBLE_MCP_SERVERS = {
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
    name?: string;
    /** 
     * Prefixes its tools' names (<slug>__<tool>). Unique
     */
    slug?: string;
    description?: string;
    transport?: "remote" | "stdio" | "";
    /** 
     * remote: the server's MCP endpoint
     */
    url?: string;
    /** 
     * remote: request headers, {"Authorization":"Bearer {{env.KEY}}"}. Values are templates
     */
    headers?: string;
    /** 
     * stdio: the command that starts the server, run with the host's shell in DATA_DIR/mcp/<id>
     */
    command?: string;
    /** 
     * stdio: installs what the command needs. Runs before the first start and again whenever it changes
     */
    setup_command?: string;
    /** 
     * stdio: the only environment the server gets (besides PATH and HOME), {"GITHUB_TOKEN":"{{env.GITHUB_TOKEN}}"}. Values are templates
     */
    env?: string;
    /** 
     * Tool names (the server's own) bots don't get
     */
    excluded_tools?: string;
    /** 
     * The server's tools as last listed ([{name, description, input_schema}]). Runs build their tools from it and connect on the first call
     */
    tools_cache?: string;
    /** 
     * 1 gives it to every bot, the coordinator included
     */
    all_bots?: 0 | 1 | "";
    enabled?: 0 | 1 | "";
    status?: "untested" | "ok" | "error" | "";
    last_error?: string;
    /** 
     * Unix ms of the last tool listing
     */
    last_synced_at?: number | "";
    /** 
     * Who created it. Not a foreign key: it belongs to the install
     */
    user_id?: number | "";
}

export type BUN_SQLITE_COBBLE_CUSTOM_TOOLS = {
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
     * What the model calls it: snake_case, unique, never a built-in tool's name
     */
    name?: string;
    /** 
     * What the model reads to decide when to call it
     */
    description?: string;
    kind?: "http" | "script" | "prompt" | "";
    /** 
     * JSON schema (an object) of its arguments
     */
    parameters?: string;
    /** 
     * Per kind. http: {method, url, headers, body, timeout_ms}; script: {language, code, timeout_ms}; prompt: {prompt}. Text fields are templates ({{args.x}}, {{env.KEY}})
     */
    config?: string;
    /** 
     * 1 gives it to every bot, the coordinator included
     */
    all_bots?: 0 | 1 | "";
    enabled?: 0 | 1 | "";
    /** 
     * How its last run went (a bot's call or a try). Reset to untested when it's edited
     */
    status?: "untested" | "ok" | "error" | "";
    last_error?: string;
    /** 
     * Unix ms of its last run
     */
    last_checked_at?: number | "";
    /** 
     * Who created it. Not a foreign key: it belongs to the install
     */
    user_id?: number | "";
}

export type BUN_SQLITE_COBBLE_BOT_MCP_SERVERS = {
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
    mcp_server_id?: number | "";
}

export type BUN_SQLITE_COBBLE_WORKSPACE_MCP_SERVERS = {
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
    mcp_server_id?: number | "";
}

export type BUN_SQLITE_COBBLE_BOT_CUSTOM_TOOLS = {
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
    custom_tool_id?: number | "";
}

export type BUN_SQLITE_COBBLE_WORKSPACE_CUSTOM_TOOLS = {
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
    custom_tool_id?: number | "";
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

export type BUN_SQLITE_COBBLE_USER_PRESENCE = {
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
     * The user. One row each
     */
    user_id?: number | "";
    /** 
     * Unix timestamp of the last open socket or keepalive, for skipping push notifications while the app is open
     */
    last_seen_at?: number | "";
}

export type BUN_SQLITE_COBBLE_PUSH_SUBSCRIPTIONS = {
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
     * The user the device belongs to
     */
    user_id?: number | "";
    /** 
     * The push service URL the browser gave. Unique: one device, one row
     */
    endpoint?: string;
    /** 
     * The subscription's public key
     */
    p256dh?: string;
    /** 
     * The subscription's auth secret
     */
    auth?: string;
    /** 
     * What the device said it was, for the settings list
     */
    user_agent?: string;
    /** 
     * The browser's platform, for the settings list
     */
    platform?: string;
    /** 
     * Unix timestamp of the last notification sent to it
     */
    last_used_at?: number | "";
    /** 
     * Why the last send failed, if it did
     */
    last_error?: string;
}

export type BUN_SQLITE_COBBLE_ENVS = {
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
     * Variable name. One per key and scope (enforced in saveEnv: SQLite unique constraints treat NULL ids as distinct)
     */
    key?: string;
    /** 
     * Encrypted env value.
     */
    value?: string;
    /** 
     * Env description. Can be searched. Bots see it beside the key, never the value
     */
    description?: string;
    /** 
     * Where it applies: general, a workspace, or a computer. Computer beats workspace beats general
     */
    paradigm?: "general" | "workspace" | "computer" | "";
    /** 
     * The workspace, for paradigm workspace
     */
    workspace_id?: number | "";
    /** 
     * The computer, for paradigm computer
     */
    computer_id?: number | "";
    /** 
     * 1 hides the value once saved (only replaced, never shown) and redacts it from everything bots read
     */
    secret?: 0 | 1 | "";
    /** 
     * 1 puts it in the shell of every computer it applies to. App settings (EnvDict) never are
     */
    expose_to_computers?: 0 | 1 | "";
}

export type BUN_SQLITE_COBBLE_BOT_FILES = {
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
     * The bot that wrote or received it. Goes with the bot
     */
    bot_id?: number | "";
    /** 
     * Which directory it's in: a bot's own or a workspace's shared one
     */
    scope?: "bot" | "workspace" | "";
    /** 
     * The bot id (scope bot) or workspace id (scope workspace) owning the directory. Not a foreign key, so a row outlives a workspace but its files are cleaned up with it
     */
    owner_id?: number | "";
    /** 
     * The private `media` row holding the bytes. Not a foreign key: the catalog row can outlive it (a failed cleanup) and is then listed as missing
     */
    media_id?: number | "";
    /** 
     * Path inside the directory, forward slashes, e.g. reports/q3.md
     */
    path?: string;
    name?: string;
    /** 
     * The folder part of `path`, empty at the top
     */
    folder?: string;
    mime_type?: string;
    media_type?: "image" | "video" | "document" | "audio" | "";
    /** 
     * Bytes on disk
     */
    size?: number | "";
    /** 
     * What it is for: an upload, something the bot wrote, a generated image or PDF
     */
    purpose?: "upload" | "writing" | "image" | "pdf" | "artifact" | "";
    /** 
     * How it got here: the user attached it to a message, the bot wrote it, or a tool made it
     */
    source?: "chat-upload" | "bot-write" | "tool" | "";
    /** 
     * When its text was chunked and embedded. Null: not ingested (yet)
     */
    ingested_at?: number | "";
    /** 
     * Why the last ingestion failed, when it did
     */
    ingest_error?: string;
}

export type BUN_SQLITE_COBBLE_BOT_FILE_CHUNKS = {
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
    file_id?: number | "";
    scope?: "bot" | "workspace" | "";
    /** 
     * The bot or workspace the file belongs to, so a search filters without a join
     */
    owner_id?: number | "";
    chunk_index?: number | "";
    text?: string;
    /** 
     * A rough count (characters / 4), for trimming results
     */
    token_estimate?: number | "";
}

export type BUN_SQLITE_COBBLE_BOT_FILE_VECTORS = {
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
     * Normalized, padded or cut to `AppData.EmbeddingDimensions`
     */
    embedding?: Float32Array<ArrayBuffer> | Buffer<ArrayBuffer> | null;
    chunk_id?: number | "";
    file_id?: number | "";
    scope?: string;
    owner_id?: number | "";
}

export type BUN_SQLITE_COBBLE_FILE_INGEST_QUEUE = {
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
     * The `bot_files` row to (re)ingest
     */
    file_id?: number | "";
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

export type BUN_SQLITE_COBBLE_APP_SETTINGS = {
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
    key?: string;
    value?: string;
}

export type BUN_SQLITE_COBBLE_ALL_TYPEDEFS = BUN_SQLITE_COBBLE_USERS & BUN_SQLITE_COBBLE_USER_TYPES & BUN_SQLITE_COBBLE_SSO_LOGIN_CODES & BUN_SQLITE_COBBLE_USER_PASSWORDS & BUN_SQLITE_COBBLE_MEDIA & BUN_SQLITE_COBBLE_MEDIA_PARADIGMS & BUN_SQLITE_COBBLE_BOTS & BUN_SQLITE_COBBLE_BOT_SESSIONS & BUN_SQLITE_COBBLE_BOT_MESSAGES & BUN_SQLITE_COBBLE_BOT_MESSAGE_REACTIONS & BUN_SQLITE_COBBLE_BOT_TASKS & BUN_SQLITE_COBBLE_BOT_TASK_STEPS & BUN_SQLITE_COBBLE_BOTS_QUEUE & BUN_SQLITE_COBBLE_BOTS_QUEUE_UPDATES & BUN_SQLITE_COBBLE_CRON_JOBS & BUN_SQLITE_COBBLE_WORKSPACES & BUN_SQLITE_COBBLE_WORKSPACE_BOTS & BUN_SQLITE_COBBLE_WORKSPACE_USERS & BUN_SQLITE_COBBLE_BOT_USERS & BUN_SQLITE_COBBLE_BOT_USER_MEMORIES & BUN_SQLITE_COBBLE_BOT_USER_FACES & BUN_SQLITE_COBBLE_BOT_MESSAGE_MEDIA & BUN_SQLITE_COBBLE_CONTAINERS & BUN_SQLITE_COBBLE_COMPUTERS & BUN_SQLITE_COBBLE_BOT_COMPUTERS & BUN_SQLITE_COBBLE_WORKSPACE_COMPUTERS & BUN_SQLITE_COBBLE_HARNESS_PROVIDERS & BUN_SQLITE_COBBLE_HARNESS_MODELS & BUN_SQLITE_COBBLE_HARNESS_SETTINGS & BUN_SQLITE_COBBLE_BOT_HARNESS_SETTINGS & BUN_SQLITE_COBBLE_WORKSPACE_HARNESS_SETTINGS & BUN_SQLITE_COBBLE_MCP_SERVERS & BUN_SQLITE_COBBLE_CUSTOM_TOOLS & BUN_SQLITE_COBBLE_BOT_MCP_SERVERS & BUN_SQLITE_COBBLE_WORKSPACE_MCP_SERVERS & BUN_SQLITE_COBBLE_BOT_CUSTOM_TOOLS & BUN_SQLITE_COBBLE_WORKSPACE_CUSTOM_TOOLS & BUN_SQLITE_COBBLE_LOGS & BUN_SQLITE_COBBLE_USER_PRESENCE & BUN_SQLITE_COBBLE_PUSH_SUBSCRIPTIONS & BUN_SQLITE_COBBLE_ENVS & BUN_SQLITE_COBBLE_BOT_FILES & BUN_SQLITE_COBBLE_BOT_FILE_CHUNKS & BUN_SQLITE_COBBLE_BOT_FILE_VECTORS & BUN_SQLITE_COBBLE_FILE_INGEST_QUEUE & BUN_SQLITE_COBBLE_APP_SETTINGS