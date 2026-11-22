import AppError from "@/src/utils/app-error";
import type {
    ConnectorApp,
    ConnectorEndpoint,
    ConnectorProvider,
    ConnectorTool,
    ProviderAccount,
    ProviderAccountStatus,
    StartConnectParams,
} from "../connector-provider";

type Params = {
    /**
     * The install's Composio key (Settings, under Environment).
     */
    key: string;
    /**
     * Where its API answers. Tests point it at a stub.
     */
    base_url?: string;
    fetchImpl?: typeof fetch;
};

const DefaultBaseUrl = "https://backend.composio.dev/api/v3.1";
const PageLimit = 100;
/** Composio keeps one account per app unless a session allows more; 5 is its own ceiling in the docs. */
const MaxAccountsPerToolkit = 5;
const MaxPages = 20;

const Statuses: Record<string, ProviderAccountStatus> = {
    ACTIVE: "connected",
    INITIALIZING: "pending",
    INITIATED: "pending",
    EXPIRED: "expired",
    INACTIVE: "expired",
    FAILED: "expired",
};

/**
 * Composio, the first connector provider: it holds the apps, the sign-ins
 * and the accounts, and hands a run one MCP endpoint per account
 * (`endpoint`). Its REST `tools/execute` is the fallback for an endpoint
 * that can't be pinned to the account, and the model's tools are the same
 * either way.
 */
export default function composioConnectorProvider({ key, base_url, fetchImpl }: Params): ConnectorProvider {
    const base = (base_url || DefaultBaseUrl).replace(/\/$/, "");
    const doFetch = fetchImpl || fetch;

    /**
     * One request, with its arguments in a query string where it takes
     * them. A provider error becomes a sentence that names what was being
     * done, since the model reads it.
     */
    async function request<T>({
        path,
        method = "GET",
        query,
        body,
        what,
    }: {
        path: string;
        method?: "GET" | "POST" | "DELETE";
        query?: Record<string, string | number | undefined>;
        body?: unknown;
        what: string;
    }): Promise<T> {
        const url = new URL(`${base}${path}`);

        for (const [name, value] of Object.entries(query || {})) {
            if (value !== undefined) url.searchParams.set(name, String(value));
        }

        const response = await doFetch(url, {
            method,
            headers: {
                "x-api-key": key,
                "Content-Type": "application/json",
            },
            body: body === undefined ? undefined : JSON.stringify(body),
        });

        const text = await response.text();
        let parsed: any = null;

        try {
            parsed = JSON.parse(text);
        } catch {}

        if (!response.ok) {
            const reason =
                parsed?.error?.message || parsed?.error?.suggested_fix || parsed?.message || text.slice(0, 300);

            const key_note = key.startsWith("ck_")
                ? " That is a consumer key for connect.composio.dev/mcp: a connector needs a project API key (ak_...) from the project's Settings > API Keys."
                : key.startsWith("uak_")
                  ? " That is a user API key: a connector needs a project API key (ak_...) from the project's Settings > API Keys."
                  : "";

            const hint =
                response.status == 401 || response.status == 403
                    ? ` Check this connection's key in Settings > Connectors.${key_note}`
                    : "";

            throw new AppError(`Composio refused ${what} (HTTP ${response.status}): ${reason}.${hint}`);
        }

        return (parsed ?? ({} as T)) as T;
    }

    async function listAllPages<T>({ path, query, what }: { path: string; query?: Record<string, string>; what: string }) {
        const items: T[] = [];
        let cursor: string | undefined;

        for (let page = 0; page < MaxPages; page++) {
            const answer = await request<any>({
                path,
                query: { ...query, limit: PageLimit, cursor },
                what,
            });

            items.push(...(answer.items || []));
            cursor = answer.next_cursor || undefined;

            if (!cursor) break;
        }

        return items;
    }

    /**
     * How a toolkit can be signed in: the schemes Composio manages itself and
     * every scheme it accepts. Empty when the toolkit can't be read, which
     * leaves the managed OAuth setup that every OAuth app has.
     */
    async function toolkitAuthMethods({ app }: { app: string }): Promise<{ managed: string[]; schemes: string[] }> {
        try {
            const toolkit = await request<any>({
                path: `/toolkits/${encodeURIComponent(app)}`,
                what: `the ${app} sign-in methods`,
            });

            return {
                managed: (toolkit.composio_managed_auth_schemes || []).map((scheme: string) =>
                    String(scheme).toUpperCase(),
                ),
                schemes: (toolkit.auth_config_details || [])
                    .map((detail: any) => String(detail.mode || "").toUpperCase())
                    .filter(Boolean),
            };
        } catch {
            return { managed: [], schemes: [] };
        }
    }

    /**
     * The sign-in setup a link belongs to. Composio wants an auth config on
     * every link, and makes a managed one for a toolkit that has none yet,
     * so a fresh install can connect an app without visiting its dashboard.
     * A toolkit Composio manages no credentials for (Gitea, whose key and
     * instance URL are the user's own) gets a custom setup of its own scheme
     * instead, which the hosted sign-in page fills in.
     */
    async function authConfigFor({ app, auth_config_id }: { app: string; auth_config_id?: string | null }) {
        if (auth_config_id) return auth_config_id;

        const [existing, methods] = await Promise.all([
            listAllPages<any>({
                path: "/auth_configs",
                query: { toolkit_slug: app },
                what: `the ${app} sign-in setups`,
            }),
            toolkitAuthMethods({ app }),
        ]);
        const usable = (item: any) =>
            !methods.schemes.length || methods.schemes.includes(String(item.auth_scheme || "").toUpperCase());
        const reusable =
            existing.find((item) => usable(item) && String(item.auth_scheme).toUpperCase() == "OAUTH2") ||
            existing.find(usable);

        if (reusable?.id) return String(reusable.id);

        // Nothing known about the toolkit means an OAuth app that Composio
        // manages, as before.
        const managed = !methods.schemes.length || methods.managed.length > 0;

        try {
            const created = await request<any>({
                path: "/auth_configs",
                method: "POST",
                what: `a sign-in setup for ${app}`,
                body: managed
                    ? {
                          toolkit: { slug: app },
                          auth_scheme: methods.managed.includes("OAUTH2")
                              ? "OAUTH2"
                              : methods.managed[0] || "OAUTH2",
                          use_composio_managed_auth: true,
                      }
                    : { toolkit: { slug: app }, auth_config: { type: "use_custom_auth", authScheme: methods.schemes[0] } },
            });
            const id = created.auth_config?.id || created.id;

            if (!id) throw new AppError(`Composio didn't return a sign-in setup for ${app}.`);

            return String(id);
        } catch (error) {
            throw new AppError(
                `${app} has no sign-in setup at Composio yet, and one couldn't be made: ${(error as Error).message}`,
            );
        }
    }

    return {
        async listApps() {
            const items = await listAllPages<any>({ path: "/toolkits", what: "the app list" });

            return items.map(
                (item): ConnectorApp => ({
                    app: item.slug,
                    name: item.name || item.slug,
                    description: item.meta?.description || item.description || "",
                    logo: item.meta?.logo || item.logo || "",
                    scopes: Array.isArray(item.meta?.scopes) ? item.meta.scopes : null,
                }),
            );
        },

        async listTools({ app }) {
            const items = await listAllPages<any>({
                path: "/tools",
                query: { toolkit_slug: app },
                what: `the tool list for ${app}`,
            });

            return items.map(
                (item): ConnectorTool => ({
                    name: item.slug || item.name,
                    description: item.description || item.slug || item.name,
                    input_schema: item.input_parameters || item.input_schema || { type: "object", properties: {} },
                }),
            );
        },

        async endpoint({ app, user_id, account, tools }) {
            const answer = await request<any>({
                path: "/tool_router/session",
                method: "POST",
                what: `a session for ${app}`,
                body: {
                    user_id: `cobble-user-${user_id}`,
                    connected_accounts: { [app]: [account] },
                    toolkits: { enable: [app] },
                    tools: { [app]: { enable: tools } },
                    manage_connections: { enable: false },
                    search: { enable: false },
                    preload: { tools: "all" },
                    mcp: true,
                },
            });

            const mcp = answer.mcp || answer.session?.mcp;

            if (!mcp?.url) {
                throw new AppError(
                    `Composio answered with a session but no MCP endpoint for ${app}, so its tools can't be reached.`,
                );
            }

            return {
                url: mcp.url,
                // The tool router answers with a URL and no headers, and
                // rejects a request without the project key ("API key is
                // required"), so the key travels with every call. It only
                // ever reaches the provider, never a model.
                headers: { "x-api-key": key, ...(mcp.headers || {}) },
                session_id: answer.session_id || answer.id,
                expires_at: answer.expires_at || mcp.expires_at || undefined,
            } satisfies ConnectorEndpoint;
        },

        async startConnect({ app, user_id, auth_config_id, callback_url }: StartConnectParams) {
            const config = await authConfigFor({ app, auth_config_id });

            // A plain connected-accounts link replaces the app's account for
            // that user, so a second sign-in would take the first one away.
            // A multi-account session keeps both, which is what a connection
            // named "Work" beside one named "Personal" needs.
            const session = await request<any>({
                path: "/tool_router/session",
                method: "POST",
                what: `a sign-in session for ${app}`,
                body: {
                    user_id: `cobble-user-${user_id}`,
                    toolkits: { enable: [app] },
                    // The link names no auth config, so the session is what
                    // pins the setup a toolkit with several of them uses.
                    auth_configs: { [app]: config },
                    multi_account: { enable: true, max_accounts_per_toolkit: MaxAccountsPerToolkit },
                },
            });

            const session_id = session.session_id || session.id;

            if (!session_id) throw new AppError(`Composio didn't open a sign-in session for ${app}.`);

            const answer = await request<any>({
                path: `/tool_router/session/${session_id}/link`,
                method: "POST",
                what: `a sign-in link for ${app}`,
                body: {
                    toolkit: app,
                    auth_config_id: config,
                    ...(callback_url ? { callback_url } : {}),
                },
            });

            if (!answer.redirect_url) {
                throw new AppError(`Composio didn't return a sign-in link for ${app}.`);
            }

            return {
                url: answer.redirect_url,
                auth_config_id: config,
                provider_account_id: answer.connected_account_id ? String(answer.connected_account_id) : undefined,
                expires_at: answer.expires_at ? Date.parse(String(answer.expires_at)) : undefined,
            };
        },

        async accounts({ app, user_id }) {
            const items = await listAllPages<any>({
                path: "/connected_accounts",
                // The listing filters on the plural names only: `toolkit_slug`
                // and `user_id` are ignored and answer with the whole
                // project's accounts, which is how one user's sync took over
                // another's account.
                query: { user_ids: `cobble-user-${user_id}`, toolkit_slugs: app },
                what: `the ${app} accounts`,
            });

            return items
                .filter((item) => !item.toolkit?.slug || item.toolkit.slug == app)
                .map(
                    (item): ProviderAccount => ({
                        provider_account_id: item.id,
                        status: Statuses[item.status] || "expired",
                        label: item.account_name || item.meta?.account_name || undefined,
                    }),
                );
        },

        async revoke({ account }) {
            await request<any>({
                path: `/connected_accounts/${account}`,
                method: "DELETE",
                what: "disconnecting an account",
            });
        },

        async execute({ tool, args, account, user_id }) {
            const answer = await request<any>({
                path: `/tools/execute/${tool}`,
                method: "POST",
                what: `a call to ${tool}`,
                body: {
                    user_id: `cobble-user-${user_id}`,
                    connected_account_id: account,
                    arguments: args,
                },
            });

            if (answer.successful === false) {
                throw new AppError(
                    `Composio failed ${tool}: ${answer.error || "it gave no reason"}`,
                );
            }

            return answer.data ?? answer;
        },
    };
}