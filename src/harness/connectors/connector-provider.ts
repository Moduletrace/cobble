/**
 * What the app asks of a connector's provider. One provider is one file
 * under `providers/` and one entry in `ConnectorProviders`.
 *
 * Everything here is per account: the endpoint a run's tools live at is
 * bound to one of its user's connected accounts, which is why a user with
 * two Gmail accounts gets two sets of tools.
 */
export type ConnectorApp = {
    /**
     * The provider's own app id, e.g. gmail.
     */
    app: string;
    name: string;
    description: string;
    /**
     * The provider's logo URL for it, when it gives one.
     */
    logo: string;
    scopes: string[] | null;
};

export type ConnectorTool = {
    /**
     * The provider's own tool name, e.g. GMAIL_SEND_EMAIL.
     */
    name: string;
    description: string;
    input_schema: Record<string, unknown>;
};

export type ProviderAccountStatus = "connected" | "pending" | "expired";

export type ProviderAccount = {
    provider_account_id: string;
    status: ProviderAccountStatus;
    /**
     * What the provider knows the account by, when it says: an address, a
     * workspace name. Never a credential.
     */
    label?: string;
};

export type ConnectorEndpoint = {
    url: string;
    headers: Record<string, string>;
    session_id?: string;
    /**
     * Unix ms, when the provider says. Null means it didn't.
     */
    expires_at?: number;
};

export type StartConnectParams = {
    app: string;
    user_id: number;
    label: string;
    auth_config_id?: string | null;
    /**
     * Where the provider sends the user back to once they finish. Left out
     * when the install has no public address to send them to: the card and
     * Settings > Connectors then find out by asking (`accounts`), which works
     * either way.
     */
    callback_url?: string;
};

export type StartedConnect = {
    url: string;
    /**
     * The provider's id for the account it made, when it says up front. A
     * request keeps it, so the account that appears is the one it meant.
     */
    provider_account_id?: string;
    /**
     * The provider's sign-in setup the link belongs to (an auth config at
     * Composio), so it can be kept and reused rather than made again.
     */
    auth_config_id?: string;
    /**
     * Unix ms, when the provider says the link stops working.
     */
    expires_at?: number;
};

export type ConnectorProvider = {
    /** Apps this install may add, with what the provider says about each. */
    listApps(): Promise<ConnectorApp[]>;
    /** One app's tools as the provider lists them, for a bot to call. */
    listTools({ app }: { app: string }): Promise<ConnectorTool[]>;
    /**
     * Where one account's tools live, for one user: an MCP endpoint and the
     * headers it wants. Creates or reuses the provider's session.
     */
    endpoint({
        app,
        user_id,
        account,
        tools,
    }: {
        app: string;
        user_id: number;
        account: string;
        tools: string[];
    }): Promise<ConnectorEndpoint>;
    /** Start a sign-in. Returns the URL to send the user to. */
    startConnect(params: StartConnectParams): Promise<StartedConnect>;
    /** The user's accounts for the app, as the provider has them. */
    accounts({ app, user_id }: { app: string; user_id: number }): Promise<ProviderAccount[]>;
    /** Forget one account at the provider. Local rows are the caller's. */
    revoke({ account }: { account: string }): Promise<void>;
    /**
     * Call one tool over the provider's REST API, with the account named in
     * the call. The fallback for an endpoint that can't be pinned to one
     * account; the model sees the same tool either way.
     */
    execute({
        tool,
        args,
        account,
        user_id,
    }: {
        tool: string;
        args: Record<string, unknown>;
        account: string;
        user_id: number;
    }): Promise<unknown>;
};