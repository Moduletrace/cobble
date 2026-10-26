import { useState } from "react";
import Stack from "@moduletrace/twui/layout/Stack";
import { Wrench } from "lucide-react";
import IconTile from "@/src/components/general/icon-tile";
import { CustomToolKinds } from "@/src/dict/custom-tool-dict";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { CustomToolsOverviewPayload, ExtensionTargets, PublicCustomTool } from "@/src/types";
import ExtensionStatusLine from "../../(partials)/extension-status-line";
import ExtensionAccessModal from "../../(partials)/extension-access-modal";
import SettingsListRow from "../../(partials)/settings-list-row";
import SettingsRowAction from "../../(partials)/settings-row-action";
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
};

/**
 * One custom tool: its name, kind and who gets it, and under it how its
 * last run went (a bot's call or a try). Edit, Access and Try open in a
 * modal.
 */
export default function CustomToolRow({ tool, targets, onChanged, onRefreshed, onError }: Props) {
    const [open, setOpen] = useState<"edit" | "access" | "try">();
    const [busy, setBusy] = useState(false);

    const toggle = (panel: "edit" | "access" | "try") => setOpen(open == panel ? undefined : panel);

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
                {targets.can_edit ? (
                    <SettingsRowAction title={`Edit ${tool.name}`} label="Edit" disabled={busy} onClick={() => toggle("edit")} />
                ) : null}
                <SettingsRowAction
                    title={`Choose who gets ${tool.name}`}
                    label="Access"
                    disabled={busy}
                    onClick={() => toggle("access")}
                />
                {targets.can_edit ? (
                    <SettingsRowAction title={`Try ${tool.name}`} label="Try" disabled={busy} onClick={() => toggle("try")} />
                ) : null}
                {targets.can_edit ? (
                    <SettingsRowAction title={`Delete ${tool.name}`} label="Delete" disabled={busy} onClick={remove} />
                ) : null}
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
