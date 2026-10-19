import { useContext, useState } from "react";
import { AppContext } from "@/src/pages/__root";
import SettingsShell from "@/src/pages/admin/settings/(partials)/settings-shell";
import WorkspaceBotsGroup from "../(partials)/workspace-bots-group";
import WorkspaceComputersGroup from "../(partials)/workspace-computers-group";
import WorkspaceDeleteGroup from "../(partials)/workspace-delete-group";
import WorkspaceDetailsGroup from "../(partials)/workspace-details-group";
import WorkspaceImageGroup from "../(partials)/workspace-image-group";
import WorkspaceModels from "../(partials)/workspace-models";
import WorkspaceSectionHeading from "../(partials)/workspace-section-heading";

/**
 * A workspace's page beside its rail: its context, bots, computers, then
 * its models, and deleting it.
 */
export default function WorkspaceOverview() {
    const { pageProps } = useContext(AppContext);
    const [workspace, setWorkspace] = useState(pageProps?.workspace);

    if (!workspace?.id) return null;

    const workspace_id = Number(workspace.id);
    const harnesses = pageProps?.workspace_harness_overview?.harnesses;

    return (
        <SettingsShell
            title={workspace.name || "Workspace"}
            description={workspace.description || "Context, bots, computers and models for this workspace."}
        >
            <WorkspaceImageGroup workspace={workspace} />
            <WorkspaceDetailsGroup workspace={workspace} onSaved={setWorkspace} />
            <WorkspaceBotsGroup
                workspace_id={workspace_id}
                workspace_name={workspace.name || "this workspace"}
                bots={pageProps?.workspace_bots || []}
                all_bots={pageProps?.all_bots || []}
            />
            <WorkspaceComputersGroup
                workspace_id={workspace_id}
                computers={pageProps?.workspace_computers || []}
                all_computers={pageProps?.computers || []}
            />
            <WorkspaceDeleteGroup workspace={workspace} />
            {harnesses?.length ? (
                <>
                    <WorkspaceSectionHeading
                        title="Models"
                        description="Every bot working here uses these, the coordinator too. Left on “Same as the default”, each bot uses its own models, else the defaults."
                    />
                    <WorkspaceModels workspace_id={workspace_id} harnesses={harnesses} />
                </>
            ) : null}
        </SettingsShell>
    );
}
