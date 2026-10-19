import { useContext, useState } from "react";
import { AppContext } from "@/src/pages/__root";
import SettingsSectionHeading from "../../../(partials)/settings-section-heading";
import SettingsShell from "../../../(partials)/settings-shell";
import WorkspaceBotsGroup from "../(partials)/workspace-bots-group";
import WorkspaceComputersGroup from "../(partials)/workspace-computers-group";
import WorkspaceDeleteGroup from "../(partials)/workspace-delete-group";
import WorkspaceDetailsGroup from "../(partials)/workspace-details-group";
import WorkspaceImageGroup from "../(partials)/workspace-image-group";
import WorkspaceModels from "../(partials)/workspace-models";

/**
 * A workspace's settings: its picture, context, bots, computers and
 * models, then deleting it. Super admins and admins only.
 */
export default function WorkspaceOverview() {
    const { pageProps } = useContext(AppContext);
    const [workspace, setWorkspace] = useState(pageProps?.workspace);

    if (!workspace?.id) return null;

    const workspace_id = Number(workspace.id);
    const name = workspace.name || "Workspace";
    const harnesses = pageProps?.workspace_harness_overview?.harnesses;

    return (
        <SettingsShell
            title={name}
            description={
                workspace.description ||
                "Context, bots, computers and models for this workspace."
            }
            breadcrumb_title={name}
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
