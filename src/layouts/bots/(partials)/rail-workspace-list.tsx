import Divider from "@moduletrace/twui/layout/Divider";
import { useContext } from "react";
import { AddFlowContext } from "../(data)/add-flow-context";
import type { BotWithLastMessage, WorkspaceWithActivity } from "@/src/types";
import CoordinatorRow from "./coordinator-row";
import RailBackLink from "./rail-back-link";
import RailBotCard from "./rail-bot-card";
import RailBotSessions from "./rail-bot-sessions";
import RailBotsSection from "./rail-bots-section";
import RailSectionAddButton from "./rail-section-add-button";
import WorkspaceRow from "./workspace-row";
import RailChatroomsSection from "./rail-chatrooms-section";

type Props = {
    workspace: WorkspaceWithActivity;
    /**
     * The workspace's crew: the bots attached to the workspace, plus (for
     * the super admin, who works in every workspace) the coordinator.
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
 * page), the coordinator working in it, the workspace's bots, then the
 * chatrooms asked from here. Every conversation here runs with the
 * workspace's context.
 */
export default function RailWorkspaceList({
    workspace,
    bots,
    selected_id,
    on_workspace_page,
}: Props) {
    const { openLinkBots } = useContext(AddFlowContext);
    const coordinator = bots.find((bot) => bot.kind === "coordinator");
    const workers = bots.filter((bot) => bot.kind !== "coordinator");
    const base = `/admin/workspaces/${workspace.id}`;

    return (
        <>
            <RailBackLink
                title={
                    on_workspace_page ? "All bots" : `Back to ${workspace.name}`
                }
                href={on_workspace_page ? undefined : base}
            />
            {/* <Divider className="shrink-0 mx-1 @rail:mx-3 my-2 w-auto border-hairline dark:border-hairline" /> */}
            <WorkspaceRow
                workspace={{ ...workspace, unread: 0 }}
                selected={on_workspace_page}
            />
            {coordinator ? (
                <RailBotCard selected={coordinator.id === selected_id}>
                    <CoordinatorRow
                        bot={coordinator}
                        bots={bots}
                        href={`${base}/bots/${coordinator.id}`}
                        selected={coordinator.id === selected_id}
                    />
                    {coordinator.id === selected_id ? (
                        <RailBotSessions
                            key={coordinator.id}
                            bot={coordinator}
                            workspace_id={Number(workspace.id)}
                        />
                    ) : null}
                </RailBotCard>
            ) : null}
            <RailBotsSection
                action={
                    <RailSectionAddButton
                        title="Add bots to this workspace"
                        onClick={openLinkBots}
                    />
                }
                title="Workspace bots"
                workers={workers}
                selected_id={on_workspace_page ? undefined : selected_id}
                workspace_id={workspace.id ? Number(workspace.id) : null}
                hrefFor={(bot) => `${base}/bots/${bot.id}`}
                empty="No bots here yet."
            />
            <RailChatroomsSection workspace_id={workspace.id ? Number(workspace.id) : null} />
        </>
    );
}
