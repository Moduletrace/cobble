import { useState, type KeyboardEvent } from "react";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import Textarea from "@moduletrace/twui/form/Textarea";
import type { BotMessageWithAttachments, BotWithLastMessage } from "@/src/types";
import sendBotMessage from "../(functions)/send-bot-message";
import useComposerAttachments from "../(hooks)/use-composer-attachments";
import ComposerAttachButton from "./composer-attach-button";
import ComposerAttachments from "./composer-attachments";
import ComposerSendButton from "./composer-send-button";

type Props = {
    bot: BotWithLastMessage;
    onSent: (params: { message: BotMessageWithAttachments }) => void;
};

/**
 * Enter sends, Shift+Enter adds a line. Grows to five lines, then scrolls.
 * Its top rule lines up with the rail's user-row rule; picked files sit
 * just above it. Files can also be pasted or dropped in.
 */
export default function Composer({ bot, onSent }: Props) {
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string>();
    const files = useComposerAttachments();

    const can_send =
        Boolean(text.trim() || files.media_ids.length) && !sending && !files.uploading;

    async function send() {
        if (!can_send || !bot.id) return;

        setSending(true);
        setError(undefined);

        const res = await sendBotMessage({ bot_id: bot.id, text, media_ids: files.media_ids });

        setSending(false);

        if (!res.success || !res.singleRes) {
            setError(res.msg || "Message not sent");
            return;
        }

        setText("");
        files.clear();
        onSent({ message: res.singleRes });
    }

    function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) {
        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            send();
        }
    }

    return (
        <Stack
            className="shrink-0 gap-0! items-stretch"
            onDragOver={(e) => {
                if (e.dataTransfer.types.includes("Files")) e.preventDefault();
            }}
            onDrop={(e) => {
                if (!e.dataTransfer.files.length) return;

                e.preventDefault();
                files.add({ files: [...e.dataTransfer.files] });
            }}
        >
            <ComposerAttachments pending={files.pending} onRemove={files.remove} />
            <Row className="h-[88px] shrink-0 gap-4! flex-nowrap items-center px-6 border-0 border-t border-solid border-hairline">
                <ComposerAttachButton disabled={files.full} onFiles={files.add} />
                <Textarea
                    name="message"
                    aria-label={`Message ${bot.name}`}
                    placeholder={`Message ${bot.name}`}
                    rows={1}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onPaste={(e) => {
                        const pasted = [...e.clipboardData.files];

                        if (!pasted.length) return;

                        e.preventDefault();
                        files.add({ files: pasted });
                    }}
                    aria-invalid={error ? true : undefined}
                    title={error}
                    className="field-sizing-content max-h-[100px] resize-none overflow-y-auto text-sm leading-5 text-ink placeholder:text-ink-secondary"
                    wrapperWrapperProps={{ className: "grow min-w-0" }}
                    wrapperProps={{
                        className:
                            "p-0! outline-0! border-0! bg-transparent! dark:bg-transparent! rounded-none",
                    }}
                />
                <ComposerSendButton disabled={!can_send} loading={sending || files.uploading} onClick={send} />
            </Row>
        </Stack>
    );
}
