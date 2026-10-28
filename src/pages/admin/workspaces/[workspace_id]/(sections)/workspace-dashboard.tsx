import { useContext } from "react";
import { Settings } from "lucide-react";
import HeaderIconButton from "@/src/components/general/header-icon-button";
import { AppContext } from "@/src/pages/__root";
import SettingsShell from "@/src/pages/admin/settings/(partials)/settings-shell";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import WorkspaceAboutGroup from "../(partials)/workspace-about-group";
import WorkspaceActivityGroup from "../(partials)/workspace-activity-group";
import WorkspaceBotsListGroup from "../(partials)/workspace-bots-list-group";
import WorkspaceComputersListGroup from "../(partials)/workspace-computers-list-group";
import WorkspaceTasksGroup from "../(partials)/workspace-tasks-group";

/**
 * A workspace's dashboard: a read-only summary of its picture and context,
 * its latest activity, its bots and its computers. Everything editable
 * lives under Settings, reached from the header.
 */
export default function WorkspaceDashboard() {
    const { pageProps } = useContext(AppContext);
    const workspace = pageProps?.workspace;

    if (!workspace?.id) return null;

    const workspace_id = Number(workspace.id);
    const can_manage = canManageCrew({ user_types: pageProps?.user_types });

    return (
        <SettingsShell
            title={workspace.name || "Workspace"}
            description="A workspace at a glance: what it is, what's happening, its bots and computers."
            action={
                can_manage ? (
                    <HeaderIconButton
                        icon={Settings}
                        title="Workspace settings"
                        href={`/admin/settings/workspaces/${workspace_id}`}
                    />
                ) : undefined
            }
        >
            <WorkspaceAboutGroup workspace={workspace} />
            <WorkspaceTasksGroup
                workspace_id={workspace_id}
                tasks={pageProps?.workspace_tasks || []}
                bots={pageProps?.workspace_bots || []}
            />
            <WorkspaceActivityGroup
                workspace_id={workspace_id}
                activity={pageProps?.workspace_activity || []}
            />
            <WorkspaceBotsListGroup
                workspace_id={workspace_id}
                bots={pageProps?.workspace_bots || []}
            />
            <WorkspaceComputersListGroup
                computers={pageProps?.workspace_computers || []}
                linked={can_manage}
            />
        </SettingsShell>
    );
}
