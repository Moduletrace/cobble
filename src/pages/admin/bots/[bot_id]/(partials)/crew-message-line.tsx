import { memo, useContext } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Stack from "@moduletrace/twui/layout/Stack";
import ChatroomRetryButton from "@/src/components/general/chatroom-retry-button";
import type { BotMessageWithAttachments } from "@/src/types";
import linkComputerRefs from "@/src/utils/link-computer-refs";
import { ConversationChatroomsContext } from "../(data)/conversation-chatrooms-context";
import { MessageMarkdownComponents } from "../(data)/message-markdown-components";

/**
 * Kept module-level: a new array on every render makes `react-markdown`
 * parse the message again.
 */
const RemarkPlugins = [remarkGfm];

type Props = {
    message: BotMessageWithAttachments;
};

/**
 * One chatroom outcome in the asking bot's conversation, rendered like a
 * bot's message (its room ref a chip that opens the room), with a way to
 * try the request again while its room is failed or stopped.
 */
function CrewMessageLine({ message }: Props) {
    const chatrooms = useContext(ConversationChatroomsContext);
    const chatroom = chatrooms.find((room) => room.id == message.from_chatroom_id);

    return (
        <Stack className="w-full gap-2.5! items-start wrap-anywhere [&>*]:max-w-full">
            <Markdown remarkPlugins={RemarkPlugins} components={MessageMarkdownComponents}>
                {linkComputerRefs({ text: message.text || "" })}
            </Markdown>
            {chatroom ? <ChatroomRetryButton chatroom={chatroom} labelled /> : null}
        </Stack>
    );
}

export default memo(CrewMessageLine);
