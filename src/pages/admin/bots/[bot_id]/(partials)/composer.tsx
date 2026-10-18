import { useState, type KeyboardEvent } from "react";
import Row from "@moduletrace/twui/layout/Row";
import Textarea from "@moduletrace/twui/form/Textarea";
import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import type { BotWithLastMessage } from "@/src/types";
import sendBotMessage from "../(functions)/send-bot-message";
import ComposerAttachButton from "./composer-attach-button";
import ComposerSendButton from "./composer-send-button";

type Props = {
    bot: BotWithLastMessage;
    onSent: (params: { message: BUN_SQLITE_COBBLE_BOT_MESSAGES }) => void;
};

/**
 * Enter sends, Shift+Enter adds a line. Grows to five lines, then scrolls.
 * Its top rule lines up with the rail's user-row rule.
 */
export default function Composer({ bot, onSent }: Props) {
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string>();

    const can_send = Boolean(text.trim()) && !sending;

    async function send() {
        if (!can_send || !bot.id) return;

        setSending(true);
        setError(undefined);

        const res = await sendBotMessage({ bot_id: bot.id, text });

        setSending(false);

        if (!res.success || !res.singleRes) {
            setError(res.msg || "Message not sent");
            return;
        }

        setText("");
        onSent({ message: res.singleRes });
    }

    function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) {
        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            send();
        }
    }

    return (
        <Row className="h-[88px] shrink-0 gap-4! flex-nowrap items-center px-6 border-0 border-t border-solid border-hairline">
            <ComposerAttachButton />
            <Textarea
                name="message"
                aria-label={`Message ${bot.name}`}
                placeholder={`Message ${bot.name}`}
                rows={1}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                aria-invalid={error ? true : undefined}
                title={error}
                className="field-sizing-content max-h-[100px] resize-none overflow-y-auto text-sm leading-5 text-ink placeholder:text-ink-secondary"
                wrapperWrapperProps={{ className: "grow min-w-0" }}
                wrapperProps={{
                    className:
                        "p-0! outline-0! border-0! bg-transparent! dark:bg-transparent! rounded-none",
                }}
            />
            <ComposerSendButton disabled={!can_send} loading={sending} onClick={send} />
        </Row>
    );
}
