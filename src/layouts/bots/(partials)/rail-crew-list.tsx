import { useContext } from "react";
import { AddFlowContext } from "../(data)/add-flow-context";
import type { BotWithLastMessage, WorkspaceWithActivity } from "@/src/types";
import CoordinatorRow from "./coordinator-row";
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
    const coordinator = bots.find((bot) => bot.kind === "coordinator");
    const workers = bots.filter((bot) => bot.kind !== "coordinator");

    return (
        <>
            {coordinator ? (
                <CoordinatorRow
                    bot={coordinator}
                    bots={bots}
                    selected={coordinator.id === selected_id}
                />
            ) : null}
            <RailBotsSection
                action={<RailSectionAddButton title="Add a bot" onClick={() => openForm({ kind: "bot" })} />}
                title="Bots"
                workers={workers}
                selected_id={selected_id}
                hrefFor={(bot) => `/admin/bots/${bot.id}`}
                empty="No bots yet. Add one for a job you hand out often."
            />
            <RailWorkspacesSection workspaces={workspaces} />
        </>
    );
}
