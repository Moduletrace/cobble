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
     * Jobs run at once. Jobs on the same computer always run one at a time.
     */
    BotQueueConcurrency: 3,
    /**
     * Finished jobs are deleted after this many days.
     */
    BotQueueRetentionDays: 30,
} as const;
