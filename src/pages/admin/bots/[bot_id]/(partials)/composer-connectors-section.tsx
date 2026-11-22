import { useCallback, useEffect, useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Link from "@moduletrace/twui/layout/Link";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import { Plus } from "lucide-react";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { BotConnectorEntry } from "@/src/types";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import ComposerConnectorPicker from "./composer-connector-picker";
import ComposerConnectorRow from "./composer-connector-row";

type Props = {
    bot_id: number;
    workspace_id?: number | null;
    /**
     * Read only while the modal is open: a conversation shouldn't pay for a
     * list nobody is looking at.
     */
    open: boolean;
    /**
     * How many apps reach the bot here, told to the composer so its tools
     * count follows an add or a remove without a reload.
     */
    onCount?: (count: number) => void;
};

/**
 * The connectors this bot can use for the person chatting, shown under the
 * tools in the composer's modal. Apps given to the bot by the workspace or
 * the install, and the ones this user attached, with the accounts that
 * reach there. Sign-in itself lives in Settings > Connectors.
 */
export default function ComposerConnectorsSection({
    bot_id,
    workspace_id,
    open,
    onCount,
}: Props) {
    const [items, setItems] = useState<BotConnectorEntry[]>();
    const [error, setError] = useState<string>();
    const [notice, setNotice] = useState<string>();
    const [tick, setTick] = useState(0);
    const [adding, setAdding] = useState(false);

    const reload = useCallback((msg?: string) => {
        if (msg) setNotice(msg);
        setTick((value) => value + 1);
    }, []);

    const remove = async ({ entry }: { entry: BotConnectorEntry }) => {
        const res = await postAdminApi({
            path: "connectors/detach",
            body: { connector_id: entry.connector.id, bot_id },
        });

        if (!res.success) {
            setError(res.msg || `Couldn't remove ${entry.connector.name}.`);
            return;
        }

        reload(`${entry.connector.name} is no longer on this bot.`);
    };

    useEffect(() => {
        if (!open) return;

        let live = true;
        const params = new URLSearchParams({ bot_id: String(bot_id) });

        if (workspace_id) params.set("workspace_id", String(workspace_id));

        setError(undefined);

        void (async () => {
            const res = await fetchApi<
                Record<string, unknown>,
                APIResponseObject<BotConnectorEntry[]>
            >(`/api/admin/connectors/bot?${params.toString()}`, {
                method: "GET",
            });

            if (!live) return;

            if (!res.success) {
                setError(res.msg || "Couldn't read this bot's connectors.");
                return;
            }

            const entries = res.singleRes || [];

            setItems(entries);
            onCount?.(entries.length);
        })();

        return () => {
            live = false;
        };
    }, [open, bot_id, workspace_id, tick, onCount]);

    return (
        <Stack className="w-full mt-4 pt-4 items-stretch border-0 border-t border-solid border-hairline">
            <Row className="w-full items-center gap-2!">
                <Span className="grow text-[13px] leading-[18px] font-bold text-ink">
                    Connectors
                </Span>
                <Button
                    title={
                        adding
                            ? "Stop adding a connector"
                            : "Add a connector to this bot"
                    }
                    type="button"
                    variant="ghost"
                    color="gray"
                    size="small"
                    beforeIcon={<Plus size={12} aria-hidden />}
                    className="shrink-0 gap-1! px-1.5! py-0.5! text-[12px] leading-4"
                    onClick={() => setAdding((value) => !value)}
                >
                    Add
                </Button>
            </Row>

            {notice ? (
                <Span className="text-xs leading-4 text-ink-secondary">
                    {notice}
                </Span>
            ) : null}

            {error ? (
                <Span
                    role="alert"
                    className="text-xs leading-4 text-ink-secondary"
                >
                    {error}
                </Span>
            ) : items === undefined ? (
                <Span className="text-xs leading-4 text-ink-secondary">
                    Reading connectors...
                </Span>
            ) : items.length ? (
                <Stack className="w-full py-1 gap-0! items-stretch rounded-default border border-solid border-hairline bg-surface">
                    {items.map((entry) => (
                        <ComposerConnectorRow
                            key={entry.connector.id}
                            entry={entry}
                            onRemove={
                                entry.removable
                                    ? () => void remove({ entry })
                                    : undefined
                            }
                        />
                    ))}
                </Stack>
            ) : (
                <Span className="text-xs leading-4 text-ink-secondary">
                    No connector is given to this bot yet. Give one in{" "}
                    <Link
                        href="/admin/settings/connectors"
                        target="_blank"
                        className="underline"
                    >
                        Settings &gt; Connectors
                    </Link>
                </Span>
            )}

            {adding ? (
                <ComposerConnectorPicker
                    bot_id={bot_id}
                    workspace_id={workspace_id}
                    onAdded={(msg) => {
                        setAdding(false);
                        reload(msg);
                    }}
                    onCancel={() => setAdding(false)}
                    onError={setError}
                />
            ) : null}

            <Span variant="faded" size="smaller">
                Manage connectors{" "}
                <Link
                    href="/admin/settings/connectors"
                    target="_blank"
                    className="underline"
                >
                    here
                </Link>
            </Span>
        </Stack>
    );
}
