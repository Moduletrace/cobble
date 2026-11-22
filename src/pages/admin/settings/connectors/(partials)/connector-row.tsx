import { useState } from "react";
import Stack from "@moduletrace/twui/layout/Stack";
import { Users } from "lucide-react";
import type {
    ConnectorAccess,
    ConnectorAccountRecord,
    ConnectorRecord,
    ExtensionTargets,
} from "@/src/types";
import ExtensionStatusLine from "../../(partials)/extension-status-line";
import SettingsListRow from "../../(partials)/settings-list-row";
import SettingsRowMenu from "../../(partials)/settings-row-menu";
import SettingsRowMenuItem from "../../(partials)/settings-row-menu-item";
import SettingsRowMenuPanel from "../../(partials)/settings-row-menu-panel";
import checkedAgo from "../../(utils)/checked-ago";
import ConnectorAccessModal from "./connector-access-modal";
import ConnectorAccounts from "./connector-accounts";
import ConnectorLogo from "./connector-logo";

type Props = {
    connector: ConnectorRecord;
    connection_name: string;
    accounts: ConnectorAccountRecord[];
    access: ConnectorAccess | undefined;
    targets: ExtensionTargets;
    bots: { id: number; name: string }[];
    onChanged: (msg: string) => void | Promise<void>;
    onError: (msg: string) => void;
    onNote: (msg: string) => void;
    onRefresh: () => Promise<void>;
};

/**
 * One app a connected provider offers: where it reaches, whether its tools
 * were read, and the viewer's own accounts for it. Its one action is who
 * gets it: the app itself belongs to the provider, not to this install.
 */
export default function ConnectorRow({
    connector,
    connection_name,
    accounts,
    access,
    targets,
    bots,
    onChanged,
    onError,
    onNote,
    onRefresh,
}: Props) {
    const [open, setOpen] = useState<"access">();

    const saved = async (msg: string) => {
        setOpen(undefined);
        await onChanged(msg);
    };

    const provider = connection_name || connector.provider;
    const tools = `${connector.tools.length} ${connector.tools.length == 1 ? "tool" : "tools"}`;
    const when = connector.last_synced_at
        ? ` · checked ${checkedAgo({ at: connector.last_synced_at })}`
        : "";
    const reaches = [
        connector.all_bots ? "Every bot, every user" : "",
        ...(access?.workspace_ids.length
            ? [
                  `${access.workspace_ids.length} ${access.workspace_ids.length == 1 ? "workspace" : "workspaces"}`,
              ]
            : []),
        ...(access?.bot_ids.length
            ? [
                  `Your runs on ${access.bot_ids.length} ${access.bot_ids.length == 1 ? "bot" : "bots"}`,
              ]
            : []),
    ]
        .filter(Boolean)
        .join(" · ");
    const has_reach = Boolean(reaches);
    const given = accounts.filter(
        (account) => account.all_bots || account.bot_ids.length || account.workspace_ids.length,
    ).length;
    const status =
        connector.status == "ready"
            ? { text: `Ready · ${tools}${when}` }
            : connector.status == "error"
              ? {
                    text: `Couldn't read its tools${when}`,
                    error: connector.last_error,
                }
              : undefined;

    return (
        <Stack className="w-full gap-2! items-stretch border-0 border-b border-solid border-hairline pb-3 last:border-b-0">
            <SettingsListRow
                avatar={<ConnectorLogo logo={connector.logo} name={connector.name} />}
                title={connector.name}
                subtitle={[
                    provider,
                    reaches ||
                        (given
                            ? `Through ${given} ${given == 1 ? "account" : "accounts"} given out`
                            : "Not given to a bot yet"),

                    accounts.length
                        ? `${accounts.length} ${accounts.length == 1 ? "connection" : "connections"}`
                        : "",
                ]
                    .filter(Boolean)
                    .join(" · ")}
            >
                <SettingsRowMenu title={`${connector.name} menu`}>
                    <SettingsRowMenuPanel>
                        <SettingsRowMenuItem
                            icon={Users}
                            title="Who gets it"
                            onClick={() => setOpen("access")}
                        />
                    </SettingsRowMenuPanel>
                </SettingsRowMenu>
            </SettingsListRow>

            {status && (has_reach || connector.status == "error") ? (
                <ExtensionStatusLine
                    state={connector.status == "ready" ? "ok" : "error"}
                    {...status}
                />
            ) : null}

            <ConnectorAccounts
                connector={connector}
                accounts={accounts}
                targets={targets}
                bots={bots}
                onChanged={async (msg) => {
                    await onRefresh();
                    onNote(msg);
                }}
                onError={onError}
            />
            {open == "access" ? (
                <ConnectorAccessModal
                    connector={connector}
                    access={access}
                    targets={targets}
                    bots={bots}
                    onSaved={saved}
                    onCancel={() => setOpen(undefined)}
                />
            ) : null}
        </Stack>
    );
}
