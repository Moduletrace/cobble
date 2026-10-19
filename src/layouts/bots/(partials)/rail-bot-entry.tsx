import type { BotWithLastMessage } from "@/src/types";
import BotRow from "./bot-row";
import RailBotCard from "./rail-bot-card";
import RailBotSessions from "./rail-bot-sessions";
import Divider from "@moduletrace/twui/layout/Divider";

type Props = {
    bot: BotWithLastMessage;
    href: string;
    selected?: boolean;
    workspace_id?: number | null;
};

/**
 * A worker in the rail, and its sessions while it is the open conversation.
 */
export default function RailBotEntry({
    bot,
    href,
    selected,
    workspace_id,
}: Props) {
    return (
        <RailBotCard selected={selected}>
            <BotRow bot={bot} href={href} selected={selected} />
            {selected ? (
                <>
                    <RailBotSessions
                        key={bot.id}
                        bot={bot}
                        workspace_id={workspace_id}
                    />
                </>
            ) : null}
        </RailBotCard>
    );
}
