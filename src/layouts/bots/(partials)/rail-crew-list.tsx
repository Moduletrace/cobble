import type { BotWithLastMessage } from "@/src/types";
import CoordinatorRow from "./coordinator-row";
import BotRow from "./bot-row";

type Props = {
    bots: BotWithLastMessage[];
    selected_id?: number;
};

/**
 * The pinned coordinator, then the crew.
 */
export default function RailCrewList({ bots, selected_id }: Props) {
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
            {workers.map((bot) => (
                <BotRow
                    key={bot.id}
                    bot={bot}
                    selected={bot.id === selected_id}
                />
            ))}
        </>
    );
}
