import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { AppData } from "@/src/data/app-data";
import type { ConnectorAccountRecord, ConnectorRecord } from "@/src/types";
import mcpToolName from "@/src/utils/mcp-tool-name";
import connectMcpServer from "../mcp/connect-mcp-server";
import mcpResultToText from "../mcp/mcp-result-to-text";
import type { HarnessTool } from "../types";
import type { ConnectorProvider } from "./connector-provider";
import ensureConnectorEndpoint from "./ensure-connector-endpoint";

type Params = {
    connector: ConnectorRecord;
    provider: ConnectorProvider;
    user_id: number;
    /**
     * The account to call through. Null when the connector is offered in a
     * reply the user follows but has no account yet: its tools exist so the
     * bot can ask, and calling one asks through `onMissingAccount` instead
     * of running.
     */
    account: ConnectorAccountRecord | null;
    onMissingAccount?: () => Promise<string>;
    /**
     * The app's slug, or `<app slug>-<account slug>` once the user has more
     * than one account for it: what the tools are named under.
     */
    namespace: string;
    /**
     * Names the run already uses: they win.
     */
    names: Set<string>;
    redact: (text: string) => string;
    /**
     * Counts one action against the run's cap, or throws saying what it is.
     */
    takeAction: () => void;
    signal?: AbortSignal;
};

export type ConnectorAccountTools = {
    tools: HarnessTool[];
    close: () => Promise<void>;
};

/**
 * One connector account's tools, as `<namespace>__<tool>`, all deferred.
 *
 * The endpoint is the account's MCP session (`ensureConnectorEndpoint`),
 * connected on the first call and closed with the run; a provider that
 * can't pin an account to a session runs the same tools over REST with the
 * account named in each call, so the model never sees a difference.
 */
export default function connectorAccountTools({
    connector,
    provider,
    user_id,
    account,
    onMissingAccount,
    namespace,
    names,
    redact,
    takeAction,
    signal,
}: Params): ConnectorAccountTools {
    const listed = connector.tools.filter((tool) => !connector.excluded_tools.includes(tool.name));
    const tools: HarnessTool[] = [];
    let connection: Promise<Client> | undefined;

    const client = async () => {
        if (!account) return null;

        const endpoint = await ensureConnectorEndpoint({ connector, provider, user_id, account });

        if (endpoint.kind != "mcp") return null;

        connection ||= connectMcpServer({ url: endpoint.url, headers: endpoint.headers, signal }).catch((error: unknown) => {
            connection = undefined;
            throw error;
        });

        return connection;
    };

    for (const tool of listed) {
        const name = mcpToolName({ slug: namespace, name: tool.name });

        if (names.has(name)) continue;

        names.add(name);
        tools.push({
            name,
            description: `${connector.name}${account ? ` (${account.label})` : ""}: ${tool.description || tool.name}`,
            parameters: tool.input_schema,
            deferred: true,
            run: async ({ args, signal: runSignal }) => {
                if (!account) {
                    throw new Error(
                        (await onMissingAccount?.()) ||
                            `No account is connected to ${connector.name}, so this didn't run. Connect one in Settings > Connectors.`,
                    );
                }

                takeAction();

                try {
                    const connected = await client();

                    if (!connected) {
                        const result = await provider.execute({
                            tool: tool.name,
                            args,
                            account: account.provider_account_id,
                            user_id,
                        });

                        return redact(typeof result == "string" ? result : JSON.stringify(result, null, 2));
                    }

                    const { text, images } = mcpResultToText({
                        result: await connected.callTool({ name: tool.name, arguments: args }, undefined, {
                            signal: runSignal,
                            timeout: AppData.ConnectorToolTimeoutMs,
                            resetTimeoutOnProgress: true,
                        }),
                    });

                    if (!images.length) return redact(text);

                    return {
                        text: redact(text),
                        images: images.map(({ data, mime_type }) => ({
                            url: `data:${mime_type};base64,${data}`,
                            focus: `This came back from ${connector.name}. Describe what it shows and quote any text in it.`,
                            redact,
                        })),
                    };
                } catch (error: unknown) {
                    if (error instanceof Error) error.message = redact(error.message);
                    throw error;
                }
            },
        });
    }

    return {
        tools,
        close: async () => {
            if (!connection) return;

            await (await connection.catch(() => null))?.close().catch(() => {});
        },
    };
}