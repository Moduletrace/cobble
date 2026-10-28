import { memo } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Stack from "@moduletrace/twui/layout/Stack";
import type { BotMessageWithAttachments } from "@/src/types";
import linkComputerRefs from "@/src/utils/link-computer-refs";
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
 * bot's message (its room ref a chip that opens the room).
 */
function CrewMessageLine({ message }: Props) {
    return (
        <Stack className="w-full gap-2.5! items-start wrap-anywhere [&>*]:max-w-full">
            <Markdown remarkPlugins={RemarkPlugins} components={MessageMarkdownComponents}>
                {linkComputerRefs({ text: message.text || "" })}
            </Markdown>
        </Stack>
    );
}

export default memo(CrewMessageLine);
