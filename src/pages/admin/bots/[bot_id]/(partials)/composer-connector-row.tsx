import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import Tag from "@moduletrace/twui/elements/Tag";
import { X } from "lucide-react";
import { ConnectorAccountStatuses } from "@/src/dict/connector-dict";
import type { BotConnectorEntry, ConnectorAccountRecord } from "@/src/types";
import ConnectorLogo from "@/src/pages/admin/settings/connectors/(partials)/connector-logo";

type Props = {
    entry: BotConnectorEntry;
    /**
     * Takes it off this bot: this user's own attachment, or their own account
     * given here. Not given for a workspace's or the install's.
     */
    onRemove?: () => void;
};

const viaNote = ({ entry }: { entry: BotConnectorEntry }) =>
    entry.via == "global"
        ? "Every bot"
        : entry.via == "workspace"
          ? "From this workspace"
          : entry.via == "account"
            ? "From an account given here"
            : "Only you";

const accountNote = ({ account }: { account: ConnectorAccountRecord }) => {
    if (account.status == "connected") return account.label;

    const status =
        ConnectorAccountStatuses.find(
            (option) => option.value == account.status,
        )?.title || account.status;

    return `${account.label} · ${status}`;
};

/**
 * One connector app in the composer's tools modal: its logo, the connection it
 * came from, the account it reaches through (when one was given here rather
 * than the whole app), where it comes from, and a way to take it off the bot.
 * An app with no account says so rather than listing nothing.
 */
export default function ComposerConnectorRow({ entry, onRemove }: Props) {
    const connected = entry.accounts.filter(
        (account) => account.status == "connected",
    );
    const given =
        entry.via == "account"
            ? connected.filter(
                  (account) =>
                      account.all_bots ||
                      account.bot_ids.length ||
                      account.workspace_ids.length,
              )
            : [];
    const pending = entry.accounts.filter(
        (account) => account.status != "connected",
    );
    const subtitle = connected.length
        ? viaNote({ entry })
        : `${viaNote({ entry })} · ${
              pending.length
                  ? pending
                        .map((account) => accountNote({ account }))
                        .join(", ")
                  : "no account connected yet"
          }`;

    return (
        <Row className="w-full gap-2.5! flex-nowrap items-center px-3 py-2 border-0 border-b border-solid border-hairline last:border-b-0">
            <ConnectorLogo
                logo={entry.connector.logo}
                name={entry.connector.name}
            />
            <Stack className="grow min-w-0 gap-0.5!">
                <Row className="w-full gap-1.5! flex-nowrap items-center min-w-0">
                    <Span
                        title={entry.connector.description}
                        className="text-sm leading-5 truncate text-ink"
                    >
                        {entry.connector.name}
                    </Span>
                    {entry.connection_name ? (
                        <Tag color="success" className="shrink-0">
                            {entry.connection_name}
                        </Tag>
                    ) : null}
                    {given.map((account) => (
                        <Tag
                            key={account.id}
                            variant="outlined"
                            color="gray"
                            className="shrink-0"
                        >
                            {account.label}
                        </Tag>
                    ))}
                </Row>
                <Span className="text-xs leading-4 truncate w-full text-ink-secondary">
                    {subtitle}
                </Span>
            </Stack>
            {onRemove ? (
                <Button
                    title={`Remove ${entry.connector.name}`}
                    aria-label={`Remove ${entry.connector.name}`}
                    type="button"
                    variant="ghost"
                    color="gray"
                    size="small"
                    className="shrink-0 p-1!"
                    onClick={onRemove}
                >
                    <X size={14} aria-hidden />
                </Button>
            ) : null}
        </Row>
    );
}
