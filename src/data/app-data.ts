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
    /**
     * The mode (`ComputerViewModes`) each computer was last viewed in on
     * this device, in `localStorage` (`rememberComputerViewMode`): the
     * next open starts there.
     */
    ComputerViewModeStorageKey: `${SiteData["SiteSlug"]}_computer_view_modes`,
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
     * How many extra docker networks the app's own container may join
     * (`app_extra_networks`, Settings > General). Computers never join them.
     */
    AppExtraNetworksMax: 16,
    /**
     * Port a computer's agent listens on inside its container: its shell
     * and file API, Playwright MCP (`/mcp`), its screen (`/desktop/`) and
     * its shell (`/terminal/`).
     */
    ComputerPort: 8080,
    /**
     * Every computer the app creates runs this image (built from
     * `computer/`), unless the `COMPUTER_IMAGE` app setting names another,
     * named `<ComputerContainerPrefix>-<computer id>` on `DockerNetworkName`.
     * Its tag is the image's version: bump it with any change under
     * `computer/` (the release workflow builds that tag), and bump
     * `ComputerWorkspaceLayout` too when existing computers must move to it.
     */
    ComputerImage: "ghcr.io/moduletrace/cobble-computer:1.3.0",
    ComputerContainerPrefix: `${SiteData["SiteSlug"]}-computer`,
    /**
     * Only a computer's workspace (`ComputerWorkspaceDir` in its
     * container) is kept, at `DATA_DIR/<ComputerDataDir>/<id>`, owned by
     * the computer's user, plus its browser profile
     * (`ComputerBrowserDataDir`). Both stay when the computer is deleted.
     * The rest of its home (`ComputerHomeDir`: dotfiles, the env files)
     * lives in the container and goes with it. Every bot works in
     * `bots/<bot id>` there, a user's work in `bots/<bot id>/users/<user
     * id>`, and a workspace's bots share `workspaces/<workspace id>`
     * (`computerRunDirs`).
     */
    ComputerDataDir: "computers",
    ComputerHomeDir: "/home/gem",
    ComputerWorkspaceDir: "/home/gem/workspace",
    /**
     * A computer's browser profile (cookies, logins, site permissions) is
     * kept at `DATA_DIR/<ComputerBrowserDataDir>/<id>`, outside its
     * workspace, and mounted at `ComputerBrowserProfileDir`, which Chrome
     * is pointed at with `--user-data-dir`.
     */
    ComputerBrowserDataDir: "computer-browsers",
    ComputerBrowserProfileDir: "/home/gem/.cobble-browser",
    /**
     * The managed policy file a computer's browser reads (Chrome's folder;
     * the image links Chromium's to it), written into the container by
     * `syncComputerBrowserPolicy`.
     */
    ComputerBrowserPolicyFile: "/etc/opt/chrome/policies/managed/cobble.json",
    /**
     * Where a computer's Playwright MCP writes what a browser tool saves
     * without a name (snapshots, console logs), outside every run's
     * folders: `withBrowserOutputs` turns those links into the tool that
     * reads them.
     */
    ComputerBrowserOutputDir: "/home/gem/.cobble/playwright",
    /**
     * Chrome saves downloads here itself (the seed prefs), since Playwright
     * attached over CDP leaves them to the browser. After each browser tool
     * call `withBrowserOutputs` moves finished ones into the run's
     * `ComputerDownloadsFolder`, so whichever run's call comes next on that
     * computer gets them (a download the user starts in the live view
     * included).
     */
    ComputerBrowserDownloadsDir: "/home/gem/Downloads",
    ComputerDownloadsFolder: "downloads",
    /**
     * Written at the root of a computer's workspace once it uses that
     * layout, so an older computer's whole home is told apart and moved
     * aside (`prepareComputerDataDir`).
     */
    ComputerWorkspaceMarker: ".cobble-workspace",
    /**
     * An older computer's whole home is moved aside to
     * `<id><ComputerOldHomeSuffix><timestamp>` and kept, never archived.
     */
    ComputerOldHomeSuffix: "-home-",
    /**
     * Recorded in a container's `metadata.layout`: the image and mounts it
     * was created with. A container with another value is recreated
     * (`migrateComputerLayout`), keeping its workspace and browser profile.
     * `cobble-computer` moved every computer off the AIO sandbox;
     * `cobble-computer-accounts` gave worker bots their own accounts (the
     * container gets `NET_ADMIN` to keep them off its services);
     * `cobble-computer-homes` has workers work in their own home
     * (`/home/cb-<bot>/workspace`, a link the agent keeps to their folder),
     * which an older agent would make a folder that isn't kept.
     */
    ComputerWorkspaceLayout: "cobble-computer-homes",
    ComputerUserUid: 1000,
    ComputerUserGid: 1000,
    /**
     * A worker's install request (`request_install`): at most this many
     * packages, a reason and notes this long, its answer this long.
     */
    InstallRequestMaxPackages: 20,
    InstallRequestReasonMaxChars: 1000,
    InstallRequestAnswerMaxChars: 2000,
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
     * Docker's health check on every computer container: its agent's
     * `/health`, which passes once the browser and its tools answer. A new computer stays
     * `creating` until it passes, for at most `ComputerHealthyTimeoutMs`,
     * checked every `ComputerHealthPollMs`.
     */
    ComputerHealthcheck: {
        IntervalSeconds: 5,
        TimeoutSeconds: 5,
        StartPeriodSeconds: 120,
        StartIntervalSeconds: 1,
        Retries: 3,
    },
    ComputerHealthyTimeoutMs: 5 * 60 * 1000,
    ComputerHealthPollMs: 2000,
    /**
     * A computer being set up or restarted (`creating`) has its container's
     * `updated_at` touched this often by the process doing it
     * (`keepComputerSetupAlive`). Untouched for `ComputerSetupStaleMs`, the
     * process is gone (the app restarted mid-way): the computer shows as
     * failed so it can be set up again, and `syncComputers` starts it
     * again (`computerSetupInterrupted`).
     */
    ComputerSetupHeartbeatMs: 30 * 1000,
    ComputerSetupStaleMs: 3 * 60 * 1000,
    /**
     * A layout migration (`migrateComputerLayout`) whose setup failed
     * while the old container kept running (an image that couldn't be
     * pulled) waits this long before it tries again
     * (`metadata.setup_failed_at`), instead of on every sync.
     */
    ComputerMigrateRetryMs: 60 * 60 * 1000,
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
     * Cap on a user's role in one workspace (`workspace_user_roles`), which
     * joins every prompt there when a bot works for them.
     */
    WorkspaceUserRoleMaxLength: 2000,
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
    /**
     * Chatrooms (a worker asking another through the coordinator): how many
     * turns the coordinator gets in one room, how deep rooms may nest (a
     * bot asked in a room asking someone else), how many rooms one bot may
     * have open at once for a user, and how many the rail lists.
     */
    ChatroomMaxCoordinatorTurns: 6,
    ChatroomMaxDepth: 2,
    ChatroomMaxOpenPerBot: 3,
    /**
     * How far back a run is shown the requests its bot made to the crew
     * from the same place (`grabCrewRequests`), and how many at most.
     */
    CrewRequestsRecentMs: 6 * 60 * 60 * 1000,
    CrewRequestsListed: 8,
    /**
     * Files a room's answer may have copied over to the bot that asked
     * (`shareRoomFiles`); refs past it are left as written.
     */
    ChatroomSharedFilesMax: 30,
    ChatroomCoordinatorMaxToolSteps: 6,
    ChatroomRailLimit: 8,
    /**
     * Closed chatrooms are deleted after this many days, and past this many
     * rooms in one place (a workspace, or bots' own chats) the oldest
     * closed ones go: the defaults, each with the most an install may set
     * (`chatroom_keep_days`, `chatroom_max_per_place`, Settings > General).
     */
    ChatroomKeepDays: 30,
    ChatroomKeepDaysMax: 3650,
    ChatroomMaxPerPlace: 200,
    ChatroomMaxPerPlaceMax: 10000,
    CronJobMinIntervalMs: 5 * 60 * 1000,
    /**
     * Due schedules queued per tick of the `run-cron-jobs` cron.
     */
    CronJobBatchSize: 50,
    /**
     * A bot's hooks (`bot_hooks`): how many one user gives one bot, the
     * largest body a call may send, how many calls a minute one hook and
     * one address may make, how many calls join one waiting run before
     * the next queues a run of its own, and how long calls are kept by
     * default (the install may set its own, `hook_events_keep_days`, up to
     * `BotHookEventsKeepDaysMax`).
     */
    BotHookMaxPerBot: 20,
    BotHookMaxPayloadBytes: 64 * 1024,
    BotHookRateLimit: 30,
    BotHookIpRateLimit: 120,
    BotHookMaxEventsPerRun: 20,
    BotHookEventsKeepDays: 30,
    BotHookEventsKeepDaysMax: 3650,
    /**
     * Logs (Activity) are deleted after this many days by the daily
     * `prune-logs` cron: the default, with the most an install may set
     * (`logs_keep_days`, Settings > General).
     */
    LogsKeepDays: 90,
    LogsKeepDaysMax: 3650,
    /**
     * How many hook calls a list loads at once, and how much of each call's
     * payload and response a list shows (the whole of both opens on one).
     */
    BotHookCallsPageSize: 20,
    BotHookCallPreviewChars: 400,
    /**
     * A call naming a delivery already taken this recently isn't run again.
     */
    BotHookIdempotencyWindowMs: 24 * 60 * 60 * 1000,
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
     * Models tried per harness call before giving up (the pick, its
     * fallback models, then automatic picks).
     */
    HarnessMaxCandidates: 6,
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
     * How long a model (or a provider, for a bad key or no credits) that
     * failed is passed over before it is tried again, provider's
     * `Retry-After` included. The install may save its own
     * (`harness_model_rest_seconds`, Settings > General), read through
     * `grabModelRestMs`. One failure once benched the pinned model for an
     * hour and every reply ran on a weak free model meanwhile.
     */
    HarnessModelRestMs: 2 * 60 * 1000,
    HarnessModelRestMinSeconds: 10,
    HarnessModelRestMaxSeconds: 60 * 60,
    /**
     * Models the text harness tries, in order, after its pick and before
     * the automatic free picks (`fallback_model_ids` in its options).
     */
    HarnessTextFallbackModelsMax: 3,
    /**
     * Model turns in one text run before it must stop and report. The
     * install may save its own limit (the `harness_max_tool_steps` setting,
     * Settings > General), which wins over this one; a task run reads it
     * through `grabHarnessMaxToolSteps`.
     */
    HarnessMaxToolSteps: 200,
    /**
     * Model turns a routine run or a hook call may take: nobody watches
     * them, and one routine run once spent 39M tokens checking a site. The
     * install may save its own (`unattended_max_tool_steps`), read through
     * `grabUnattendedMaxToolSteps`; a brief's own `max_steps` can only
     * lower it.
     */
    UnattendedMaxToolSteps: 40,
    /**
     * Prompt tokens one run may spend in all (every turn resends the
     * prompt): past it the next turn is the wrap up. A safety net under the
     * step limit, for runs whose turns are large. The install may save its
     * own (`run_max_prompt_tokens`), read through `grabRunMaxPromptTokens`.
     */
    RunMaxPromptTokens: 4_000_000,
    /**
     * The working context: how many tokens (estimated) of system prompt,
     * tool definitions and transcript a run sends per turn before old tool
     * output is trimmed, whatever the model's window. Every turn resends
     * all of it, so a run that only trims at a 1M window pays for its whole
     * history on every step. The install may save its own
     * (`harness_context_budget_tokens`), read through
     * `grabContextBudgetTokens`.
     */
    HarnessContextBudgetTokens: 80_000,
    /**
     * The least a saved working context may be: below it a run would trim
     * the output it is reading right now.
     */
    HarnessContextBudgetMinTokens: 20_000,
    HarnessContextBudgetMaxTokens: 1_000_000,
    /**
     * Run token budgets the settings page accepts.
     */
    RunMaxPromptTokensMin: 100_000,
    RunMaxPromptTokensMax: 100_000_000,
    /**
     * Longest tool result handed back to the model.
     */
    HarnessToolResultMaxChars: 20000,
    /**
     * Longest result of a browser tool (`browser_*`, the computer's or a
     * user's own browser): page snapshots and `browser_evaluate` output
     * were the heaviest results a run kept resending.
     */
    HarnessBrowserResultMaxChars: 12000,
    /**
     * Extension tools (MCP servers, a user's browsers) are listed by name
     * and loaded with `load_tools` only when their definitions together
     * pass this many characters; below it they're simply all given.
     */
    HarnessDeferToolsMinChars: 6000,
    /**
     * How much of a deferred tool's description its line in the list
     * shows.
     */
    HarnessDeferredToolLineChars: 140,
    /**
     * Images one tool call may hand back (the rest are dropped), and how
     * many of the newest tool images stay in a run's transcript: every
     * step resends them, so older screenshots give way to their reading
     * (when one was made) or a note.
     */
    HarnessToolMaxImages: 4,
    HarnessToolImagesKept: 3,
    /**
     * Steps left when a run is told, once, that it's nearly out, so it
     * saves its report before the wrap up ends it (two runs in a row once
     * ran out with the report unwritten). Only in runs of at least
     * `HarnessStepsLowMinSteps` steps, where the warning still leaves room
     * to act on it.
     */
    HarnessStepsLowWarning: 5,
    HarnessStepsLowMinSteps: 15,
    /**
     * Image readings kept across runs: one upload read once, not once per
     * reply (`media-readings`).
     */
    HarnessMediaReadingsCached: 100,
    /**
     * Upload cap for audio sent to transcription.
     */
    HarnessMaxAudioBytes: 25 * 1024 * 1024,
    /**
     * Reference images one `generate_image` call passes on, and the
     * largest each may be.
     */
    ImageReferenceMaxCount: 4,
    ImageReferenceMaxBytes: 10 * 1024 * 1024,
    /**
     * `generate_video`: the still images one call passes on (first and
     * last frame, or references to follow), the videos it passes to change
     * and the largest each video may be (sent inline, as a `data:` URL).
     */
    VideoImageMaxCount: 4,
    VideoSourceMaxCount: 2,
    VideoSourceMaxBytes: 30 * 1024 * 1024,
    /**
     * A video is made as a job at the provider: asked for, then checked on
     * every `VideoPollIntervalMs` until it's done, for at most
     * `VideoMaxWaitMs` (below `HarnessToolTimeoutMs`, so the tool call
     * gets to say what happened).
     */
    VideoPollIntervalMs: 10 * 1000,
    VideoMaxWaitMs: 8 * 60 * 1000,
    /**
     * `transform_image`: the largest source file and source (in pixels) it
     * opens, the longest side a result may have, the steps one call takes,
     * and the longest side of the preview the bot looks at afterwards.
     */
    ImageTransformMaxBytes: 25 * 1024 * 1024,
    ImageTransformMaxInputPixels: 100_000_000,
    ImageTransformMaxDimension: 8192,
    ImageTransformMaxOperations: 12,
    ImageTransformPreviewMaxSide: 1024,
    /**
     * Connecting to an MCP server (a computer) gives up after this long.
     */
    McpConnectTimeoutMs: 15 * 1000,
    /**
     * One MCP tool call gives up after this long without progress.
     */
    McpToolTimeoutMs: 5 * 60 * 1000,
    /**
     * A bash command on a computer (`computer_bash`) is killed there, with
     * everything it started, after at most this long, below
     * `HarnessToolTimeoutMs`.
     */
    ComputerCommandMaxSeconds: 270,
    /**
     * What a computer's command hands the bot back (its start and end), and
     * what `computer_read_file` reads: lines at a time, each line cut
     * past `ComputerReadFileMaxLineChars`, files up to
     * `ComputerReadFileMaxBytes`. `computer_write_file` and
     * `computer_edit_file` take files up to `ComputerWriteFileMaxChars`.
     */
    ComputerCommandMaxOutputChars: 40_000,
    ComputerReadFileMaxLines: 2000,
    ComputerReadFileMaxLineChars: 2000,
    ComputerReadFileMaxBytes: 10 * 1024 * 1024,
    ComputerWriteFileMaxChars: 5 * 1024 * 1024,
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
     * is worth splitting into two skills. These are the defaults: the
     * install sets its own on Settings > General (`skill_body_max_chars`,
     * `skill_body_shown_chars`, `grab-skill-limits.ts`), never past
     * `SkillBodyLimitMax`.
     */
    SkillBodyMaxChars: 60000,
    SkillBodyShownChars: 30000,
    SkillBodyLimitMax: 1000000,
    SkillDescriptionMaxChars: 300,
    /**
     * How long the super admin has to confirm an MCP server or tool the
     * coordinator proposed (`extension_proposals`). After that its card
     * reads expired and the bot has to propose it again, so a card left in
     * an old thread can't be confirmed weeks later.
     */
    ExtensionProposalTtlMs: 24 * 60 * 60 * 1000,
    /**
     * A proposal's background check: the bot's summary, and the sources it
     * read (at least one).
     */
    ExtensionResearchMinChars: 40,
    ExtensionResearchMaxChars: 6000,
    ExtensionResearchSourcesMax: 10,
    /**
     * `search_computers`: how long the command may run on each computer,
     * and how much of each computer's output the bot reads.
     */
    ComputerSearchTimeoutMs: 30 * 1000,
    ComputerSearchMaxOutputChars: 4000,
    /**
     * `capture_secret`: the longest value it saves (a file or a command's
     * output; longer is refused, never cut), and how long the command may
     * run.
     */
    CapturedSecretMaxChars: 8000,
    CaptureSecretTimeoutMs: 30 * 1000,
    /**
     * How many of a job's latest steps (`bots_queue_updates`) the
     * working-on panel shows.
     */
    BotJobUpdatesShown: 12,
    /**
     * How long a finished job's steps stay before they're cleared
     * (`clear-job-steps` cron). Long enough for every process's live relay
     * to have pushed the last ones (`LiveRelayPollMs`).
     */
    BotJobStepsKeepMs: 60 * 1000,
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
     * The most model calls a message's details modal lists one by one. A
     * long task can take hundreds; the totals still count every one.
     */
    MessageDetailsMaxCalls: 200,
    /**
     * The most model calls and failed calls a message's details report
     * lists one by one when it's copied (the Details modal's icon): a
     * whole report for a bug report, not only the first calls the modal
     * shows. The totals count every call either way.
     */
    MessageDetailsCopyMaxCalls: 2000,
    /**
     * The most characters of a provider's error kept on a failed model
     * call (`harness_call_failures.error`), shown in the message's details.
     */
    HarnessFailureErrorMaxChars: 2000,
    /**
     * Days of usage the usage page totals by default, and the most it will
     * total at once.
     */
    UsageDefaultDays: 30,
    UsageMaxDays: 365,
    /**
     * Models listed per page on the usage page, the busiest first.
     */
    UsageModelPageSize: 20,
    /**
     * How much of a bot's last message the rail's lists carry, as plain
     * text (`messagePreview`): a row shows one line of it.
     */
    RailPreviewMaxChars: 160,
    /**
     * A session with this many messages is closed when the user writes
     * again, and the message starts the next one (carrying a summary).
     * The install may save its own number (the `bot_session_max_messages`
     * setting, Settings > General), read through `grabBotSessionMaxMessages`.
     */
    BotSessionMaxMessages: 120,
    /**
     * The most messages a saved session length may ask for.
     */
    BotSessionMaxMessagesMax: 2000,
    /**
     * The longest chat message a user may send, in characters of the
     * composer's markdown (formatting and `[bot:ID]` refs count). The
     * install may save its own number (the `bot_message_max_chars`
     * setting, Settings > General), read through `grabBotMessageMaxChars`.
     */
    BotMessageMaxChars: 20000,
    /**
     * The most characters a saved message length may allow.
     */
    BotMessageMaxCharsMax: 200000,
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
     * What a bot's search of its earlier sessions in a conversation
     * (`search_past_sessions`) returns at most, and how much of each
     * message it shows around the match.
     */
    PastSessionSearchLimit: 20,
    PastSessionSnippetChars: 300,
    /**
     * Messages `read_past_session` returns per call, and how much of each.
     */
    PastSessionReadMessages: 20,
    PastSessionReadMessageChars: 2000,
    /**
     * Worker bots the rail lists, most recently visited first, before
     * "See all bots".
     */
    RailRecentBots: 5,
    /**
     * Workspaces the rail lists, most recently visited first, before
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
     * The install may save its own limit (the `bot_reply_max_tool_steps`
     * setting, Settings > General), which wins over this one; a reply
     * reads it through `grabReplyMaxToolSteps`.
     */
    BotReplyMaxToolSteps: 20,
    /**
     * From this many characters, a bot message whose run called no tools
     * shows "No tools used" under it (`MessageNoToolsChip`): a long report
     * with nothing behind it was made up, and the user acted on one.
     */
    MessageNoToolsMinChars: 400,
    /**
     * Messages a chat reply may send while it works (`send_message`):
     * acknowledging something the user wrote meanwhile, a heads-up. Its
     * answer still comes at the end.
     */
    BotReplyInterimMessagesMax: 3,
    /**
     * The most steps a saved run limit may ask for, for a task run or a
     * chat reply. A typo in the settings page can't turn one run into an
     * hour of tool calls, and a huge limit still ends with a report.
     */
    BotStepLimitMax: 1000,
    /**
     * Chat attachments: per file, per message, and how much of a
     * document's text a reply reads.
     */
    BotAttachmentMaxBytes: 20 * 1024 * 1024,
    BotAttachmentMaxFiles: 6,
    BotAttachmentMaxTextChars: 20000,
    /**
     * How much of a document's text is kept on its `media` row. A ceiling
     * on the column itself: without it a 20 MB PDF left 20 MB of text in
     * the database, even though a reply reads at most
     * `BotAttachmentMaxTextChars` of it.
     */
    BotAttachmentTextStoreMaxChars: 200000,
    /**
     * Only this many of the latest messages with files hand the files
     * themselves to a reply; older ones are named.
     */
    BotReplyAttachmentMessages: 4,
    /**
     * And only while they're within this many of the conversation's latest
     * messages: a file from far back is named, not re-attached, so one old
     * document isn't read from disk and resent in full on every reply of a
     * long session (images are cheap now: `MediaReadings` reads each once).
     */
    BotReplyAttachmentMaxAgeMessages: 20,
    /**
     * Longest HTML document a bot graphic (`bot_graphics`) may be.
     */
    BotGraphicMaxChars: 200000,
    /**
     * Tallest a graphic grows inline in the thread (px) before it scrolls
     * inside its frame.
     */
    BotGraphicInlineMaxHeight: 640,
    /**
     * Largest text file (markdown, CSV, plain text) the file preview reads
     * into the page (bytes); a bigger one is only offered to download.
     */
    FilePreviewMaxTextBytes: 2 * 1024 * 1024,
    /**
     * Most rows of a CSV the file preview draws.
     */
    FilePreviewMaxTableRows: 1000,
    /**
     * Most questions one `ask_user` card holds.
     */
    BotQuestionMaxQuestions: 6,
    /**
     * Most options one question offers (its "Other" not counted).
     */
    BotQuestionMaxOptions: 8,
    /**
     * Longest answer a user may type into a question's "Other".
     */
    BotQuestionOtherMaxChars: 1000,
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
     * Most folders deep the files browser opens: a computer's workspace
     * starts four down (`bots/<bot>/users/<user>`) before a bot's own
     * folders begin.
     */
    StorageBrowserMaxDepth: 16,
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
     * The database browser at `/admin/settings/database`: how many records
     * of a table one page shows, how much of a value a cell carries before
     * the rest waits behind its record's modal, and the most of one value
     * that modal shows (a whole media row or job checkpoint is not meant
     * to be rendered).
     */
    DatabaseBrowserPageSize: 50,
    DatabaseBrowserCellMaxChars: 400,
    DatabaseBrowserValueMaxChars: 20000,
    /**
     * The most words one search matches in the database browser.
     */
    DatabaseBrowserMaxSearchWords: 8,
    /**
     * The most a bot copies off a computer into its own files in one
     * call, so a folder of raw evidence can't fill the data volume.
     */
    BotFileImportMaxBytes: 20 * 1024 * 1024,
    /**
     * Ingesting a knowledgebase document: how much text one chunk holds,
     * how much of the previous chunk it repeats, and the largest file it
     * reads at all (also the largest attachment a reply reads).
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
     * How many chunks a knowledgebase search returns, and how many more it
     * asks the vector index for before filtering to the run's ones.
     */
    RagTopChunks: 8,
    RagOverFetch: 4,
    RagMaxK: 60,
    /**
     * How long a search box waits after the last keystroke before it
     * searches.
     */
    SearchDebounceMs: 250,
    /**
     * The database is vacuumed at boot once this share of its pages, and
     * at least this many bytes, sit free (after a big delete, such as the
     * bot file index being dropped).
     */
    DbVacuumMinFreeRatio: 0.2,
    DbVacuumMinFreeBytes: 4 * 1024 * 1024,
    /**
     * Knowledgebases: the most one document holds (an upload, or text
     * written in), how much of a pasted text a form takes, how many
     * passages a reply is handed before the bot asks for any (retrieved
     * for the newest user message), and how much of a document
     * `read_knowledgebase_document` hands back at once.
     */
    KnowledgebaseDocumentMaxBytes: 20 * 1024 * 1024,
    KnowledgebaseTextMaxChars: 200_000,
    KnowledgebaseAutoPassages: 4,
    KnowledgebaseReadMaxChars: 12_000,
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
     * Log entries a restore leaves in `DATA_DIR` for the next boot to
     * write (`queueBootLog`): written before the restart they would land
     * in the replaced database, which the process still has open.
     */
    PendingBootLogsFile: ".pending-boot-logs.json",
    /**
     * How often the backups page asks how a whole-data archive or restore
     * is going, and how long it waits for the app to come back after a
     * restore restarted it before it reloads anyway.
     */
    DataBackupPollMs: 2000,
    DataRestoreWaitMs: 120000,
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

    DefaultIconSize: 16,
} as const;
