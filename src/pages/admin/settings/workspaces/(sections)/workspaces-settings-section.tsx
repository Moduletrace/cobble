import { useContext } from "react";
import Button from "@moduletrace/twui/layout/Button";
import { Plus } from "lucide-react";
import { AppContext } from "@/src/pages/__root";
import { AddFlowContext } from "@/src/layouts/bots/(data)/add-flow-context";
import useSettingsList from "../../(hooks)/use-settings-list";
import SettingsGroup from "../../(partials)/settings-group";
import SettingsList from "../../(partials)/settings-list";
import SettingsStatus from "../../(partials)/settings-status";
import WorkspaceSettingsRow from "../(partials)/workspace-settings-row";

/**
 * Every workspace the user has: open one to set it up (its page has its
 * context, bots, computers and models), create one, or delete one.
 */
export default function WorkspacesSettingsSection() {
    const { pageProps } = useContext(AppContext);
    const { openForm } = useContext(AddFlowContext);
    const { items, busy, status, remove } = useSettingsList({ items: pageProps?.workspaces || [] });

    return (
        <SettingsGroup
            title="Your workspaces"
            description="Bots in a workspace share its context and computers. Deleting one keeps its bots and computers."
        >
            <SettingsList is_empty={!items.length} empty="No workspaces yet.">
                {items.map((workspace) => (
                    <WorkspaceSettingsRow
                        key={workspace.id}
                        workspace={workspace}
                        busy={busy}
                        onDelete={() =>
                            remove({
                                id: workspace.id,
                                path: "workspaces/delete-workspace",
                                body: { workspace_id: workspace.id },
                                confirm: `Delete ${workspace.name || "this workspace"} and its conversations? Its bots and computers stay.`,
                            })
                        }
                    />
                ))}
            </SettingsList>
            <Button
                title="Create a workspace"
                type="button"
                variant="ghost"
                color="gray"
                size="small"
                onClick={() => openForm({ kind: "workspace" })}
                className="self-start gap-1!"
            >
                <Plus size={14} aria-hidden />
                New workspace
            </Button>
            <SettingsStatus status={status} />
        </SettingsGroup>
    );
}
