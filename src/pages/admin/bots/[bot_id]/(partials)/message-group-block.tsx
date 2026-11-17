import type { BotWithLastMessage } from "@/src/types";
import type { MessageGroup } from "../(utils)/group-messages";
import UserMessageGroup from "./user-message-group";
import BotMessageGroup from "./bot-message-group";
import SessionDivider from "./session-divider";
import CrewMessageGroup from "./crew-message-group";

type Props = {
    bot: BotWithLastMessage;
    group: MessageGroup;
    /**
     * The bot's own last word in the conversation, which can be run again.
     */
    last_bot_id?: number | null;
};

/**
 * One author's group, under a divider when it starts a later session than
 * the messages above it.
 */
export default function MessageGroupBlock({ bot, group, last_bot_id }: Props) {
    const block =
        group.author === "crew" ? (
            <CrewMessageGroup group={group} />
        ) : group.author === "user" ? (
            <UserMessageGroup bot={bot} group={group} />
        ) : (
            <BotMessageGroup
                bot={bot}
                group={group}
                last_bot_id={last_bot_id}
            />
        );

    if (!group.starts_session) return block;

    return (
        <>
            <SessionDivider />
            {block}
        </>
    );
}