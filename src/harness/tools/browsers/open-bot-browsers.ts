import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { BrowserRunKind } from "@/src/dict/browser-dict";
import assertBrowserUrl from "@/src/functions/backend/db/browsers/assert-browser-url";
import grabRunBrowsers from "@/src/functions/backend/db/browsers/grab-run-browsers";
import parseBrowserRow from "@/src/functions/backend/db/browsers/parse-browser-row";
import recordBrowserConnection from "@/src/functions/backend/db/browsers/record-browser-connection";
import grabRunEnvs from "@/src/functions/backend/db/extensions/grab-run-envs";
import parseJsonColumn from "@/src/functions/backend/db/extensions/parse-json-column";
import { decrypt } from "@/src/utils/crypt";
import mcpToolName from "@/src/utils/mcp-tool-name";
import redactSecrets from "@/src/utils/redact-secrets";
import connectMcpServer from "../../mcp/connect-mcp-server";
import mcpHarnessTool from "../../mcp/mcp-harness-tool";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    workspace_id?: number | string | null;
    run_kind: BrowserRunKind;
    /**
     * Names the run's other tools already use: they win.
     */
    taken?: string[];
    signal?: AbortSignal;
};

export type OpenBotBrowsers = {
    tools: HarnessTool[];
    /**
     * For `composeBrowsersNote`.
     */
    browsers: { name: string; slug: string; is_default: boolean }[];
    close: () => Promise<void>;
};

/**
 * The tools of the user's own browsers on one run (`grabRunBrowsers`),
 * built from each one's last listing as `<slug>__<tool>`, connecting on
 * the first call so a laptop that's asleep never holds a run up. Unlike an
 * MCP server's, a browser's URL and headers are a member's own text, so
 * they're never templates (`{{env.KEY}}` would send install secrets to
 * their server), the URL is checked on each connection, and redirects are
 * refused. Call `close` when the run ends.
 */
export default async function openBotBrowsers({
    user_id,
    bot_id,
    workspace_id,
    run_kind,
    taken = [],
    signal,
}: Params): Promise<OpenBotBrowsers> {
    const { browsers, default_id } = await grabRunBrowsers({ user_id, bot_id, workspace_id, run_kind });

    if (!browsers.length) return { tools: [], browsers: [], close: async () => {} };

    const envs = await grabRunEnvs({ bot_id, user_id, workspace_id });
    const secrets = envs.filter((env) => env.secret);
    const redact = (text: string) => redactSecrets({ text, secrets });
    const names = new Set(taken);
    const tools: HarnessTool[] = [];
    const connections: Promise<Client>[] = [];
    const usable: OpenBotBrowsers["browsers"] = [];

    for (const row of browsers) {
        const browser = parseBrowserRow({ row });
        const listed = browser.tools.filter((tool) => !browser.excluded_tools.includes(tool.name));

        if (!listed.length) continue;

        let connection: Promise<Client> | undefined;

        const client = () => {
            connection ||= (async () => {
                await assertBrowserUrl({ url: browser.url });

                const connected = await connectMcpServer({
                    url: browser.url,
                    headers: parseJsonColumn<Record<string, string>>({
                        text: row.headers ? await decrypt(row.headers) : "",
                        fallback: {},
                    }),
                    no_redirects: true,
                    signal,
                });

                if (browser.status != "ok") await recordBrowserConnection({ browser_id: browser.id });

                return connected;
            })().catch(async (error: unknown) => {
                connection = undefined;

                if (!signal?.aborted) {
                    await recordBrowserConnection({
                        browser_id: browser.id,
                        error: error instanceof Error ? error.message : String(error),
                    });
                }

                throw error;
            });

            connections.push(connection);

            return connection;
        };

        usable.push({ name: browser.name, slug: browser.slug, is_default: browser.id == default_id });

        for (const tool of listed) {
            const name = mcpToolName({ slug: browser.slug, name: tool.name });

            if (names.has(name)) continue;

            names.add(name);
            /**
             * Deferred: listed by name until the run loads them
             * (`load_tools`), so a turn that doesn't browse doesn't carry
             * every browser tool's definition.
             */
            tools.push({
                ...mcpHarnessTool({
                    name,
                    tool: { ...tool, description: `${browser.name}: ${tool.description}` },
                    client,
                    redact,
                    image_focus: "This is a screenshot of a web page. Describe the page layout, text, buttons and form fields, and any errors or popups.",
                }),
                deferred: true,
            });
        }
    }

    return {
        tools,
        browsers: usable,
        close: async () => {
            await Promise.all(
                [...new Set(connections)].map(async (connecting) =>
                    (await connecting.catch(() => null))?.close().catch(() => {}),
                ),
            );
        },
    };
}
