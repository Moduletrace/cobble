import type { BotWithLastMessage } from "@/src/types";
import { crewCounts, crewStatusLine } from "@/src/utils/crew-status";
import BotRow from "./bot-row";

type Props = {
    bot: BotWithLastMessage;
    bots: BotWithLastMessage[];
    /**
     * Its conversation in a workspace, instead of its own chat.
     */
    href?: string;
    selected?: boolean;
};

/**
 * Pinned first. Hue-less. Its subtitle is its status line, else the crew
 * counts while any worker is busy or needs you, else its last message.
 */
export default function CoordinatorRow({ bot, bots, href, selected }: Props) {
    const { working, needs_you } = crewCounts({ bots });

    return (
        <BotRow
            bot={bot}
            href={href}
            selected={selected}
            subtitle={working || needs_you ? crewStatusLine({ bots }) : undefined}
        />
    );
}
