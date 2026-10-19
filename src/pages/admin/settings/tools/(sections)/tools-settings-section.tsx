import { useContext, useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import { Plus } from "lucide-react";
import { AppContext } from "@/src/pages/__root";
import type { CustomToolsOverviewPayload } from "@/src/types";
import SettingsGroup from "../../(partials)/settings-group";
import SettingsList from "../../(partials)/settings-list";
import SettingsStatus from "../../(partials)/settings-status";
import CustomToolModal from "../(partials)/custom-tool-modal";
import CustomToolRow from "../(partials)/custom-tool-row";

type Status = { error?: boolean; success?: boolean; msg?: string };

/**
 * Every custom tool with who gets it. Super admins add, edit, try and
 * delete them; admins choose which bots and workspaces get each one.
 */
export default function ToolsSettingsSection() {
    const { pageProps } = useContext(AppContext);
    const [overview, setOverview] = useState(pageProps?.tools_overview);
    const [adding, setAdding] = useState(false);
    const [status, setStatus] = useState<Status>();
    /**
     * Remounts the rows when the data changes under them.
     */
    const [version, setVersion] = useState(0);

    if (!overview) return null;

    const changed = (next: CustomToolsOverviewPayload, msg: string) => {
        setOverview(next);
        setStatus({ success: true, msg });
        setVersion((prev) => prev + 1);
    };
    const failed = (msg: string) => setStatus({ error: true, msg });

    return (
        <SettingsGroup
            title="Tools"
            description="An API call, a script on the bot's computer, or a prompt. A tool goes to the bots and workspaces it's attached to, or to every bot."
        >
            {adding ? (
                <CustomToolModal
                    onSaved={(next, msg) => {
                        setAdding(false);
                        changed(next, msg);
                    }}
                    onCancel={() => setAdding(false)}
                />
            ) : null}
            <SettingsList is_empty={!overview.tools.length} empty="No tools yet.">
                {overview.tools.map((tool) => (
                    <CustomToolRow
                        key={`${tool.id}-${version}`}
                        tool={tool}
                        targets={overview}
                        onChanged={changed}
                        onError={failed}
                    />
                ))}
            </SettingsList>
            {overview.can_edit && !adding ? (
                <Button
                    title="Add a tool"
                    type="button"
                    variant="ghost"
                    color="gray"
                    size="small"
                    onClick={() => setAdding(true)}
                    className="self-start gap-1!"
                >
                    <Plus size={14} aria-hidden />
                    New tool
                </Button>
            ) : null}
            <SettingsStatus status={status} />
        </SettingsGroup>
    );
}
