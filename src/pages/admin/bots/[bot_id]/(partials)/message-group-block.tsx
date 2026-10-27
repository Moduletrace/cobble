import type { BotWithLastMessage } from "@/src/types";
import type { MessageGroup } from "../(utils)/group-messages";
import UserMessageGroup from "./user-message-group";
import BotMessageGroup from "./bot-message-group";
import SessionDivider from "./session-divider";
import CrewMessageGroup from "./crew-message-group";

type Props = {
    bot: BotWithLastMessage;
    group: MessageGroup;
};

/**
 * One author's group, under a divider when it starts a later session than
 * the messages above it.
 */
export default function MessageGroupBlock({ bot, group }: Props) {
    const block =
        group.author === "crew" ? (
            <CrewMessageGroup group={group} />
        ) : group.author === "user" ? (
            <UserMessageGroup bot={bot} group={group} />
        ) : (
            <BotMessageGroup bot={bot} group={group} />
        );

    if (!group.starts_session) return block;

    return (
        <>
            <SessionDivider />
            {block}
        </>
    );
}
