import { useContext, useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import { Plus, Upload } from "lucide-react";
import { AppContext } from "@/src/pages/__root";
import type { CustomToolsOverviewPayload, ExtensionImportApplyPayload } from "@/src/types";
import SettingsGroup from "../../(partials)/settings-group";
import SettingsList from "../../(partials)/settings-list";
import SettingsStatus from "../../(partials)/settings-status";
import ExtensionBundleBar from "../../(partials)/extension-bundle-bar";
import ImportBundleModal from "../../(partials)/import-bundle-modal";
import useExtensionSelection from "../../(hooks)/use-extension-selection";
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
    const [importing, setImporting] = useState(false);
    const selection = useExtensionSelection();

    if (!overview) return null;

    const changed = (next: CustomToolsOverviewPayload, msg: string) => {
        setOverview(next);
        setStatus({ success: true, msg });
        setVersion((prev) => prev + 1);
    };
    const failed = (msg: string) => setStatus({ error: true, msg });
    const ids = overview.tools.map((row) => row.id);

    return (
        <SettingsGroup
            title="Tools"
            description="An API call, a script on the bot's computer, or a prompt. A tool goes to the bots and workspaces it's attached to (give one to a bot on its settings page or in its chat); one set to every bot goes to every bot by default."
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
            {overview.can_edit ? (
                <ExtensionBundleBar
                    kind="tool"
                    one="tool"
                    label="tools"
                    ids={ids}
                    selected={selection.selected}
                    onSelectAll={() => selection.all({ ids })}
                    onClear={selection.clear}
                    onExported={(msg) => setStatus({ success: true, msg })}
                    onError={failed}
                />
            ) : null}
            {importing ? (
                <ImportBundleModal
                    kind="tool"
                    label="tools"
                    onImported={(payload: ExtensionImportApplyPayload, msg) => {
                        if (payload.kind === "tool") changed(payload.overview, msg);
                    }}
                    onClose={() => setImporting(false)}
                />
            ) : null}
            <SettingsList is_empty={!overview.tools.length} empty="No tools yet.">
                {overview.tools.map((tool) => (
                    <CustomToolRow
                        key={`${tool.id}-${version}`}
                        selected={overview.can_edit ? selection.has({ id: tool.id }) : undefined}
                        onSelected={overview.can_edit ? (checked) => selection.toggle({ id: tool.id, checked }) : undefined}
                        tool={tool}
                        targets={overview}
                        onChanged={changed}
                        onRefreshed={setOverview}
                        onError={failed}
                        onCopied={(msg) => setStatus({ success: true, msg })}
                    />
                ))}
            </SettingsList>
            {overview.can_edit && !adding && !importing ? (
                <Row className="flex-wrap items-center gap-2! self-start">
                    <Button
                        title="Add a tool"
                        type="button"
                        variant="ghost"
                        color="gray"
                        size="small"
                        onClick={() => setAdding(true)}
                        className="gap-1!"
                    >
                        <Plus size={14} aria-hidden />
                        New tool
                    </Button>
                    <Button
                        title="Import tools from a file"
                        type="button"
                        variant="outlined"
                        color="gray"
                        size="small"
                        onClick={() => setImporting(true)}
                        className="gap-1!"
                    >
                        <Upload size={14} aria-hidden />
                        Import
                    </Button>
                </Row>
            ) : null}
            <SettingsStatus status={status} />
        </SettingsGroup>
    );
}