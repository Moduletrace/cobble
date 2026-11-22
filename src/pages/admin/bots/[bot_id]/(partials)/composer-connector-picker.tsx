import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import Button from "@moduletrace/twui/layout/Button";
import Input from "@moduletrace/twui/form/Input";
import Row from "@moduletrace/twui/layout/Row";
import SearchSelect from "@moduletrace/twui/form/SearchSelect";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import Form from "@moduletrace/twui/form/Form";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import AddFormActions from "@/src/layouts/bots/(partials)/add-form-actions";
import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import ConnectorLogo from "@/src/pages/admin/settings/connectors/(partials)/connector-logo";
import { ConnectorAccountStatuses } from "@/src/dict/connector-dict";
import type {
    AttachableConnector,
    ConnectorAccountRecord,
    ConnectorConnectionRecord,
    ConnectorConnectionsPayload,
} from "@/src/types";

type Props = {
    bot_id: number;
    workspace_id?: number | null;
    onAdded: (msg: string) => void;
    onCancel: () => void;
    onError: (msg: string) => void;
};

type SetBotPayload = { connector_id: number; attached: boolean };

const accountNote = ({ account }: { account: ConnectorAccountRecord }) => {
    if (account.status == "connected") return account.label;

    const status =
        ConnectorAccountStatuses.find(
            (option) => option.value == account.status,
        )?.title || account.status;

    return `${account.label} · ${status}`;
};

/**
 * Add a connector to this bot, from the connection at the top down to the
 * account: pick which provider account (for example Composio Work), then the
 * app inside it, then the account that should reach this bot. Only apps with
 * a connected account reaching here are listed: one with no sign-in has
 * nothing to give the bot. The account stays the user's own; giving it here
 * says its runs on this bot may use it.
 */
export default function ComposerConnectorPicker({
    bot_id,
    workspace_id,
    onAdded,
    onCancel,
    onError,
}: Props) {
    const [connections, setConnections] =
        useState<ConnectorConnectionRecord[]>();
    const [connection_id, setConnectionId] = useState(0);
    const [query, setQuery] = useState("");
    const [items, setItems] = useState<AttachableConnector[]>();
    const [chosen, setChosen] = useState<AttachableConnector>();
    const [accounts, setAccounts] = useState<ConnectorAccountRecord[]>();
    const [account_id, setAccountId] = useState(0);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string>();

    useEffect(() => {
        let live = true;

        void (async () => {
            const res = await fetchApi<
                Record<string, unknown>,
                APIResponseObject<ConnectorConnectionsPayload>
            >("/api/admin/connectors/connections", { method: "GET" });

            if (!live) return;

            if (!res.success) {
                setError(res.msg || "Couldn't read the connections.");
                return;
            }

            const all = res.singleRes?.connections || [];
            setConnections(all);
            setConnectionId(Number(all[0]?.id) || 0);
        })();

        return () => {
            live = false;
        };
    }, []);

    useEffect(() => {
        if (!connection_id) return;

        let live = true;

        const timer = setTimeout(() => {
            const params = new URLSearchParams({
                bot_id: String(bot_id),
                connection_id: String(connection_id),
                q: query,
            });

            if (workspace_id) params.set("workspace_id", String(workspace_id));

            void (async () => {
                const res = await fetchApi<
                    Record<string, unknown>,
                    APIResponseObject<AttachableConnector[]>
                >(`/api/admin/connectors/attachables?${params.toString()}`, {
                    method: "GET",
                });

                if (!live) return;

                if (!res.success) {
                    setError(
                        res.msg || "Couldn't read the apps of that connection.",
                    );
                    return;
                }

                setItems(res.singleRes || []);
            })();
        }, 300);

        return () => {
            live = false;
            clearTimeout(timer);
        };
    }, [bot_id, workspace_id, connection_id, query]);

    useEffect(() => {
        if (!chosen) return;

        let live = true;
        setAccounts(undefined);
        setAccountId(0);

        void (async () => {
            const res = await fetchApi<
                Record<string, unknown>,
                APIResponseObject<ConnectorAccountRecord[]>
            >(
                `/api/admin/connectors/accounts?connector_id=${chosen.id}&bot_id=${bot_id}${workspace_id ? `&workspace_id=${workspace_id}` : ""}`,
                { method: "GET" },
            );

            if (!live) return;

            if (!res.success) {
                setError(res.msg || "Couldn't read that app's accounts.");
                return;
            }

            setAccounts(res.singleRes || []);
        })();

        return () => {
            live = false;
        };
    }, [chosen, bot_id, workspace_id]);

    const add = async () => {
        if (!chosen) return;

        setError(undefined);
        setBusy(true);

        const account = accounts?.find((option) => option.id == account_id);

        if (!account) {
            const added = await postAdminApi<SetBotPayload>({
                path: "connectors/set-bot",
                body: { connector_id: chosen.id, attached: true, bot_id },
            });

            setBusy(false);

            if (!added.success) {
                setError(added.msg || `Couldn't add ${chosen.name}.`);
                return;
            }

            onAdded(`${chosen.name} is now on this bot, with every account you have in it.`);
            return;
        }

        const given = await postAdminApi({
            path: "connectors/set-account-access",
            body: {
                account_id: account.id,
                workspace_ids: account.workspace_ids,
                bot_ids: [...account.bot_ids.map(Number), bot_id],
                all_bots: account.all_bots,
            },
        });

        setBusy(false);

        if (!given.success) {
            setError(given.msg || `Couldn't give ${account.label} to this bot.`);
            return;
        }

        onAdded(`${chosen.name} is now on this bot, with ${account.label}.`);
    };

    const connection_options = (connections || []).map((connection) => ({
        title: connection.name,
        value: String(connection.id),
    }));

    return (
        <AddModalShell
            open
            setOpen={(next) => {
                if (!next) onCancel();
            }}
            title="Add a connector"
            description="Pick the connection, then the app inside it, then the account that should reach this bot."
        >
            <Form
                submitHandler={() => void add()}
                className="w-full flex-col gap-3! items-stretch"
            >
                <SearchSelect
                    id="composer-connector-connection"
                    title="Connection"
                    options={connection_options}
                    defaultValues={connection_id ? [String(connection_id)] : []}
                    changeHandler={(value) => {
                        const picked = Array.isArray(value) ? value[0] : value;
                        setChosen(undefined);
                        setConnectionId(Number(picked) || 0);
                    }}
                />

                <Input
                    id="composer-connector-search"
                    title="Apps"
                    placeholder="Search apps by name"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                />

                {items === undefined ? (
                    <Span className="text-xs leading-4 text-ink-secondary">
                        Reading apps...
                    </Span>
                ) : items.length ? (
                    <Stack className="w-full max-h-52 overflow-y-auto py-1 gap-0! items-stretch rounded-default border border-solid border-hairline bg-surface">
                        {items.map((connector) => (
                            <Button
                                key={connector.id}
                                title={connector.name}
                                type="button"
                                variant="ghost"
                                color="gray"
                                onClick={() => {
                                    setChosen(connector);
                                    setAccountId(0);
                                }}
                                className={
                                    chosen?.id == connector.id
                                        ? "w-full justify-start! rounded-none! px-3! py-1.5! bg-sunken!"
                                        : "w-full justify-start! rounded-none! px-3! py-1.5!"
                                }
                            >
                                <Row className="w-full gap-2.5! flex-nowrap items-center">
                                    <ConnectorLogo
                                        logo={connector.logo}
                                        name={connector.name}
                                    />
                                    <Stack className="grow min-w-0 items-start gap-0!">
                                        <Span className="text-sm leading-5 truncate text-ink">
                                            {connector.name}
                                        </Span>
                                        <Span className="text-xs leading-4 truncate text-ink-secondary">
                                            {connector.connection_name}
                                        </Span>
                                    </Stack>
                                    {chosen?.id == connector.id ? (
                                        <Check size={14} aria-hidden />
                                    ) : null}
                                </Row>
                            </Button>
                        ))}
                    </Stack>
                ) : (
                    <Span className="text-xs leading-4 text-ink-secondary">
                        Nothing to add: no connected app matches that, or every
                        one is already on this bot.
                    </Span>
                )}

                {chosen ? (
                    <Stack className="w-full gap-1! items-stretch">
                        <Span className="text-xs leading-4 font-bold text-ink">
                            Account
                        </Span>
                        {accounts === undefined ? (
                            <Span className="text-xs leading-4 text-ink-secondary">
                                Reading accounts...
                            </Span>
                        ) : (
                            <Stack className="w-full py-1 gap-0! items-stretch rounded-default border border-solid border-hairline bg-surface">
                                <Button
                                    title={`Give ${chosen.name} every account you have`}
                                    type="button"
                                    variant="ghost"
                                    color="gray"
                                    onClick={() => setAccountId(0)}
                                    className={
                                        account_id == 0
                                            ? "w-full justify-start! rounded-none! px-3! py-1.5! bg-sunken!"
                                            : "w-full justify-start! rounded-none! px-3! py-1.5!"
                                    }
                                >
                                    <Row className="w-full gap-2! flex-nowrap items-center">
                                        <Stack className="grow min-w-0 items-start gap-0!">
                                            <Span className="text-sm leading-5 truncate w-full text-left text-ink">
                                                All accounts
                                            </Span>
                                            <Span className="text-xs leading-4 truncate w-full text-left text-ink-secondary">
                                                Every account you have in{" "}
                                                {chosen.name}
                                            </Span>
                                        </Stack>
                                        {account_id == 0 ? (
                                            <Check size={14} aria-hidden />
                                        ) : null}
                                    </Row>
                                </Button>
                                {(accounts || []).map((account) => (
                                    <Button
                                        key={account.id}
                                        title={accountNote({ account })}
                                        type="button"
                                        variant="ghost"
                                        color="gray"
                                        onClick={() => setAccountId(account.id)}
                                        className={
                                            account_id == account.id
                                                ? "w-full justify-start! rounded-none! px-3! py-1.5! bg-sunken!"
                                                : "w-full justify-start! rounded-none! px-3! py-1.5!"
                                        }
                                    >
                                        <Row className="w-full gap-2! flex-nowrap items-center">
                                            <Span className="grow text-sm leading-5 text-left text-ink">
                                                {accountNote({ account })}
                                            </Span>
                                            {account_id == account.id ? (
                                                <Check size={14} aria-hidden />
                                            ) : null}
                                        </Row>
                                    </Button>
                                ))}
                            </Stack>
                        )}
                        {account_id == 0 && !(accounts || []).length ? (
                            <Span className="text-xs leading-4 text-ink-secondary">
                                Every account you have here already reaches this
                                bot; All accounts keeps that true for ones you
                                connect later. Another account can be connected
                                in Settings &gt; Connectors.
                            </Span>
                        ) : null}
                    </Stack>
                ) : null}

                <AddFormActions
                    submit_label="Add"
                    loading={busy}
                    error={error}
                    onCancel={onCancel}
                />
            </Form>
        </AddModalShell>
    );
}
