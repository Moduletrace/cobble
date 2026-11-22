import type { ConnectorAccountRecord, ConnectorRecord } from "@/src/types";
import type { ConnectorProvider } from "@/src/harness/connectors/connector-provider";
import grabConnectorActionsPerRun from "@/src/functions/backend/db/connectors/grab-connector-actions-per-run";
import grabRunConnectors from "@/src/functions/backend/db/connectors/grab-run-connectors";
import grabRunEnvs from "@/src/functions/backend/db/extensions/grab-run-envs";
import { ConnectorAccountSeparator } from "@/src/dict/connector-dict";
import redactSecrets from "@/src/utils/redact-secrets";
import connectorAccountTools from "../../connectors/connector-account-tools";
import grabConnectorProvider from "@/src/functions/backend/db/connectors/grab-connector-provider";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    workspace_id?: number | string | null;
    /**
     * Whether the user is waiting on this run's answer. Only then may a
     * connector the user has no account for offer its tools: calling one
     * asks them to connect, through the card under the reply. A task,
     * routine, hook call or crew request gets tools only for accounts that
     * already work.
     */
    attended?: boolean;
    /**
     * Names the run's other tools already use: they win.
     */
    taken?: string[];
    /**
     * Called when a tool of a connector without an account is used, in an
     * attended run. It makes the connect request and returns the ref the
     * message must carry, or whatever should be said instead.
     */
    onMissingAccount?: (params: { connector: ConnectorRecord }) => Promise<string>;
    signal?: AbortSignal;
};

export type OpenBotConnectorSummary = {
    connector: ConnectorRecord;
    accounts: ConnectorAccountRecord[];
};

export type OpenBotConnectors = {
    tools: HarnessTool[];
    /**
     * For the run's prompt (`ConnectorsNote`): which accounts it can use
     * and how to load them, one line each.
     */
    lines: string[];
    connectors: OpenBotConnectorSummary[];
    close: () => Promise<void>;
};

/**
 * The connectors one run reaches, each account's tools named under its own
 * namespace (`gmail__...` for a single account, `gmail-work__...` for one of
 * several), all deferred so a turn that doesn't use them doesn't carry
 * their definitions. The endpoint is connected on the first call and
 * closed with the run.
 */
export default async function openBotConnectors({
    user_id,
    bot_id,
    workspace_id,
    attended = false,
    taken = [],
    onMissingAccount,
    signal,
}: Params): Promise<OpenBotConnectors> {
    const runConnectors = await grabRunConnectors({ user_id, bot_id, workspace_id });

    if (!runConnectors.length) return { tools: [], lines: [], connectors: [], close: async () => {} };

    const envs = await grabRunEnvs({ bot_id, user_id, workspace_id });
    const secrets = envs.filter((env) => env.secret);
    const redact = (text: string) => redactSecrets({ text, secrets });
    const names = new Set(taken);
    const tools: HarnessTool[] = [];
    const closers: (() => Promise<void>)[] = [];
    const lines: string[] = [];
    const cap = await grabConnectorActionsPerRun();
    const namespaces = new Set<string>();
    let actions = 0;

    /**
     * A tool namespace no other account of this run already holds, so two
     * accounts with the same label stay apart.
     */
    const freeNamespace = ({ base }: { base: string }) => {
        let candidate = base;
        let suffix = 2;

        while (namespaces.has(candidate) || [...names].some((name) => name.startsWith(`${candidate}__`))) {
            candidate = `${base}-${suffix}`;
            suffix += 1;
        }

        namespaces.add(candidate);
        return candidate;
    };

    const takeAction = () => {
        if (actions >= cap) {
            throw new Error(
                `This run has already taken ${cap} connector actions, so it can't take another. A provider bills per action; a super admin can raise the limit in Settings > Connectors.`,
            );
        }

        actions += 1;
    };

    for (const { connector, accounts } of runConnectors) {
        const connected = accounts.filter((account) => account.status == "connected");

        if (!connected.length) {
            if (attended && onMissingAccount) {
                let provider: ConnectorProvider;

                try {
                    provider = await grabConnectorProvider({ connector_id: connector.id });
                } catch (error: unknown) {
                    lines.push(`${connector.name}: ${error instanceof Error ? error.message : String(error)}`);
                    continue;
                }

                const built = connectorAccountTools({
                    connector,
                    provider,
                    user_id: Number(user_id),
                    account: null,
                    onMissingAccount: () => onMissingAccount({ connector }),
                    namespace: connector.slug,
                    names,
                    redact,
                    takeAction,
                    signal,
                });

                tools.push(...built.tools);
                closers.push(built.close);
                lines.push(
                    `${connector.name}: no account connected yet. Calling one of its tools (${connector.slug}__*) asks the user to connect one, through the card under your reply; don't tell them to connect it in a sentence alone.`,
                );

                continue;
            }

            const status = accounts[0]?.status;
            const why =
                status == "pending"
                    ? "waiting for you to finish connecting"
                    : status == "expired"
                      ? "needs reconnecting"
                      : "no account connected";

            lines.push(`${connector.name}: ${why}, so its tools aren't available in this run.`);

            continue;
        }

        let provider: ConnectorProvider;

        try {
            provider = await grabConnectorProvider({ connector_id: connector.id });
        } catch (error: unknown) {
            lines.push(`${connector.name}: ${error instanceof Error ? error.message : String(error)}`);
            continue;
        }

        for (const account of connected) {
            const namespace = freeNamespace({
                base:
                    connected.length > 1
                        ? `${connector.slug}${ConnectorAccountSeparator}${account.slug}`
                        : connector.slug,
            });
            const shared = account.user_id != Number(user_id) && Boolean(account.owner_name);
            const built = connectorAccountTools({
                connector,
                provider,
                /**
                 * The account's own owner: the provider session and the
                 * sign-in belong to whoever connected it, even when another
                 * person's run is using it.
                 */
                user_id: account.user_id,
                account,
                namespace,
                names,
                redact,
                takeAction,
                signal,
            });

            if (!built.tools.length) continue;

            tools.push(...built.tools);
            closers.push(built.close);
            lines.push(
                `${connector.name} (${account.label}${shared ? `, ${account.owner_name}'s account` : ""}): call its tools as ${namespace}__*, listing ${built.tools.length} tool${built.tools.length == 1 ? "" : "s"} you load with load_tools first.`,
            );
        }
    }

    return {
        tools,
        lines,
        connectors: runConnectors,
        close: async () => {
            await Promise.all(closers.map(async (close) => close().catch(() => {})));
        },
    };
}