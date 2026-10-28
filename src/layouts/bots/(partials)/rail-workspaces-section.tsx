import { useContext, useState } from "react";
import Span from "@moduletrace/twui/layout/Span";
import { AppData } from "@/src/data/app-data";
import { AppContext } from "@/src/pages/__root";
import orderRailWorkspaces from "@/src/utils/order-rail-workspaces";
import type { WorkspaceWithActivity } from "@/src/types";
import { AddFlowContext } from "../(data)/add-flow-context";
import AllWorkspacesModal from "./all-workspaces-modal";
import RailSectionAddButton from "./rail-section-add-button";
import RailSectionLabel from "./rail-section-label";
import RailSeeAllRow from "./rail-see-all-row";
import RailSeeAllWorkspace from "./rail-see-all-workspace";
import WorkspaceRow from "./workspace-row";

type Props = {
    workspaces: WorkspaceWithActivity[];
    selected_id?: number;
};

/**
 * The user's workspaces, with a "+" to create one: the last visited one
 * first, then the rest up to `AppData.RailRecentWorkspaces`, then "See all
 * workspaces" for the others, which lists them all in a modal.
 */
export default function RailWorkspacesSection({ workspaces: listed, selected_id }: Props) {
    const { openForm } = useContext(AddFlowContext);
    const { pageProps } = useContext(AppContext);
    const workspaces = orderRailWorkspaces({
        workspaces: listed,
        first_id: pageProps?.last_visited_workspace_id,
    });
    const [open, setOpen] = useState(false);
    const shown = workspaces.slice(0, AppData.RailRecentWorkspaces);
    const hidden = workspaces.slice(AppData.RailRecentWorkspaces);

    return (
        <>
            <RailSectionLabel
                title="Workspaces"
                action={
                    <RailSectionAddButton
                        title="Create a workspace"
                        onClick={() => openForm({ kind: "workspace" })}
                    />
                }
            />
            {shown.map((workspace) => (
                <WorkspaceRow key={workspace.id} workspace={workspace} selected={workspace.id == selected_id} />
            ))}
            {workspaces.length ? null : (
                <Span className="hidden @rail:block px-3 py-2 text-[13px] leading-[18px] text-ink-secondary">
                    No workspaces yet. A workspace keeps a project's context, bots and computers together.
                </Span>
            )}
            {hidden.length ? (
                <RailSeeAllRow
                    stones={hidden.slice(0, AppData.RailSeeAllStones).map((workspace) => (
                        <RailSeeAllWorkspace key={workspace.id} workspace={workspace} />
                    ))}
                    label={`See all ${workspaces.length} workspaces`}
                    onOpen={() => setOpen(true)}
                />
            ) : null}
            <AllWorkspacesModal open={open} setOpen={setOpen} workspaces={workspaces} />
        </>
    );
}
