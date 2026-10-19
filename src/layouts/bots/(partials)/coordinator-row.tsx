import Divider from "@moduletrace/twui/layout/Divider";
import type { BotWithLastMessage } from "@/src/types";
import { crewCounts, crewStatusLine } from "@/src/utils/crew-status";
import BotRow from "./bot-row";

type Props = {
    bot: BotWithLastMessage;
    bots: BotWithLastMessage[];
    selected?: boolean;
};

/**
 * Pinned first. Hue-less. Its subtitle is its status line, else the crew
 * counts while any worker is busy or needs you, else its last message.
 */
export default function CoordinatorRow({ bot, bots, selected }: Props) {
    const { working, needs_you } = crewCounts({ bots });

    return (
        <>
            <BotRow
                bot={bot}
                selected={selected}
                subtitle={working || needs_you ? crewStatusLine({ bots }) : undefined}
            />
            <Divider className="shrink-0 mx-1 lg:mx-3 my-2 w-auto border-hairline dark:border-hairline" />
        </>
    );
}
