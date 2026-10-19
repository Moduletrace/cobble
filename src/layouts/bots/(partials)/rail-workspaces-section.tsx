import { useContext } from "react";
import Span from "@moduletrace/twui/layout/Span";
import type { WorkspaceWithActivity } from "@/src/types";
import { AddFlowContext } from "../(data)/add-flow-context";
import RailSectionAddButton from "./rail-section-add-button";
import RailSectionLabel from "./rail-section-label";
import WorkspaceRow from "./workspace-row";

type Props = {
    workspaces: WorkspaceWithActivity[];
    selected_id?: number;
};

/**
 * The user's workspaces, with a "+" to create one.
 */
export default function RailWorkspacesSection({ workspaces, selected_id }: Props) {
    const { openForm } = useContext(AddFlowContext);

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
            {workspaces.map((workspace) => (
                <WorkspaceRow key={workspace.id} workspace={workspace} selected={workspace.id == selected_id} />
            ))}
            {workspaces.length ? null : (
                <Span className="hidden @rail:block px-3 py-2 text-[13px] leading-[18px] text-ink-secondary">
                    No workspaces yet. A workspace keeps a project's context, bots and computers together.
                </Span>
            )}
        </>
    );
}
