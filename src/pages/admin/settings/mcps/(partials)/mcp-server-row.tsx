import { useState } from "react";
import Stack from "@moduletrace/twui/layout/Stack";
import { Pencil, Plug, RefreshCw, Trash2, Users } from "lucide-react";
import IconTile from "@/src/components/general/icon-tile";
import { McpTransports } from "@/src/dict/mcp-dict";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { ExtensionTargets, McpServersOverviewPayload, PublicMcpServer } from "@/src/types";
import ExtensionStatusLine from "../../(partials)/extension-status-line";
import ExtensionAccessModal from "../../(partials)/extension-access-modal";
import SettingsListRow from "../../(partials)/settings-list-row";
import SettingsRowMenu from "../../(partials)/settings-row-menu";
import SettingsRowMenuItem from "../../(partials)/settings-row-menu-item";
import SettingsRowMenuPanel from "../../(partials)/settings-row-menu-panel";
import checkedAgo from "../../(utils)/checked-ago";
import extensionAccessLabel from "../../(utils)/extension-access-label";
import updatedAgo from "../../(utils)/updated-ago";
import McpServerModal from "./mcp-server-modal";

type Props = {
    server: PublicMcpServer;
    targets: ExtensionTargets;
    onChanged: (overview: McpServersOverviewPayload, msg: string) => void;
    onError: (msg: string) => void;
    /**
     * Whether it is picked for an export.
     */
    selected?: boolean;
    onSelected?: (checked: boolean) => void;
};

/**
 * One MCP server: how it's reached and who gets it, and under it whether
 * it connected (when it was last checked, and why it failed). Its actions
 * live in the three-dot menu: edit, who gets it, refreshing its tools and
 * deleting it.
 */
export default function McpServerRow({ selected, onSelected, server, targets, onChanged, onError }: Props) {
    const [open, setOpen] = useState<"edit" | "access">();
    const [busy, setBusy] = useState(false);

    const post = async ({ path, body, confirm }: { path: string; body: Record<string, unknown>; confirm?: string }) => {
        if (busy || (confirm && !window.confirm(confirm))) return;

        setBusy(true);
        const res = await postAdminApi<McpServersOverviewPayload>({ path, body });
        setBusy(false);

        if (res.success && res.singleRes) onChanged(res.singleRes, res.msg || "Done.");
        else onError(res.msg || "That didn't work.");
    };

    const saved = (overview: McpServersOverviewPayload, msg: string) => {
        setOpen(undefined);
        onChanged(overview, msg);
    };

    const tools = `${server.tools.length} ${server.tools.length == 1 ? "tool" : "tools"}`;
    const when = server.last_synced_at ? ` · checked ${checkedAgo({ at: server.last_synced_at })}` : "";
    const status =
        server.status == "ok"
            ? { text: `Connected · ${tools}${when}` }
            : server.status == "error"
              ? { text: `Couldn't connect${when}`, error: server.last_error }
              : { text: server.enabled ? "Not connected yet: Refresh to connect." : "Not connected yet." };

    return (
        <Stack className="w-full gap-0! items-stretch border-0 border-b border-solid border-hairline last:border-b-0">
            <SettingsListRow
                selected={selected}
                onSelected={onSelected}
                avatar={<IconTile Icon={Plug} />}
                title={server.name}
                badge={server.enabled ? undefined : "Off"}
                subtitle={[
                    McpTransports.find((t) => t.value == server.transport)?.title,
                    extensionAccessLabel({ access: server.access }),
                    updatedAgo({ at: server.updated_at }),
                ]
                    .filter(Boolean)
                    .join(" · ")}
            >
                <SettingsRowMenu title={`${server.name} menu`} disabled={busy}>
                    <SettingsRowMenuPanel>
                        {targets.can_edit ? (
                            <SettingsRowMenuItem icon={Pencil} title="Edit" onClick={() => setOpen("edit")} />
                        ) : null}
                        <SettingsRowMenuItem icon={Users} title="Who gets it" onClick={() => setOpen("access")} />
                        {targets.can_edit ? (
                            <SettingsRowMenuItem
                                icon={RefreshCw}
                                title="Refresh"
                                description="List its tools again."
                                disabled={!server.enabled}
                                loading={busy}
                                onClick={() => post({ path: "mcps/sync-mcp", body: { mcp_server_id: server.id } })}
                            />
                        ) : null}
                        {targets.can_edit ? (
                            <SettingsRowMenuItem
                                icon={Trash2}
                                title="Delete"
                                description="Delete it. Bots lose its tools at once."
                                onClick={() =>
                                    post({
                                        path: "mcps/delete-mcp",
                                        body: { mcp_server_id: server.id },
                                        confirm: `Delete ${server.name}? Bots lose its tools at once.`,
                                    })
                                }
                            />
                        ) : null}
                    </SettingsRowMenuPanel>
                </SettingsRowMenu>
            </SettingsListRow>
            <ExtensionStatusLine state={server.status} {...status} />
            {open == "edit" ? (
                <McpServerModal
                    server={server}
                    busy={busy}
                    onReinstall={() =>
                        post({
                            path: "mcps/sync-mcp",
                            body: { mcp_server_id: server.id, reinstall: true },
                            confirm: `Run ${server.name}'s setup command again?`,
                        })
                    }
                    onSaved={saved}
                    onCancel={() => setOpen(undefined)}
                />
            ) : null}
            {open == "access" ? (
                <ExtensionAccessModal<McpServersOverviewPayload>
                    id={server.id}
                    name={server.name}
                    access={server.access}
                    targets={targets}
                    path="mcps/set-mcp-access"
                    onSaved={saved}
                    onCancel={() => setOpen(undefined)}
                />
            ) : null}
        </Stack>
    );
}
