import Divider from "@moduletrace/twui/layout/Divider";
import { useContext } from "react";
import { AddFlowContext } from "../(data)/add-flow-context";
import type { BotWithLastMessage, WorkspaceWithActivity } from "@/src/types";
import RailBackLink from "./rail-back-link";
import RailBotsSection from "./rail-bots-section";
import RailSectionAddButton from "./rail-section-add-button";
import WorkspaceRow from "./workspace-row";

type Props = {
    workspace: WorkspaceWithActivity;
    /**
     * The workspace's crew: the coordinator is left out, only the bots
     * attached to the workspace show.
     */
    bots: BotWithLastMessage[];
    selected_id?: number;
    /**
     * On the workspace's own page rather than a conversation in it.
     */
    on_workspace_page?: boolean;
};

/**
 * The rail inside a workspace: back to all bots, the workspace itself (its
 * page), then the workspace's bots. Every conversation here runs with the
 * workspace's context. The coordinator is reached from the main rail.
 */
export default function RailWorkspaceList({ workspace, bots, selected_id, on_workspace_page }: Props) {
    const { openForm } = useContext(AddFlowContext);
    const workers = bots.filter((bot) => bot.kind !== "coordinator");
    const base = `/admin/workspaces/${workspace.id}`;

    return (
        <>
            <RailBackLink
                title={on_workspace_page ? "All bots" : `Back to ${workspace.name}`}
                href={on_workspace_page ? undefined : base}
            />
            <Divider className="shrink-0 mx-1 @rail:mx-3 my-2 w-auto border-hairline dark:border-hairline" />
            <WorkspaceRow workspace={{ ...workspace, unread: 0 }} selected={on_workspace_page} />
            <RailBotsSection
                action={<RailSectionAddButton title="Add a bot to this workspace" onClick={() => openForm({ kind: "bot" })} />}
                title="Workspace bots"
                workers={workers}
                selected_id={on_workspace_page ? undefined : selected_id}
                hrefFor={(bot) => `${base}/bots/${bot.id}`}
                empty="No bots here yet."
            />
        </>
    );
}
