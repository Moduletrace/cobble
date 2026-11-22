import { useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { twMerge } from "tailwind-merge";
import { CircleSlash, CircleUser, Plus, RefreshCw } from "lucide-react";
import { ConnectorAccountStatuses } from "@/src/dict/connector-dict";
import type {
    ConnectorAccountRecord,
    ConnectorRecord,
    ExtensionTargets,
} from "@/src/types";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import useConnectorConnect from "../(hooks)/use-connector-connect";
import ConnectorAccountModal from "./connector-account-modal";
import ConnectorConnectModal from "./connector-connect-modal";

type Props = {
    connector: ConnectorRecord;
    accounts: ConnectorAccountRecord[];
    targets: ExtensionTargets;
    bots: { id: number; name: string }[];
    onChanged: (msg: string) => void;
    onError: (msg: string) => void;
};

type Busy = {
    account_id: number;
    kind: "refresh" | "disconnect";
};

/**
 * One app's sign-ins: the viewer's own, and any given out to a place they
 * reach. A card carries its name, one status, and the two actions that keep
 * it alive (check again, or sign in again when it died, and disconnect).
 * Everything about where it may be used lives in its modal.
 */
export default function ConnectorAccounts({
    connector,
    accounts,
    targets,
    bots,
    onChanged,
    onError,
}: Props) {
    const [connecting, setConnecting] = useState(false);
    const [open_account, setOpenAccount] = useState<ConnectorAccountRecord>();
    const [busy, setBusy] = useState<Busy>();

    const connect = useConnectorConnect({
        onConnected: (msg) => onChanged(msg),
        onError,
    });

    /**
     * How many of this app's accounts are ready to use, whoever they belong
     * to. Nothing is said while none is.
     */
    const connected_count = accounts.filter(
        (account) => account.status == "connected",
    ).length;

    const statusOf = (status: ConnectorAccountRecord["status"]) =>
        ConnectorAccountStatuses.find((entry) => entry.value == status)
            ?.title || status;

    const statusClass = (status: ConnectorAccountRecord["status"]) =>
        status == "connected"
            ? "text-success dark:text-success-dark"
            : status == "pending"
              ? "text-ink-secondary"
              : "text-hue-red";

    const refresh = async ({ account }: { account: ConnectorAccountRecord }) => {
        if (busy) return;

        if (account.status != "connected") {
            connect.start({
                connector_id: connector.id,
                label: account.label,
                account_id: account.id,
            });
            return;
        }

        setBusy({ account_id: account.id, kind: "refresh" });

        const res = await postAdminApi<{ connector_id: number; account: ConnectorAccountRecord }>({
            path: "connectors/refresh-account",
            body: { account_id: account.id },
        });

        setBusy(undefined);

        if (!res.success) {
            onError(res.msg || "Couldn't check it.");
            return;
        }

        onChanged(res.msg || "Checked.");
    };

    const disconnect = async ({ account }: { account: ConnectorAccountRecord }) => {
        if (busy) return;
        if (!window.confirm(`Disconnect ${account.label}? Runs using it lose it at once.`)) return;

        setBusy({ account_id: account.id, kind: "disconnect" });

        const res = await postAdminApi({
            path: "connectors/disconnect-account",
            body: { account_id: account.id },
        });

        setBusy(undefined);

        if (!res.success) {
            onError(res.msg || "Couldn't disconnect it.");
            return;
        }

        onChanged(res.msg || "Disconnected.");
    };

    return (
        <Stack className="w-full gap-2! items-stretch pl-14 pr-4">
            {accounts.length ? (
                <Stack className="w-full gap-1!">
                    {accounts.map((account) => (
                        <Row
                            key={account.id}
                            className="w-full items-center gap-1! rounded-default border border-hairline py-0.5! pl-2 pr-1"
                        >
                            <Button
                                title={`Edit ${account.label}`}
                                type="button"
                                variant="ghost"
                                color="gray"
                                size="small"
                                className="flex-1 min-w-0 justify-start gap-2! overflow-hidden px-1!"
                                buttonContentProps={{ className: "w-full min-w-0" }}
                                onClick={() => setOpenAccount(account)}
                            >
                                <CircleUser size={14} aria-hidden className="shrink-0" />
                                <Span className="min-w-0 flex-1 truncate text-left text-sm text-ink">
                                    {account.label}
                                </Span>
                            </Button>

                            <Row className="shrink-0 items-center gap-1!">
                                <Span
                                    className={twMerge(
                                        "text-xs",
                                        statusClass(account.status),
                                    )}
                                >
                                    {statusOf(account.status)}
                                </Span>
                                <Button
                                    title={
                                        account.status == "connected"
                                            ? `Check ${account.label} again`
                                            : `Reconnect ${account.label}`
                                    }
                                    type="button"
                                    variant="ghost"
                                    color="gray"
                                    size="small"
                                    className="px-1!"
                                    loading={
                                        busy?.account_id == account.id &&
                                        busy?.kind == "refresh"
                                    }
                                    onClick={() => refresh({ account })}
                                >
                                    <RefreshCw size={14} aria-hidden />
                                </Button>
                                <Button
                                    title={`Disconnect ${account.label}`}
                                    type="button"
                                    variant="ghost"
                                    color="gray"
                                    size="small"
                                    className="px-1!"
                                    loading={
                                        busy?.account_id == account.id &&
                                        busy?.kind == "disconnect"
                                    }
                                    onClick={() => disconnect({ account })}
                                >
                                    <CircleSlash size={14} aria-hidden />
                                </Button>
                            </Row>
                        </Row>
                    ))}
                </Stack>
            ) : (
                <Span className="text-xs text-ink-secondary">
                    No account yet: add one, and your runs can use{" "}
                    {connector.name}.
                </Span>
            )}

            <Row className="w-full items-center gap-2!">
                {connected_count ? (
                    <Span className="text-xs text-success dark:text-success-dark">
                        {connected_count}{" "}
                        {connected_count == 1 ? "account" : "accounts"}
                    </Span>
                ) : null}
                <Button
                    title={`Add a ${connector.name} connection`}
                    type="button"
                    variant="ghost"
                    color="gray"
                    size="small"
                    className="gap-1!"
                    onClick={() => setConnecting(true)}
                >
                    <Plus size={14} aria-hidden />
                    New connection
                </Button>
            </Row>

            {connecting ? (
                <ConnectorConnectModal
                    connector={connector}
                    onConnected={(msg) => {
                        setConnecting(false);
                        onChanged(msg);
                    }}
                    onCancel={() => setConnecting(false)}
                />
            ) : null}

            {open_account ? (
                <ConnectorAccountModal
                    connector={connector}
                    account={open_account}
                    targets={targets}
                    bots={bots}
                    onSaved={(msg) => {
                        setOpenAccount(undefined);
                        onChanged(msg);
                    }}
                    onCancel={() => setOpenAccount(undefined)}
                />
            ) : null}
        </Stack>
    );
}
