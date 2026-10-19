import type { BotMessageWithAttachments } from "@/src/types";
import MessageAttachments from "./message-attachments";
import UserBubble from "./user-bubble";

/**
 * One user message: its files, then its text (a file-only message has no
 * bubble).
 */
export default function UserMessage({ text, attachments }: BotMessageWithAttachments) {
    return (
        <>
            <MessageAttachments attachments={attachments} />
            {text ? <UserBubble text={text} /> : null}
        </>
    );
}
