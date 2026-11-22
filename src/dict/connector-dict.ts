/**
 * Who hosts a connector's app and its sign-in. Composio is the first: it
 * holds the OAuth apps (Gmail, Slack, ...) and the accounts users connect,
 * and hands a run an MCP endpoint per account. A provider is one file under
 * `src/harness/connectors/providers/` plus an entry here.
 *
 * The key is not here: one provider can be connected several times
 * (`connector_connections`), each with its own key (a personal account and a
 * work one), and each lists the apps that key holds.
 *
 * A connection's paradigm is this provider: it decides how that connection's
 * apps are reached. Composio is the first; another paradigm adds a file here
 * and an entry below.
 */
export const ConnectorProviders = [
    {
        title: "Composio",
        value: "composio",
        /**
         * Its catalog and its sessions answer here.
         */
        base_url: "https://backend.composio.dev/api/v3.1",
        /**
         * Where the account's project key is made. Shown beside the key field
         * so nobody has to guess which key a connection wants.
         */
        key_url: "https://dashboard.composio.dev/~/project/settings/api-keys",
        key_url_title: "Get a Composio project API key",
        /**
         * What kind of key it takes, said in the add form. A consumer key
         * (`ck_...`) works only for the hosted MCP at connect.composio.dev,
         * whose router signs everyone in as the key's owner, so it can't
         * back a connector that keeps one account per person.
         */
        key_help: "Paste a project API key (ak_...), not a key made for connect.composio.dev/mcp: that one belongs to the hosted MCP and can't keep an account per person.",
    },
] as const;

export type ConnectorProviderId = (typeof ConnectorProviders)[number]["value"];

/**
 * Where a connector applies. Global and workspace reach everyone; a bot
 * row is always personal to the user who made it.
 */
export const ConnectorTiers = [
    {
        title: "This bot, for me",
        value: "bot",
    },
    {
        title: "A workspace",
        value: "workspace",
    },
    {
        title: "Every bot",
        value: "global",
    },
] as const;

export type ConnectorTier = (typeof ConnectorTiers)[number]["value"];

/**
 * A connector's own state: never synced from its provider yet, ready (its
 * tools were listed), or an error the row's `last_error` explains.
 */
export const ConnectorStatuses = [
    {
        title: "Not synced yet",
        value: "untested",
    },
    {
        title: "Ready",
        value: "ready",
    },
    {
        title: "Error",
        value: "error",
    },
] as const;

export type ConnectorStatus = (typeof ConnectorStatuses)[number]["value"];

/**
 * One user's connection to an app: waiting for them to finish signing in,
 * connected, expired (the provider's token lapsed, so they reconnect), or
 * disconnected by them.
 */
export const ConnectorAccountStatuses = [
    {
        title: "Waiting for you",
        value: "pending",
    },
    {
        title: "Connected",
        value: "connected",
    },
    {
        title: "Needs reconnecting",
        value: "expired",
    },
    {
        title: "Disconnected",
        value: "revoked",
    },
] as const;

export type ConnectorAccountStatus = (typeof ConnectorAccountStatuses)[number]["value"];

/**
 * A connect link's state: waiting for the user to finish, connected,
 * expired before they did, or cancelled by them.
 */
export const ConnectorRequestStatuses = [
    {
        title: "Waiting for you",
        value: "pending",
    },
    {
        title: "Connected",
        value: "connected",
    },
    {
        title: "Expired",
        value: "expired",
    },
    {
        title: "Cancelled",
        value: "cancelled",
    },
] as const;

export type ConnectorRequestStatus = (typeof ConnectorRequestStatuses)[number]["value"];

/**
 * What separates a connector's slug from an account's in a tool name, when
 * a user has more than one account for that app:
 * `gmail-work__GMAIL_SEND_EMAIL`.
 */
export const ConnectorAccountSeparator = "-";
/**
 * The app setting that holds how many connector actions one run may take,
 * saved as a number of steps (`connectors_actions_per_run`).
 */
export const ConnectorActionsPerRunSettingKey = "connectors_actions_per_run";

/**
 * How a connection's apps are filtered. An app counts as connected when the
 * viewer can see a connected account for it, so the list leads with the apps
 * that are ready to use.
 */
export const ConnectorAppFilters = [
    {
        title: "All",
        value: "all",
    },
    {
        title: "Connected",
        value: "connected",
    },
    {
        title: "Unconnected",
        value: "unconnected",
    },
] as const;

export type ConnectorAppFilter = (typeof ConnectorAppFilters)[number]["value"];
