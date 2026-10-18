import Divider from "@moduletrace/twui/layout/Divider";
import type { BotWithLastMessage } from "@/src/types";
import { crewStatusLine } from "@/src/utils/crew-status";
import BotRow from "./bot-row";

type Props = {
    bot: BotWithLastMessage;
    bots: BotWithLastMessage[];
    selected?: boolean;
};

/**
 * Pinned first. Hue-less, and its subtitle is the crew status, not a
 * snippet.
 */
export default function CoordinatorRow({ bot, bots, selected }: Props) {
    return (
        <>
            <BotRow
                bot={bot}
                selected={selected}
                subtitle={crewStatusLine({ bots })}
            />
            <Divider className="shrink-0 mx-1 lg:mx-3 my-2 w-auto border-hairline dark:border-hairline" />
        </>
    );
}
