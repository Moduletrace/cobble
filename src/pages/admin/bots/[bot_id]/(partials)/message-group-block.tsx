import type { BotWithLastMessage } from "@/src/types";
import type { MessageGroup } from "../(utils)/group-messages";
import UserMessageGroup from "./user-message-group";
import BotMessageGroup from "./bot-message-group";

type Props = {
    bot: BotWithLastMessage;
    group: MessageGroup;
};

export default function MessageGroupBlock({ bot, group }: Props) {
    if (group.author === "user") {
        return <UserMessageGroup group={group} />;
    }

    return <BotMessageGroup bot={bot} group={group} />;
}
