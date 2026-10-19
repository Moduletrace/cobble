import { useState } from "react";
import Stack from "@moduletrace/twui/layout/Stack";
import { Plug } from "lucide-react";
import IconTile from "@/src/components/general/icon-tile";
import { McpTransports } from "@/src/dict/mcp-dict";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { ExtensionTargets, McpServersOverviewPayload, PublicMcpServer } from "@/src/types";
import ExtensionStatusLine from "../../(partials)/extension-status-line";
import ExtensionAccessModal from "../../(partials)/extension-access-modal";
import SettingsListRow from "../../(partials)/settings-list-row";
import SettingsRowAction from "../../(partials)/settings-row-action";
import checkedAgo from "../../(utils)/checked-ago";
import extensionAccessLabel from "../../(utils)/extension-access-label";
import McpServerModal from "./mcp-server-modal";

type Props = {
    server: PublicMcpServer;
    targets: ExtensionTargets;
    onChanged: (overview: McpServersOverviewPayload, msg: string) => void;
    onError: (msg: string) => void;
};

/**
 * One MCP server: how it's reached and who gets it, and under it whether
 * it connected (when it was last checked, and why it failed). Edit and
 * Access open in a modal.
 */
export default function McpServerRow({ server, targets, onChanged, onError }: Props) {
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
                avatar={<IconTile Icon={Plug} />}
                title={server.name}
                badge={server.enabled ? undefined : "Off"}
                subtitle={[
                    McpTransports.find((t) => t.value == server.transport)?.title,
                    extensionAccessLabel({ access: server.access }),
                ]
                    .filter(Boolean)
                    .join(" · ")}
            >
                {targets.can_edit ? (
                    <SettingsRowAction
                        title={`Edit ${server.name}`}
                        label="Edit"
                        disabled={busy}
                        onClick={() => setOpen(open == "edit" ? undefined : "edit")}
                    />
                ) : null}
                <SettingsRowAction
                    title={`Choose who gets ${server.name}`}
                    label="Access"
                    disabled={busy}
                    onClick={() => setOpen(open == "access" ? undefined : "access")}
                />
                {targets.can_edit ? (
                    <SettingsRowAction
                        title={`List ${server.name}'s tools again`}
                        label={busy ? "Connecting…" : "Refresh"}
                        disabled={busy || !server.enabled}
                        onClick={() => post({ path: "mcps/sync-mcp", body: { mcp_server_id: server.id } })}
                    />
                ) : null}
                {targets.can_edit ? (
                    <SettingsRowAction
                        title={`Delete ${server.name}`}
                        label="Delete"
                        disabled={busy}
                        onClick={() =>
                            post({
                                path: "mcps/delete-mcp",
                                body: { mcp_server_id: server.id },
                                confirm: `Delete ${server.name}? Bots lose its tools at once.`,
                            })
                        }
                    />
                ) : null}
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
