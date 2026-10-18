import { useContext } from "react";
import Stack from "@moduletrace/twui/layout/Stack";
import { AppContext } from "@/src/pages/__root";
import RailHeader from "../(partials)/rail-header";
import CoordinatorRow from "../(partials)/coordinator-row";
import BotRow from "../(partials)/bot-row";
import RailUserRow from "../(partials)/rail-user-row";

/**
 * Left rail: wordmark, the pinned coordinator, then the crew. Collapses to a
 * 64px icon rail below 1024px.
 */
export default function BotsRail() {
    const { pageProps } = useContext(AppContext);

    const bots = pageProps?.bots || [];
    const selected_id = pageProps?.bot?.id;
    const coordinator = bots.find((bot) => bot.kind === "coordinator");
    const workers = bots.filter((bot) => bot.kind !== "coordinator");

    return (
        <Stack
            className="w-16 lg:w-[260px] shrink-0 h-full gap-0! items-stretch border-0 border-r border-solid border-hairline"
            aria-label="Bots"
        >
            <RailHeader />
            <Stack className="grow min-h-0 overflow-y-auto gap-0! items-stretch px-2 lg:px-3 pt-1">
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
            </Stack>
            <RailUserRow />
        </Stack>
    );
}
