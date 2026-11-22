import { useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { CircleAlert, CircleUser, Plus } from "lucide-react";
import { ConnectorAccountStatuses } from "@/src/dict/connector-dict";
import type {
    ConnectorAccountRecord,
    ConnectorRecord,
    ExtensionTargets,
} from "@/src/types";
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

const isShared = ({ account }: { account: ConnectorAccountRecord }) =>
    account.all_bots ||
    Boolean(account.workspace_ids.length) ||
    Boolean(account.bot_ids.length);

/**
 * Where a sign-in is in force, in a few words.
 */
function accountReach({
    account,
    targets,
    bots,
}: {
    account: ConnectorAccountRecord;
    targets: ExtensionTargets;
    bots: { id: number; name: string }[];
}) {
    if (account.all_bots) return "Every bot, every user";

    const names = [
        ...account.workspace_ids.map(
            (id) =>
                targets.workspaces.find((workspace) => workspace.id == id)
                    ?.name || `workspace ${id}`,
        ),
        ...account.bot_ids.map(
            (id) => bots.find((bot) => bot.id == id)?.name || `bot ${id}`,
        ),
    ];

    return names.length ? names.join(", ") : "Only your runs";
}

/**
 * One app's sign-ins: the viewer's own, and any given out to a place they
 * reach. An account opens its own modal: its name, where it may be used,
 * and disconnecting it.
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

    return (
        <Stack className="w-full gap-2! items-stretch pl-14 pr-4">
            {accounts.length ? (
                <Row className="flex-wrap items-center gap-2!">
                    {accounts.map((account) => (
                        <Button
                            key={account.id}
                            title={`${account.label}: ${accountReach({ account, targets, bots })}`}
                            type="button"
                            variant="outlined"
                            color="gray"
                            size="small"
                            className="gap-2! w-full"
                            onClick={() => setOpenAccount(account)}
                            buttonContentProps={{ className: "w-full" }}
                        >
                            <Row className="w-full justify-between">
                                <Row>
                                    <CircleUser size={14} aria-hidden />
                                    <Span className="text-sm text-ink">
                                        {account.label}
                                    </Span>
                                </Row>

                                <Row>
                                    <Span className="text-xs text-ink-secondary">
                                        {isShared({ account })
                                            ? accountReach({
                                                  account,
                                                  targets,
                                                  bots,
                                              })
                                            : "Only your runs"}
                                    </Span>
                                    {account.status != "connected" ? (
                                        <Span className="text-xs text-hue-red">
                                            <CircleAlert
                                                size={12}
                                                aria-hidden
                                                className="mr-1 inline"
                                            />
                                            {statusOf(account.status)}
                                        </Span>
                                    ) : null}
                                </Row>
                            </Row>
                        </Button>
                    ))}
                </Row>
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
