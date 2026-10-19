import { useContext, useState } from "react";
import EmptyContent from "@moduletrace/twui/elements/EmptyContent";
import { Settings } from "lucide-react";
import HeaderIconButton from "@/src/components/general/header-icon-button";
import { AppContext } from "@/src/pages/__root";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import SettingsSectionHeading from "../../../(partials)/settings-section-heading";
import SettingsShell from "../../../(partials)/settings-shell";
import WorkspaceBotsGroup from "../(partials)/workspace-bots-group";
import WorkspaceComputersGroup from "../(partials)/workspace-computers-group";
import WorkspaceDeleteGroup from "../(partials)/workspace-delete-group";
import WorkspaceDetailsGroup from "../(partials)/workspace-details-group";
import WorkspaceImageGroup from "../(partials)/workspace-image-group";
import WorkspaceModels from "../(partials)/workspace-models";

type Props = {
    /**
     * On the workspace's own page: show the link into its settings.
     */
    show_settings_link?: boolean;
};

/**
 * A workspace's page: its picture, context, bots, computers and models,
 * then deleting it. Super admins and admins manage it; a member with no
 * bots sees an empty note.
 */
export default function WorkspaceOverview({ show_settings_link }: Props) {
    const { pageProps } = useContext(AppContext);
    const [workspace, setWorkspace] = useState(pageProps?.workspace);

    if (!workspace?.id) return null;

    const workspace_id = Number(workspace.id);
    const name = workspace.name || "Workspace";
    const harnesses = pageProps?.workspace_harness_overview?.harnesses;
    const can_manage = canManageCrew({
        user_types: pageProps?.user_types,
    });

    if (!can_manage) {
        return (
            <SettingsShell
                title={name}
                description={workspace.description || "A workspace."}
            >
                <EmptyContent title="No bots here yet. An admin adds them." />
            </SettingsShell>
        );
    }

    return (
        <SettingsShell
            title={name}
            description={
                workspace.description ||
                "Context, bots, computers and models for this workspace."
            }
            breadcrumb_title={show_settings_link ? undefined : name}
            action={
                show_settings_link ? (
                    <HeaderIconButton
                        icon={Settings}
                        title="Workspace settings"
                        href={`/admin/settings/workspaces/${workspace_id}`}
                    />
                ) : undefined
            }
        >
            <WorkspaceImageGroup workspace={workspace} />
            <WorkspaceDetailsGroup workspace={workspace} onSaved={setWorkspace} />
            <WorkspaceBotsGroup
                workspace_id={workspace_id}
                workspace_name={name}
                bots={pageProps?.workspace_bots || []}
                all_bots={pageProps?.all_bots || []}
            />
            <WorkspaceComputersGroup
                workspace_id={workspace_id}
                computers={pageProps?.workspace_computers || []}
                all_computers={pageProps?.computers || []}
            />
            {harnesses?.length ? (
                <>
                    <SettingsSectionHeading
                        id="models"
                        title="Models"
                        description="Every bot working here uses these, the coordinator too. Left on “Same as the default”, each bot uses its own models, else the defaults."
                    />
                    <WorkspaceModels workspace_id={workspace_id} harnesses={harnesses} />
                </>
            ) : null}
            <WorkspaceDeleteGroup workspace={workspace} />
        </SettingsShell>
    );
}
