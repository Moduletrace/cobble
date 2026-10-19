import { SiteData } from "./site-data";

export const AppData = {
    HashCost: 12,
    /**
     * Shared with twui's `ColorSchemeSelector`, so it must stay `theme`.
     */
    ThemeStorageKey: "theme",
    ServerHealthMessage: "Server Running Well",
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
     * Docker network shared by the main container and every computer. The
     * installer creates it, and the main computer's container on it.
     */
    DockerNetworkName: SiteData["SiteSlug"],
    MainComputerContainerName: `${SiteData["SiteSlug"]}-computer`,
    /**
     * Port the AIO sandbox listens on inside its container.
     */
    ComputerPort: 8080,
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
     * How much of the conversation a bot sees when it replies.
     */
    BotReplyHistoryMessages: 40,
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
} as const;
