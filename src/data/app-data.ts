import { SiteData } from "./site-data";

export const AppData = {
    HashCost: 12,
    /**
     * Shared with twui's `ColorSchemeSelector`, so it must stay `theme`.
     */
    ThemeStorageKey: "theme",
    /**
     * How many of a build's files the loading page downloads at once.
     */
    PrecacheConcurrency: 6,
    /**
     * How many more times the loading page downloads files it finds
     * missing from the cache after a pass, before it gives up on them.
     */
    PrecacheVerifyPasses: 2,
    /**
     * How long the loading page waits for a new service worker to take
     * over before it reloads into the app anyway.
     */
    PrecacheWorkerWaitMs: 10_000,
    /**
     * The loading page gives up and lets the app run from the network
     * when no new file lands for this long.
     */
    PrecacheStallMs: 30_000,
    /**
     * Prefix of the composer's unsent drafts in `localStorage`, one per
     * bot and workspace.
     */
    ComposerDraftStorageKey: `${SiteData["SiteSlug"]}_composer_draft`,
    /**
     * Prefix of the chat header's model data in `localStorage`: one catalog
     * per user, and one small setting per bot and workspace.
     * `HarnessCatalogCacheMs` is how long the catalog is shown before it is
     * fetched again, `HarnessOverviewCacheMs` the setting.
     */
    HarnessCacheStorageKey: `${SiteData["SiteSlug"]}_harness_cache`,
    HarnessCatalogCacheMs: 60 * 60 * 1000,
    /**
     * The per-conversation key an older version wrote. Removed on logout
     * and by `clearHarnessCache`.
     */
    LegacyHarnessOverviewStorageKey: `${SiteData["SiteSlug"]}_harness_overview`,
    HarnessOverviewCacheMs: 10 * 60 * 1000,
    ServerHealthMessage: "Server Running Well",
    AuthKeyCookieName: `${SiteData["SiteSlug"]}_auth_key`,
    AuthCSRFCookieName: `${SiteData["SiteSlug"]}_auth_csrf`,
    /**
     * The build this browser has been through the loading page for
     * (`handlePrecacheGate`). Set by the page itself, so not `HttpOnly`;
     * it holds nothing private.
     */
    BuildCookieName: `${SiteData["SiteSlug"]}_build`,
    BuildCookieMaxAgeSeconds: 365 * 24 * 60 * 60,
    /**
     * The bot this browser was last in: `/admin/bots` opens its own chat
     * again, falling back to the coordinator (super admin) or the latest
     * bot when the grant is gone. One small id. `HttpOnly`: only the server
     * reads it.
     */
    LastVisitedBotCookieName: `${SiteData["SiteSlug"]}_last_visited_bot_id`,
    LastVisitedCookieMaxAgeSeconds: 365 * 24 * 60 * 60,
    AuthExpiryDays: 60,
    APICrudBasePath: "/api/admin/crud",
    ForcePrivateHeaderKey: `x-${SiteData["SiteSlug"]}-force-private`,
    ForcePublicHeaderKey: `x-${SiteData["SiteSlug"]}-force-public`,
    DefaultQueryLimit: 40,
    MainImageSize: 500,
    MaxImageWidth: 1500,
    ImageThumbnailSize: 150,
    ImageQuality: 85,
    ImageThumbnailQuality: 70,
    PaystackEndpoint: "https://api.paystack.co",
    ContactFormLimit: 5,
    RateLimitWindowMinutes: 15,
    UsernameRegex: /^[a-z0-9._-]{3,32}$/,
    PasswordMinLength: 8,
    PasswordMaxLength: 128,
    PasswordAttemptLimit: 10,
    /**
     * Docker network shared by the app and every computer. The app makes
     * sure it exists on startup and before it creates a container, and
     * joins it when it runs in docker.
     */
    DockerNetworkName: SiteData["SiteSlug"],
    /**
     * Port the AIO sandbox listens on inside its container.
     */
    ComputerPort: 8080,
    /**
     * Every computer the app creates runs this image, named
     * `<ComputerContainerPrefix>-<computer id>` on `DockerNetworkName`.
     */
    ComputerImage: "ghcr.io/agent-infra/sandbox:latest",
    ComputerContainerPrefix: `${SiteData["SiteSlug"]}-computer`,
    /**
     * A computer's home directory (`ComputerHomeDir` in its container) is
     * kept at `DATA_DIR/<ComputerDataDir>/<id>`, owned by the sandbox's
     * user. It stays when the computer is deleted.
     */
    ComputerDataDir: "computers",
    ComputerHomeDir: "/home/gem",
    ComputerUserUid: 1000,
    ComputerUserGid: 1000,
    /**
     * Resources a new computer's container gets, saved on the computer
     * (`cpus`, `memory_mb`) when it is created.
     */
    ComputerDefaultCpus: 1,
    ComputerDefaultMemoryMb: 2048,
    ComputerMinCpus: 0.25,
    ComputerMaxCpus: 64,
    ComputerMinMemoryMb: 512,
    /**
     * Docker's health check on every computer container: the sandbox's API
     * on `ComputerPort` and its browser answer. A new computer stays
     * `creating` until it passes, for at most `ComputerHealthyTimeoutMs`,
     * checked every `ComputerHealthPollMs`.
     */
    ComputerHealthcheck: {
        IntervalSeconds: 5,
        TimeoutSeconds: 5,
        StartPeriodSeconds: 120,
        Retries: 3,
    },
    ComputerHealthyTimeoutMs: 5 * 60 * 1000,
    ComputerHealthPollMs: 2000,
    /**
     * How long docker gives a computer's container to stop before it is
     * killed, when it is removed or recreated.
     */
    ComputerStopTimeoutSeconds: 10,
    /**
     * A computer is reached at its hostname, else its IP address. Each
     * address gets this long to answer, and the one that did is reused
     * for `ComputerAddressCacheMs`.
     */
    ComputerReachTimeoutMs: 2000,
    ComputerAddressCacheMs: 60 * 1000,
    /**
     * Per computer container.
     */
    ComputerShmBytes: 2 * 1024 * 1024 * 1024,
    /**
     * The docker engine API, reached over its unix socket.
     */
    DockerSocketPath: "/var/run/docker.sock",
    /**
     * Cap on a bot's `system_prompt` and `memory`, and on a workspace's
     * `system_prompt`, so self-updates can't grow a prompt without bound.
     */
    PromptMaxLength: 20000,
    /**
     * `bots_queue` (bun-sqlite `isQueue`). A job that hasn't sent an update
     * within the lock timeout is presumed lost and goes back to the queue,
     * so long computer jobs must call `updateBotJob` more often than this.
     */
    BotQueueMaxAttempts: 3,
    BotQueueLockTimeoutMs: 10 * 60 * 1000,
    BotQueueBackoffMs: 30 * 1000,
    /**
     * One attempt of a job (one model run or task, tools included) gives up
     * after this long and counts as a failed try, so a call that hangs
     * without ever answering can't hold the job, its computer or the
     * conversation forever. The lock is outlived by the heartbeat, so this
     * is the only thing that stops a live but stuck run.
     */
    BotJobAttemptTimeoutMs: 60 * 60 * 1000,
    /**
     * A failed scheduled run is tried again after this, doubling each time
     * (`scheduledRunRetryAt`), so a short outage doesn't sink the run.
     */
    ScheduledRunRetryMs: 5 * 60 * 1000,
    /**
     * The queue handler's lock name. Stable across restarts, so on startup
     * it can release the jobs it was running when the process stopped.
     */
    BotQueueWorker: "main",
    BotQueuePollMs: 3000,
    /**
     * Tasks run at once. Tasks on the same computer always run one at a time.
     */
    BotQueueConcurrency: 3,
    /**
     * Chat replies run at once, on their own slots so they never wait
     * behind long tasks. One per bot at a time.
     */
    BotQueueReplyConcurrency: 3,
    /**
     * Finished jobs are deleted after this many days.
     */
    BotQueueRetentionDays: 30,
    /**
     * A bot's schedules (`cron_jobs`): how many it can have, and the
     * shortest gap between two runs, so a schedule can't flood the queue.
     */
    CronJobMaxPerBot: 20,
    CronJobMinIntervalMs: 5 * 60 * 1000,
    /**
     * Due schedules queued per tick of the `run-cron-jobs` cron.
     */
    CronJobBatchSize: 50,
    /**
     * Tasks (the crew's to-do list, `tasks`): the longest title, brief and
     * note, how many one bot or workspace can hold, and how many files one
     * task carries.
     */
    TaskTitleMaxLength: 120,
    TaskDescriptionMaxLength: 8000,
    TaskNoteMaxLength: 2000,
    TaskMaxPerScope: 200,
    TaskMediaMaxPerTask: 20,
    /**
     * Open tasks a chat reply carries as a digest for its reminder, and how
     * many `list_tasks` hands back at once.
     */
    TaskReminderDigestCount: 3,
    TaskListToolLimit: 20,
    /**
     * Automatic model picks (`rankAutoModels`). A free model from outside
     * `AutoModelVendorPreference` must have at least this much context, and
     * this intelligence index or, unscored, this many billion parameters.
     */
    HarnessAutoMinContext: 32000,
    HarnessAutoMinScore: 12,
    HarnessAutoMinSizeB: 20,
    /**
     * Models tried per harness call before giving up (pinned plus
     * automatic fallbacks).
     */
    HarnessMaxCandidates: 5,
    HarnessRequestTimeoutMs: 3 * 60 * 1000,
    /**
     * One tool call gives up after this long, whatever the tool is (bot
     * tools, MCP servers, computers, custom tools), so a tool that ignores
     * its own limits can't stall the run. Its result comes back as an error
     * the model can work around.
     */
    HarnessToolTimeoutMs: 10 * 60 * 1000,
    /**
     * A model that rate limits or fails is skipped for this long, unless
     * the provider says when to come back (capped at the max).
     */
    HarnessCooldownMs: 60 * 1000,
    HarnessMaxCooldownMs: 24 * 60 * 60 * 1000,
    /**
     * Model turns in one text run before it must stop and report.
     */
    HarnessMaxToolSteps: 50,
    /**
     * Longest tool result handed back to the model.
     */
    HarnessToolResultMaxChars: 20000,
    /**
     * Upload cap for audio sent to transcription.
     */
    HarnessMaxAudioBytes: 25 * 1024 * 1024,
    /**
     * Connecting to an MCP server (a computer) gives up after this long.
     */
    McpConnectTimeoutMs: 15 * 1000,
    /**
     * One MCP tool call gives up after this long without progress.
     */
    McpToolTimeoutMs: 5 * 60 * 1000,
    /**
     * MCP servers set up in Settings, under MCPs: a stdio server runs in
     * `DATA_DIR/<McpDataDir>/<id>` (its setup installs there, so it
     * survives updates), its setup command may take `McpSetupTimeoutMs`,
     * and it's stopped after `McpStdioIdleMs` without a call.
     */
    McpDataDir: "mcp",
    McpSetupTimeoutMs: 10 * 60 * 1000,
    McpStdioIdleMs: 10 * 60 * 1000,
    /**
     * A custom tool (Settings, under Tools) gives up after its own timeout,
     * `CustomToolDefaultTimeoutMs` when it has none, never past
     * `CustomToolMaxTimeoutMs`.
     */
    CustomToolDefaultTimeoutMs: 60 * 1000,
    CustomToolMaxTimeoutMs: 10 * 60 * 1000,
    /**
     * Skills (Settings, under Skills): how long one's body may be, and how
     * much of it `load_skill` hands back in one call. A runbook past that
     * is worth splitting into two skills.
     */
    SkillBodyMaxChars: 60000,
    SkillBodyShownChars: 30000,
    SkillDescriptionMaxChars: 300,
    /**
     * `search_computers`: how long the command may run on each computer,
     * and how much of each computer's output the bot reads.
     */
    ComputerSearchTimeoutMs: 30 * 1000,
    ComputerSearchMaxOutputChars: 4000,
    /**
     * How many of a job's latest steps (`bots_queue_updates`) the
     * working-on panel shows.
     */
    BotJobUpdatesShown: 12,
    /**
     * How often each server process reads new bot messages, job steps and
     * bot changes from the database for its own sockets (`liveRelay`).
     */
    LiveRelayPollMs: 1500,
    /**
     * While a reply is due in the open conversation, how often the page
     * checks for new messages itself, in case a live push was missed (the
     * socket was down) and the thinking row would otherwise stay up.
     */
    BotReplyCatchUpMs: 5000,
    /**
     * How many of a session's latest messages that check reads.
     */
    BotReplyCatchUpMessages: 20,
    /**
     * How much of the conversation a bot sees when it replies.
     */
    BotReplyHistoryMessages: 40,
    /**
     * How many of a session's latest messages the conversation page
     * renders with; older ones load as the thread is scrolled up.
     */
    ConversationFirstMessages: 30,
    /**
     * How many older messages each scroll to the top of the thread loads.
     */
    ConversationOlderMessages: 30,
    /**
     * How much of a bot's last message the rail's lists carry, as plain
     * text (`messagePreview`): a row shows one line of it.
     */
    RailPreviewMaxChars: 160,
    /**
     * A session with this many messages is closed when the user writes
     * again, and the message starts the next one (carrying a summary).
     */
    BotSessionMaxMessages: 120,
    /**
     * How much of a closed session the bot reads to summarize it, and how
     * long the summary may be.
     */
    BotSessionSummaryMessages: 80,
    BotSessionSummaryMaxChars: 4000,
    /**
     * The first messages of a session the bot reads to name and summarize
     * it once the first reply is in, and how long its title may be.
     */
    BotSessionNameMessages: 4,
    BotSessionTitleMaxChars: 80,
    /**
     * Sessions listed per page in a conversation's sessions modal.
     */
    BotSessionsPageSize: 30,
    /**
     * Worker bots the rail lists, most recently active first, before
     * "See all bots".
     */
    RailRecentBots: 5,
    /**
     * Workspaces the rail lists, most recently active first, before
     * "See all workspaces".
     */
    RailRecentWorkspaces: 5,
    /**
     * Stones shown beside "See all bots" and "See all workspaces".
     */
    RailSeeAllStones: 3,
    /**
     * Recent sessions the rail lists under the open bot, before "All
     * sessions".
     */
    RailRecentSessions: 5,
    /**
     * Recent sessions a workspace's dashboard shows.
     */
    WorkspaceActivityItems: 6,
    /**
     * Tool turns a chat reply may take. Long work goes to a task instead.
     */
    BotReplyMaxToolSteps: 8,
    /**
     * Chat attachments: per file, per message, and how much of a
     * document's text a reply reads.
     */
    BotAttachmentMaxBytes: 20 * 1024 * 1024,
    BotAttachmentMaxFiles: 6,
    BotAttachmentMaxTextChars: 20000,
    /**
     * Only this many of the latest messages with files hand the files
     * themselves to a reply; older ones are named.
     */
    BotReplyAttachmentMessages: 4,
    /**
     * Longest dictation the composer records before it stops on its own.
     */
    ComposerVoiceMaxMs: 5 * 60 * 1000,
    /**
     * Most bots or workspaces the composer's mention menu lists at once.
     */
    ComposerMentionMaxItems: 6,
    /**
     * How long a message's copy button shows a check after it copied the
     * message, before it goes back to the copy icon.
     */
    CopyConfirmationMs: 1500,
    /**
     * Most of a bot message read aloud; the rest is cut.
     */
    SpeechMaxChars: 4000,
    /**
     * Bot files: a bot's own directory and a workspace's shared one live
     * under `DATA_DIR` (`DATA_DIR/bots/<id>`, `DATA_DIR/workspaces/<id>`),
     * on the data volume, never on a computer.
     */
    BotDataDir: "bots",
    WorkspaceDataDir: "workspaces",
    /**
     * The per-owner quota when the General settings page has none saved.
     */
    BotFileQuotaMb: 1024,
    /**
     * One file a bot writes in one call, and the most of a file a read
     * hands back at once (the rest comes with an offset).
     */
    BotFileWriteMaxChars: 200_000,
    BotFileReadMaxChars: 40_000,
    BotFileListMaxItems: 200,
    BotFileNameMaxChars: 120,
    BotFilePathMaxChars: 400,
    /**
     * Most folders deep a path may go, so nothing buries a file.
     */
    BotFilePathMaxDepth: 8,
    /**
     * The files modal and the bot's file list: one page of them.
     */
    BotFilesPageSize: 50,
    /**
     * The files browser at `/admin/files`: how many entries one folder
     * shows, and the most of a file it hands back at once.
     */
    StorageBrowserPageSize: 200,
    StorageBrowserReadMaxBytes: 50 * 1024 * 1024,
    /**
     * The most a bot copies off a computer into its own files in one
     * call, so a folder of raw evidence can't fill the data volume.
     */
    BotFileImportMaxBytes: 20 * 1024 * 1024,
    /**
     * Ingesting a bot file: how much text one chunk holds, how much of the
     * previous chunk it repeats, and the largest file it reads at all.
     */
    ChunkTargetChars: 1200,
    ChunkOverlapChars: 200,
    IngestMaxBytes: 20 * 1024 * 1024,
    /**
     * The fixed width of every vector, whatever the embedding model
     * returns: shorter vectors are padded with zeros and longer ones cut,
     * then all are normalized. Changing it needs
     * `bunx bun-sqlite schema --vector` and a full re-ingest.
     */
    EmbeddingDimensions: 1536,
    /**
     * Texts sent to the embedding model per call, and per run of the
     * ingestion worker.
     */
    EmbeddingBatchSize: 32,
    EmbeddingMaxInputChars: 8000,
    /**
     * How many chunks a file search returns, and how many more it asks
     * the vector index for before filtering to the run's scopes.
     */
    RagTopChunks: 8,
    RagOverFetch: 4,
    RagMaxK: 60,
    FileIngestPollMs: 5000,
    FileIngestConcurrency: 2,
    FileIngestWorker: "ingest",
    FileIngestMaxAttempts: 2,
    /**
     * What a speech model reads when a voice is tried in the model settings.
     */
    VoicePreviewText:
        "Hi there. This is how I'll sound when I read my replies aloud.",
    /**
     * Largest picture a bot or a workspace can have.
     */
    ProfileImageMaxBytes: 5 * 1024 * 1024,
    /**
     * A user with an open socket seen this recently gets no push: they
     * are already looking at the app.
     */
    PushPresenceWindowMs: 45_000,
    /**
     * A notification's body is one line, cut here.
     */
    PushBodyMaxChars: 140,
    /**
     * How long a push service may hold a notification for a device that
     * is offline.
     */
    PushTtlSeconds: 60 * 60,
    /**
     * Whole-data archives (Settings > Backups): the file name prefix and
     * how many of them are kept, newest first. They live outside
     * `DATA_DIR` (`BACKUP_ARCHIVE_DIR`), never in the database's own
     * `db/.backups` directory, which keeps its bun-sqlite snapshots.
     */
    DataBackupNamePrefix: "cobble-data-",
    DataBackupsKept: 5,
    /**
     * Responses smaller than this go out uncompressed: the encoding
     * costs more than it saves.
     */
    CompressMinBytes: 1024,
    /**
     * Brotli quality for page scripts and styles, compressed once per
     * file and kept in memory (`compressResponse`). 11 is about 25 times
     * slower for 10% less; 5 is close to 9's size at half the time.
     */
    CompressBrotliQuality: 5,
    /**
     * How many compressed page scripts and styles, and how many bytes of
     * them, stay in memory. A rebuild names its files anew, so the oldest
     * go first.
     */
    CompressCacheMaxFiles: 600,
    CompressCacheMaxBytes: 32 * 1024 * 1024,
} as const;
