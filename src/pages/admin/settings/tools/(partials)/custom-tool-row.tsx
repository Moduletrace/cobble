import { useState } from "react";
import Stack from "@moduletrace/twui/layout/Stack";
import { Pencil, Play, Trash2, Users, Wrench } from "lucide-react";
import IconTile from "@/src/components/general/icon-tile";
import { CustomToolKinds } from "@/src/dict/custom-tool-dict";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { CustomToolsOverviewPayload, ExtensionTargets, PublicCustomTool } from "@/src/types";
import ExtensionStatusLine from "../../(partials)/extension-status-line";
import ExtensionAccessModal from "../../(partials)/extension-access-modal";
import SettingsListRow from "../../(partials)/settings-list-row";
import SettingsRowMenu from "../../(partials)/settings-row-menu";
import SettingsRowMenuItem from "../../(partials)/settings-row-menu-item";
import SettingsRowMenuPanel from "../../(partials)/settings-row-menu-panel";
import checkedAgo from "../../(utils)/checked-ago";
import extensionAccessLabel from "../../(utils)/extension-access-label";
import updatedAgo from "../../(utils)/updated-ago";
import CustomToolModal from "./custom-tool-modal";
import CustomToolTryModal from "./custom-tool-try-modal";

type Props = {
    tool: PublicCustomTool;
    targets: ExtensionTargets;
    onChanged: (overview: CustomToolsOverviewPayload, msg: string) => void;
    /**
     * New page data that shouldn't close what's open (a try's result).
     */
    onRefreshed: (overview: CustomToolsOverviewPayload) => void;
    onError: (msg: string) => void;
    /**
     * Whether it is picked for an export.
     */
    selected?: boolean;
    onSelected?: (checked: boolean) => void;
};

/**
 * One custom tool: its name, kind and who gets it, and under it how its
 * last run went (a bot's call or a try). Its actions live in the three-dot
 * menu: edit, who gets it, trying it and deleting it.
 */
export default function CustomToolRow({ selected, onSelected, tool, targets, onChanged, onRefreshed, onError }: Props) {
    const [open, setOpen] = useState<"edit" | "access" | "try">();
    const [busy, setBusy] = useState(false);

    const saved = (overview: CustomToolsOverviewPayload, msg: string) => {
        setOpen(undefined);
        onChanged(overview, msg);
    };

    const remove = async () => {
        if (busy || !window.confirm(`Delete ${tool.name}? Bots lose it at once.`)) return;

        setBusy(true);
        const res = await postAdminApi<CustomToolsOverviewPayload>({
            path: "tools/delete-tool",
            body: { custom_tool_id: tool.id },
        });
        setBusy(false);

        if (res.success && res.singleRes) onChanged(res.singleRes, res.msg || "Deleted.");
        else onError(res.msg || "Couldn't delete the tool.");
    };

    const when = tool.last_checked_at ? ` · ${checkedAgo({ at: tool.last_checked_at })}` : "";
    const status =
        tool.status == "ok"
            ? { text: `Last run worked${when}` }
            : tool.status == "error"
              ? { text: `Last run failed${when}`, error: tool.last_error }
              : { text: targets.can_edit ? "Not run yet: Try it to check it works." : "Not run yet." };

    return (
        <Stack className="w-full gap-0! items-stretch border-0 border-b border-solid border-hairline last:border-b-0">
            <SettingsListRow
                selected={selected}
                onSelected={onSelected}
                avatar={<IconTile Icon={Wrench} />}
                title={tool.name}
                badge={tool.enabled ? undefined : "Off"}
                subtitle={[
                    CustomToolKinds.find((k) => k.value == tool.kind)?.title,
                    extensionAccessLabel({ access: tool.access }),
                    updatedAgo({ at: tool.updated_at }),
                    tool.description,
                ]
                    .filter(Boolean)
                    .join(" · ")}
            >
                <SettingsRowMenu title={`${tool.name} menu`} disabled={busy}>
                    <SettingsRowMenuPanel>
                        {targets.can_edit ? (
                            <SettingsRowMenuItem icon={Pencil} title="Edit" onClick={() => setOpen("edit")} />
                        ) : null}
                        <SettingsRowMenuItem icon={Users} title="Who gets it" onClick={() => setOpen("access")} />
                        {targets.can_edit ? (
                            <SettingsRowMenuItem
                                icon={Play}
                                title="Try"
                                description="Run it once to check it works."
                                onClick={() => setOpen("try")}
                            />
                        ) : null}
                        {targets.can_edit ? (
                            <SettingsRowMenuItem
                                icon={Trash2}
                                title="Delete"
                                description="Delete it. Bots lose it at once."
                                onClick={remove}
                            />
                        ) : null}
                    </SettingsRowMenuPanel>
                </SettingsRowMenu>
            </SettingsListRow>
            <ExtensionStatusLine state={tool.status} {...status} />
            {open == "edit" ? (
                <CustomToolModal tool={tool} onSaved={saved} onCancel={() => setOpen(undefined)} />
            ) : null}
            {open == "access" ? (
                <ExtensionAccessModal<CustomToolsOverviewPayload>
                    id={tool.id}
                    name={tool.name}
                    access={tool.access}
                    targets={targets}
                    path="tools/set-tool-access"
                    onSaved={saved}
                    onCancel={() => setOpen(undefined)}
                />
            ) : null}
            {open == "try" ? <CustomToolTryModal tool={tool} onTried={onRefreshed} onClose={() => setOpen(undefined)} /> : null}
        </Stack>
    );
}
