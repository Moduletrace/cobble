/**
 * What calls a hook: an outside service at its URL, or the watcher on a
 * computer forwarding that computer's browser notifications
 * (`syncComputerNotifyWatch`).
 */
export const BotHookSources = [
    { title: "Calls to its URL", value: "url" },
    { title: "Browser notifications on a computer", value: "browser_notifications" },
] as const;

export type BotHookSource = (typeof BotHookSources)[number]["value"];

/**
 * How a hook's sender writes its HMAC-SHA256 signature of the raw body in
 * the signature header: plain hex, GitHub's `sha256=<hex>`, or base64
 * (Shopify and others).
 */
export const BotHookSignatureFormats = [
    { title: "Hex", value: "hex" },
    { title: "sha256=hex (GitHub)", value: "sha256=hex" },
    { title: "Base64", value: "base64" },
] as const;

export type BotHookSignatureFormat = (typeof BotHookSignatureFormats)[number]["value"];

/**
 * What became of one call to a hook: it queued a run, joined a run still
 * waiting, was refused (a bad signature, a paused hook), repeated a call
 * already taken, or was a notification the hook's filter left out. Queued
 * and merged calls wait on their run, and turn answered or failed when it
 * ends (`recordHookCallResponse`), with its response.
 */
export const BotHookEventStatuses = [
    { title: "Queued", value: "queued" },
    { title: "Merged", value: "merged" },
    { title: "Answered", value: "done" },
    { title: "Failed", value: "failed" },
    { title: "Rejected", value: "rejected" },
    { title: "Duplicate", value: "duplicate" },
    { title: "Ignored", value: "ignored" },
] as const;

export type BotHookEventStatus = (typeof BotHookEventStatuses)[number]["value"];

/**
 * Every hook token starts with this, so a leaked one is easy to spot.
 */
export const BotHookTokenPrefix = "cbh_";

/**
 * The public path a hook is called at: `<BotHookPath>/<token>`.
 */
export const BotHookPath = "/api/hooks";

/**
 * Headers a sender may use to name a delivery, so a retried call isn't
 * run twice. The first one present wins.
 */
export const BotHookIdempotencyHeaders = [
    "idempotency-key",
    "x-github-delivery",
    "x-request-id",
    "x-webhook-id",
] as const;

/**
 * What a bot's hook proposal (`hook_proposals`) does once the user
 * confirms it: make a hook in the conversation it was proposed in, or
 * change one of theirs (its name, brief, filter, or switch it back on).
 * Pausing and deleting need no proposal: they only take away.
 */
export const HookProposalActions = [
    { title: "Add", value: "create" },
    { title: "Change", value: "change" },
] as const;

export type HookProposalAction = (typeof HookProposalActions)[number]["value"];

/**
 * The app setting (Settings > General) for how many days hook calls are
 * kept, else `AppData.BotHookEventsKeepDays`.
 */
export const HookEventsKeepDaysSettingKey = "hook_events_keep_days";
