import { useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Stack from "@moduletrace/twui/layout/Stack";
import { Cloud, Pencil, Trash2 } from "lucide-react";
import IconTile from "@/src/components/general/icon-tile";
import { ConnectorProviders } from "@/src/dict/connector-dict";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { ConnectorConnectionRecord, ConnectorConnectionsPayload } from "@/src/types";
import checkedAgo from "../../(utils)/checked-ago";
import ExtensionStatusLine from "../../(partials)/extension-status-line";
import SettingsListRow from "../../(partials)/settings-list-row";
import SettingsRowMenu from "../../(partials)/settings-row-menu";
import SettingsRowMenuItem from "../../(partials)/settings-row-menu-item";
import SettingsRowMenuPanel from "../../(partials)/settings-row-menu-panel";
import ConnectorConnectionModal from "./connector-connection-modal";

type Props = {
    connection: ConnectorConnectionRecord;
    can_edit: boolean;
    onChanged: (msg: string) => void | Promise<void>;
    onError: (msg: string) => void;
};

/**
 * One provider connection: its own key, and how many of its apps are
 * synced. Its apps are on its own page rather than under the row, since one
 * connection can hold thousands.
 */
export default function ConnectorConnectionRow({ connection, can_edit, onChanged, onError }: Props) {
    const [busy, setBusy] = useState(false);
    const [editing, setEditing] = useState(false);
    const preset = ConnectorProviders.find((entry) => entry.value == connection.provider);
    const provider = preset?.title || connection.provider;
    const when = connection.last_synced_at ? ` · ${checkedAgo({ at: connection.last_synced_at })}` : "";
    const apps = `${connection.app_count} ${connection.app_count == 1 ? "app" : "apps"}`;
    const given = connection.apps_given ? `${connection.apps_given} given out` : "none given out yet";

    const subtitle = !connection.has_key
        ? `${provider} · no key yet`
        : connection.status == "ready"
          ? `${provider} · ${apps} · ${given}${when}`
          : connection.status == "untested"
            ? `${provider} · key ready, not read yet`
            : `${provider} · its key was refused`;

    const post = async (path: string, body: Record<string, unknown>, msg: string, confirm?: string) => {
        if (busy || (confirm && !window.confirm(confirm))) return;

        setBusy(true);
        const res = await postAdminApi<ConnectorConnectionsPayload>({ path, body });
        setBusy(false);

        if (res.success && res.singleRes) await onChanged(res.msg || msg);
        else onError(res.msg || "The provider didn't answer.");
    };

    return (
        <Stack className="w-full gap-2! items-stretch border-0 border-b border-solid border-hairline pb-3 last:border-b-0">
            <SettingsListRow
                avatar={<IconTile Icon={Cloud} />}
                title={connection.name}
                href={`/admin/settings/connectors/${connection.id}`}
                subtitle={subtitle}
                badge={connection.has_key ? undefined : "No key"}
            >
                {can_edit ? (
                    <>
                        <Button
                            title={connection.app_count ? `Read ${connection.name}'s apps again` : `Read ${connection.name}'s apps`}
                            type="button"
                            variant="ghost"
                            color="gray"
                            size="small"
                            disabled={busy || !connection.has_key}
                            onClick={() =>
                                post("connectors/sync-connection", { connection_id: connection.id }, "Synced.")
                            }
                            className="gap-1!"
                        >
                            {connection.app_count ? "Sync apps" : "Connect"}
                        </Button>
                        <SettingsRowMenu title={`${connection.name} menu`} disabled={busy}>
                            <SettingsRowMenuPanel>
                                <SettingsRowMenuItem icon={Pencil} title="Edit" onClick={() => setEditing(true)} />
                                <SettingsRowMenuItem
                                    icon={Trash2}
                                    title="Delete"
                                    description="Delete it with the apps it read. Bots lose them at once."
                                    onClick={() =>
                                        post(
                                            "connectors/delete-connection",
                                            { connection_id: connection.id },
                                            "Deleted.",
                                            `Delete ${connection.name}? Its ${apps} and everything given them go too.`,
                                        )
                                    }
                                />
                            </SettingsRowMenuPanel>
                        </SettingsRowMenu>
                    </>
                ) : null}
            </SettingsListRow>
            {connection.status == "error" ? (
                <ExtensionStatusLine
                    state="error"
                    text={`Couldn't list ${connection.name}'s apps${when}`}
                    error={connection.last_error}
                />
            ) : null}
            {editing ? (
                <ConnectorConnectionModal
                    connection={connection}
                    onSaved={async (msg) => {
                        setEditing(false);
                        await onChanged(msg);
                    }}
                    onCancel={() => setEditing(false)}
                />
            ) : null}
        </Stack>
    );
}