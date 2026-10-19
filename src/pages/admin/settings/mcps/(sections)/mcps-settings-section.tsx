import { useContext, useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import { Plus } from "lucide-react";
import { AppContext } from "@/src/pages/__root";
import type { McpServersOverviewPayload } from "@/src/types";
import SettingsGroup from "../../(partials)/settings-group";
import SettingsList from "../../(partials)/settings-list";
import SettingsStatus from "../../(partials)/settings-status";
import McpServerModal from "../(partials)/mcp-server-modal";
import McpServerRow from "../(partials)/mcp-server-row";

type Status = { error?: boolean; success?: boolean; msg?: string };

/**
 * Every MCP server with who gets it. Super admins add, edit, refresh and
 * delete them; admins choose which bots and workspaces get each one.
 */
export default function McpsSettingsSection() {
    const { pageProps } = useContext(AppContext);
    const [overview, setOverview] = useState(pageProps?.mcps_overview);
    const [adding, setAdding] = useState(false);
    const [status, setStatus] = useState<Status>();
    /**
     * Remounts the rows when the data changes under them.
     */
    const [version, setVersion] = useState(0);

    if (!overview) return null;

    const changed = (next: McpServersOverviewPayload, msg: string) => {
        setOverview(next);
        setStatus({ success: true, msg });
        setVersion((prev) => prev + 1);
    };
    const failed = (msg: string) => setStatus({ error: true, msg });

    return (
        <SettingsGroup
            title="MCP servers"
            description="A server's tools go to the bots and workspaces it's attached to (give one to a bot on its settings page or in its chat); one set to every bot goes to every bot by default. Bots only connect when they call one."
        >
            {adding ? (
                <McpServerModal
                    onSaved={(next, msg) => {
                        setAdding(false);
                        changed(next, msg);
                    }}
                    onCancel={() => setAdding(false)}
                />
            ) : null}
            <SettingsList is_empty={!overview.servers.length} empty="No MCP servers yet.">
                {overview.servers.map((server) => (
                    <McpServerRow
                        key={`${server.id}-${version}`}
                        server={server}
                        targets={overview}
                        onChanged={changed}
                        onError={failed}
                    />
                ))}
            </SettingsList>
            {overview.can_edit && !adding ? (
                <Button
                    title="Add an MCP server"
                    type="button"
                    variant="ghost"
                    color="gray"
                    size="small"
                    onClick={() => setAdding(true)}
                    className="self-start gap-1!"
                >
                    <Plus size={14} aria-hidden />
                    New MCP server
                </Button>
            ) : null}
            <SettingsStatus status={status} />
        </SettingsGroup>
    );
}
