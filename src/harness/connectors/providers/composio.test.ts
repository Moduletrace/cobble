import { describe, expect, test } from "bun:test";
import composioConnectorProvider from "./composio";

type Call = {
    url: URL;
    method: string;
    body: any;
    headers: Record<string, string>;
};

function stub({ answer }: { answer: (call: Call) => { status?: number; body: unknown } }) {
    const calls: Call[] = [];

    const fetchImpl = (async (input: any, init?: RequestInit) => {
        const url = new URL(String(input));
        const body = init?.body ? JSON.parse(String(init.body)) : null;
        const call: Call = {
            url,
            method: init?.method || "GET",
            body,
            headers: (init?.headers || {}) as Record<string, string>,
        };

        calls.push(call);

        const result = answer(call);

        return new Response(JSON.stringify(result.body), {
            status: result.status ?? 200,
            headers: { "Content-Type": "application/json" },
        });
    }) as unknown as typeof fetch;

    return { fetchImpl, calls };
}

describe("composioConnectorProvider", () => {
    test("lists apps and pages until there is no cursor", async () => {
        const { fetchImpl, calls } = stub({
            answer: ({ url }) =>
                url.searchParams.get("cursor")
                    ? { body: { items: [{ slug: "slack", name: "Slack", meta: { description: "Chat" } }] } }
                    : { body: { items: [{ slug: "gmail", name: "Gmail", meta: { scopes: ["mail"] } }], next_cursor: "n2" } },
        });

        const apps = await composioConnectorProvider({ key: "k", fetchImpl }).listApps();

        expect(apps).toEqual([
            { app: "gmail", name: "Gmail", description: "", logo: "", scopes: ["mail"] },
            { app: "slack", name: "Slack", description: "Chat", logo: "", scopes: null },
        ]);
        expect(calls[0]!.url.pathname).toBe("/api/v3.1/toolkits");
        expect(calls[0]!.headers["x-api-key"]).toBe("k");
        expect(calls[1]!.url.searchParams.get("cursor")).toBe("n2");
    });

    test("lists one app's tools", async () => {
        const { fetchImpl, calls } = stub({
            answer: () => ({
                body: {
                    items: [
                        {
                            slug: "GMAIL_SEND_EMAIL",
                            description: "Send an email",
                            input_parameters: { type: "object", properties: {} },
                        },
                    ],
                },
            }),
        });

        const tools = await composioConnectorProvider({ key: "k", fetchImpl }).listTools({ app: "gmail" });

        expect(tools[0]!.name).toBe("GMAIL_SEND_EMAIL");
        expect(calls[0]!.url.searchParams.get("toolkit_slug")).toBe("gmail");
    });

    test("asks for a session pinned to the account and the app's tools", async () => {
        const { fetchImpl, calls } = stub({
            answer: () => ({ body: { session_id: "s1", mcp: { url: "https://mcp/x", headers: { "x-a": "1" } } } }),
        });

        const endpoint = await composioConnectorProvider({ key: "k", fetchImpl }).endpoint({
            app: "gmail",
            user_id: 4,
            account: "ca_1",
            tools: ["GMAIL_SEND_EMAIL"],
        });

        expect(endpoint.url).toBe("https://mcp/x");
        expect(endpoint.session_id).toBe("s1");
        expect(endpoint.headers).toEqual({ "x-api-key": "k", "x-a": "1" });
        expect(calls[0]!.url.pathname).toBe("/api/v3.1/tool_router/session");
        expect(calls[0]!.body.user_id).toBe("cobble-user-4");
        expect(calls[0]!.body.connected_accounts).toEqual({ gmail: ["ca_1"] });
        expect(calls[0]!.body.tools).toEqual({ gmail: { enable: ["GMAIL_SEND_EMAIL"] } });
        expect(calls[0]!.body.manage_connections).toEqual({ enable: false });
    });

    test("a session without an mcp endpoint is an error the run can read", async () => {
        const { fetchImpl } = stub({ answer: () => ({ body: { session_id: "s1" } }) });

        await expect(
            composioConnectorProvider({ key: "k", fetchImpl }).endpoint({
                app: "gmail",
                user_id: 4,
                account: "ca_1",
                tools: [],
            }),
        ).rejects.toThrow("no MCP endpoint");
    });

    test("a refused key names the setting to fix", async () => {
        const { fetchImpl } = stub({
            answer: () => ({ status: 401, body: { error: { message: "Invalid API key" } } }),
        });

        await expect(composioConnectorProvider({ key: "bad", fetchImpl }).listApps()).rejects.toThrow(
            "Check this connection's key in Settings > Connectors.",
        );
    });

    test("a consumer key says it is not a project key", async () => {
        const { fetchImpl } = stub({
            answer: () => ({ status: 401, body: { error: { message: "Invalid API key" } } }),
        });

        await expect(
            composioConnectorProvider({ key: "ck_abcdefghijklmnopqrstu12", fetchImpl }).listApps(),
        ).rejects.toThrow("consumer key for connect.composio.dev/mcp");
    });

    test("starts a sign-in with the app's sign-in setup and keeps what the provider returns", async () => {
        const { fetchImpl, calls } = stub({
            answer: ({ url, method }) => {
                if (url.pathname.endsWith("/tool_router/session")) return { status: 201, body: { session_id: "trs_1" } };
                if (url.pathname.endsWith("/tool_router/session/trs_1/link")) {
                    return { status: 201, body: { redirect_url: "https://connect/x", connected_account_id: "ca_9", expires_at: "2027-01-01T00:00:00Z" } };
                }

                return method == "GET" ? { body: { items: [{ id: "ac_1", auth_scheme: "OAUTH2" }] } } : { body: {} };
            },
        });

        const started = await composioConnectorProvider({ key: "k", fetchImpl }).startConnect({
            app: "gmail",
            user_id: 4,
            label: "Work",
        });

        expect(started.url).toBe("https://connect/x");
        expect(started.auth_config_id).toBe("ac_1");
        expect(started.provider_account_id).toBe("ca_9");
        expect(started.expires_at).toBe(Date.parse("2027-01-01T00:00:00Z"));

        const session = calls.find((call) => call.url.pathname.endsWith("/tool_router/session"))!;

        expect(session.body.multi_account).toEqual({ enable: true, max_accounts_per_toolkit: 5 });
        expect(session.body.auth_configs).toEqual({ gmail: "ac_1" });

        const link = calls.find((call) => call.url.pathname.endsWith("/tool_router/session/trs_1/link"))!;

        expect(link.body.toolkit).toBe("gmail");
        expect(link.body.auth_config_id).toBe("ac_1");
        expect(link.body.callback_url).toBeUndefined();
        expect(calls.some((call) => call.url.pathname.endsWith("/connected_accounts/link"))).toBe(false);
    });

    test("makes a managed sign-in setup when the app has none", async () => {
        const { fetchImpl, calls } = stub({
            answer: ({ url, method }) => {
                if (url.pathname.endsWith("/tool_router/session")) return { status: 201, body: { session_id: "trs_1" } };
                if (url.pathname.endsWith("/link")) return { status: 201, body: { redirect_url: "https://connect/y" } };
                if (!url.pathname.endsWith("/auth_configs")) return { body: {} };

                return method == "POST" ? { status: 201, body: { auth_config: { id: "ac_new" } } } : { body: { items: [] } };
            },
        });

        const started = await composioConnectorProvider({ key: "k", fetchImpl }).startConnect({
            app: "gmail",
            user_id: 4,
            label: "Work",
        });

        expect(started.auth_config_id).toBe("ac_new");

        const made = calls.find((call) => call.url.pathname.endsWith("/auth_configs") && call.method == "POST")!;

        expect(made.body.toolkit).toEqual({ slug: "gmail" });
        expect(made.body.use_composio_managed_auth).toBe(true);
    });

    test("makes a custom sign-in setup for a toolkit Composio manages no credentials for", async () => {
        const { fetchImpl, calls } = stub({
            answer: ({ url, method }) => {
                if (url.pathname.endsWith("/toolkits/gitea")) {
                    return { body: { composio_managed_auth_schemes: [], auth_config_details: [{ mode: "API_KEY" }] } };
                }
                if (url.pathname.endsWith("/tool_router/session")) return { status: 201, body: { session_id: "trs_1" } };
                if (url.pathname.endsWith("/link")) {
                    return { status: 201, body: { redirect_url: "https://connect/gitea" } };
                }
                if (!url.pathname.endsWith("/auth_configs")) return { body: {} };

                return method == "POST" ? { status: 201, body: { auth_config: { id: "ac_gitea" } } } : { body: { items: [] } };
            },
        });

        const started = await composioConnectorProvider({ key: "k", fetchImpl }).startConnect({
            app: "gitea",
            user_id: 4,
            label: "Self-hosted",
        });

        expect(started.auth_config_id).toBe("ac_gitea");

        const made = calls.find((call) => call.url.pathname.endsWith("/auth_configs") && call.method == "POST")!;

        expect(made.body).toEqual({
            toolkit: { slug: "gitea" },
            auth_config: { type: "use_custom_auth", authScheme: "API_KEY" },
        });

        const session = calls.find((call) => call.url.pathname.endsWith("/tool_router/session"))!;

        expect(session.body.auth_configs).toEqual({ gitea: "ac_gitea" });
    });

    test("reuses a sign-in setup the toolkit can use, whatever its scheme", async () => {
        const { fetchImpl, calls } = stub({
            answer: ({ url }) => {
                if (url.pathname.endsWith("/toolkits/gitea")) {
                    return { body: { composio_managed_auth_schemes: [], auth_config_details: [{ mode: "API_KEY" }] } };
                }
                if (url.pathname.endsWith("/tool_router/session")) return { status: 201, body: { session_id: "trs_1" } };
                if (url.pathname.endsWith("/link")) {
                    return { status: 201, body: { redirect_url: "https://connect/gitea" } };
                }

                return { body: { items: [{ id: "ac_dash", auth_scheme: "API_KEY" }] } };
            },
        });

        const started = await composioConnectorProvider({ key: "k", fetchImpl }).startConnect({
            app: "gitea",
            user_id: 4,
            label: "Work",
        });

        expect(started.auth_config_id).toBe("ac_dash");
        expect(calls.some((call) => call.url.pathname.endsWith("/auth_configs") && call.method == "POST")).toBe(false);
    });

    test("maps account statuses and keeps the provider's id", async () => {
        const { fetchImpl, calls } = stub({
            answer: () => ({
                body: {
                    items: [
                        { id: "ca_1", status: "ACTIVE", account_name: "work@x" },
                        { id: "ca_2", status: "EXPIRED" },
                    ],
                },
            }),
        });

        const accounts = await composioConnectorProvider({ key: "k", fetchImpl }).accounts({ app: "gmail", user_id: 4 });

        expect(accounts).toEqual([
            { provider_account_id: "ca_1", status: "connected", label: "work@x" },
            { provider_account_id: "ca_2", status: "expired", label: undefined },
        ]);
        expect(calls[0]!.url.searchParams.get("toolkit_slugs")).toBe("gmail");
        expect(calls[0]!.url.searchParams.get("user_ids")).toBe("cobble-user-4");
        expect(calls[0]!.url.searchParams.get("user_id")).toBeNull();
    });

    test("executes one tool with the account named in the call", async () => {
        const { fetchImpl, calls } = stub({ answer: () => ({ body: { successful: true, data: { id: "m1" } } }) });

        const result = await composioConnectorProvider({ key: "k", fetchImpl }).execute({
            tool: "GMAIL_SEND_EMAIL",
            args: { to: "a@b" },
            account: "ca_1",
            user_id: 4,
        });

        expect(result).toEqual({ id: "m1" });
        expect(calls[0]!.url.pathname).toBe("/api/v3.1/tools/execute/GMAIL_SEND_EMAIL");
        expect(calls[0]!.body.connected_account_id).toBe("ca_1");
        expect(calls[0]!.body.arguments).toEqual({ to: "a@b" });
    });

    test("a failed execution says why", async () => {
        const { fetchImpl } = stub({
            answer: () => ({ body: { successful: false, error: "the account expired" } }),
        });

        await expect(
            composioConnectorProvider({ key: "k", fetchImpl }).execute({
                tool: "GMAIL_SEND_EMAIL",
                args: {},
                account: "ca_1",
                user_id: 4,
            }),
        ).rejects.toThrow("the account expired");
    });
});
