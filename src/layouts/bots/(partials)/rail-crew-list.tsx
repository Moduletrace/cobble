import { useContext } from "react";
import { AddFlowContext } from "../(data)/add-flow-context";
import { AppContext } from "@/src/pages/__root";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import type { BotWithLastMessage, WorkspaceWithActivity } from "@/src/types";
import CoordinatorRow from "./coordinator-row";
import RailBotSessions from "./rail-bot-sessions";
import RailBotsSection from "./rail-bots-section";
import RailSectionAddButton from "./rail-section-add-button";
import RailWorkspacesSection from "./rail-workspaces-section";

type Props = {
    bots: BotWithLastMessage[];
    workspaces: WorkspaceWithActivity[];
    selected_id?: number;
};

/**
 * The rail outside workspaces: the pinned coordinator, the crew (the
 * latest few, then "See all bots"), then the workspaces.
 */
export default function RailCrewList({ bots, workspaces, selected_id }: Props) {
    const { openForm } = useContext(AddFlowContext);
    const { pageProps } = useContext(AppContext);
    const coordinator = bots.find((bot) => bot.kind === "coordinator");
    const workers = bots.filter((bot) => bot.kind !== "coordinator");

    return (
        <>
            {coordinator ? (
                <>
                    <CoordinatorRow
                        bot={coordinator}
                        bots={bots}
                        selected={coordinator.id === selected_id}
                    />
                    {coordinator.id === selected_id ? (
                        <RailBotSessions key={coordinator.id} bot={coordinator} />
                    ) : null}
                </>
            ) : null}
            <RailBotsSection
                action={<RailSectionAddButton title="Add a bot" onClick={() => openForm({ kind: "bot" })} />}
                title="Bots"
                workers={workers}
                selected_id={selected_id}
                hrefFor={(bot) => `/admin/bots/${bot.id}`}
                empty={
                    canManageCrew({ user_types: pageProps?.user_types })
                        ? "No bots yet. Add one for a job you hand out often."
                        : "No bots for you yet. An admin assigns them."
                }
            />
            <RailWorkspacesSection workspaces={workspaces} />
        </>
    );
}
