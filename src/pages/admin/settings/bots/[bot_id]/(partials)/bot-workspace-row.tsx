import WorkspaceAvatar from "@/src/components/general/workspace-avatar";
import AdminShield from "@/src/components/general/admin-shield";
import type { BotWorkspace } from "@/src/types";
import SettingsListRow from "../../../(partials)/settings-list-row";
import SettingsRowAction from "../../../(partials)/settings-row-action";

type Props = {
    workspace: BotWorkspace;
    busy?: boolean;
    /**
     * Opens what the bot has for this workspace alone.
     */
    onEdit?: () => void;
    onRemove?: () => void;
};

/**
 * One workspace the bot works in. Its title opens the workspace's
 * settings; its instructions and memory there are edited from here, and a
 * worker can be taken out.
 */
export default function BotWorkspaceRow({
    workspace,
    busy,
    onEdit,
    onRemove,
}: Props) {
    const name = workspace.name || `Workspace ${workspace.id}`;
    const has_own = Boolean(
        workspace.workspace_system_prompt || workspace.workspace_memory,
    );

    return (
        <SettingsListRow
            avatar={
                <WorkspaceAvatar
                    image_media_id={workspace.image_media_id}
                    size="sm"
                />
            }
            href={`/admin/settings/workspaces/${workspace.id}`}
            title={name}
            title_icon={workspace.is_admin ? <AdminShield label="Admin of this workspace" /> : undefined}
            subtitle={
                has_own
                    ? "Has instructions for this workspace"
                    : workspace.description || "Uses the workspace's context"
            }
        >
            {onEdit ? (
                <SettingsRowAction
                    title={`Instructions and memory in ${name}`}
                    label="Instructions"
                    disabled={busy}
                    onClick={onEdit}
                />
            ) : null}
            {onRemove ? (
                <SettingsRowAction
                    title={`Take ${name} out of this workspace`}
                    label="Remove"
                    disabled={busy}
                    onClick={onRemove}
                />
            ) : null}
        </SettingsListRow>
    );
}
