import { SiteData } from "./site-data";

export const AppData = {
    HashCost: 12,
    /**
     * Shared with twui's `ColorSchemeSelector`, so it must stay `theme`.
     */
    ThemeStorageKey: "theme",
    /**
     * Prefix of the composer's unsent drafts in `localStorage`, one per
     * bot and workspace.
     */
    ComposerDraftStorageKey: `${SiteData["SiteSlug"]}_composer_draft`,
    ServerHealthMessage: "Server Running Well",
    /**
     * Where a device downloads the local CA that signed the app's
     * certificate, so it can trust it (`serveLocalCa`): the certificate
     * and an iOS/macOS profile that installs it, and the names they
     * download as. Only served with TLS and `TLS_CA_FILE`.
     */
    TlsCaPath: "/ca.crt",
    TlsCaFilename: `${SiteData["SiteSlug"]}-ca.crt`,
    TlsCaProfilePath: "/ca.mobileconfig",
    TlsCaProfileFilename: `${SiteData["SiteSlug"]}-ca.mobileconfig`,
    AuthKeyCookieName: `${SiteData["SiteSlug"]}_auth_key`,
    AuthCSRFCookieName: `${SiteData["SiteSlug"]}_auth_csrf`,
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
     * A model that rate limits or fails is skipped for this long, unless
     * the provider says when to come back (capped at the max).
     */
    HarnessCooldownMs: 60 * 1000,
    HarnessMaxCooldownMs: 24 * 60 * 60 * 1000,
    /**
     * Model turns in one text run before it must stop and report.
     */
    HarnessMaxToolSteps: 30,
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
     * Most of a bot message read aloud; the rest is cut.
     */
    SpeechMaxChars: 4000,
    /**
     * What a speech model reads when a voice is tried in the model settings.
     */
    VoicePreviewText: "Hi there. This is how I'll sound when I read my replies aloud.",
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
} as const;
