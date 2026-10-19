import { useRef, useState, type KeyboardEvent } from "react";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import Textarea from "@moduletrace/twui/form/Textarea";
import type {
    BotExtensionsPayload,
    BotMessageWithAttachments,
    BotWithLastMessage,
} from "@/src/types";
import sendBotMessage from "../(functions)/send-bot-message";
import useComposerAttachments from "../(hooks)/use-composer-attachments";
import useComposerDraft from "../(hooks)/use-composer-draft";
import useAutoGrowTextarea from "../(hooks)/use-auto-grow-textarea";
import useOnlineStatus from "@/src/hooks/use-online-status";
import ComposerAttachButton from "./composer-attach-button";
import ComposerAttachments from "./composer-attachments";
import ComposerSendButton from "./composer-send-button";
import ComposerTools from "./composer-tools";

type Props = {
    bot: BotWithLastMessage;
    /**
     * The workspace the conversation is in, if any.
     */
    workspace_id?: number | null;
    /**
     * Its MCP servers and tools, listed under the input.
     */
    extensions?: BotExtensionsPayload | null;
    onSent: (params: { message: BotMessageWithAttachments }) => void;
};

/**
 * Enter sends, Shift+Enter adds a line. Grows to eight lines, then scrolls.
 * Its top rule lines up with the rail's user-row rule; picked files sit
 * just above it. A click anywhere on the row focuses the input. Files can
 * also be pasted or dropped in. Unsent text is kept per conversation
 * across reloads, with its uploaded files. The bot's MCP servers and tools
 * are listed under the input.
 */
export default function Composer({ bot, workspace_id, extensions, onSent }: Props) {
    const { text, setText } = useComposerDraft({ bot_id: bot.id, workspace_id });
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string>();
    const files = useComposerAttachments({ bot_id: bot.id, workspace_id });
    const online = useOnlineStatus();
    const input_ref = useRef<HTMLTextAreaElement>(null);

    useAutoGrowTextarea({ ref: input_ref, value: text });

    const can_send =
        Boolean(text.trim() || files.media_ids.length) &&
        !sending &&
        !files.uploading &&
        online;

    async function send() {
        if (!can_send || !bot.id) return;

        setSending(true);
        setError(undefined);

        const res = await sendBotMessage({
            bot_id: bot.id,
            workspace_id,
            text,
            media_ids: files.media_ids,
        });

        setSending(false);

        if (!res.success || !res.singleRes) {
            setError(res.msg || "Message not sent");
            return;
        }

        setText("");
        files.clear();
        onSent({ message: res.singleRes });
    }

    function handleKeyDown(
        e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>,
    ) {
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
            <ComposerAttachments
                pending={files.pending}
                onRemove={files.remove}
            />
            <Stack className="shrink-0 gap-0! items-stretch border-0 border-t border-solid border-hairline">
                <Row className="w-full max-w-container mx-auto min-h-[88px] py-7 gap-3! md:gap-4! flex-nowrap items-end px-3 md:px-6 cursor-text"
                    onMouseDown={(e) => {
                        const target = e.target as HTMLElement;

                        if (target.closest("button, textarea")) return;

                        e.preventDefault();
                        input_ref.current?.focus();
                    }}
                >
                    <ComposerAttachButton
                        disabled={files.full}
                        onFiles={files.add}
                    />
                    <Textarea
                        name="message"
                        componentRef={input_ref}
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
                        className="field-sizing-content min-h-5 max-h-[160px] resize-none overflow-y-auto text-sm leading-5 text-ink placeholder:text-ink-secondary"
                        wrapperWrapperProps={{
                            className: "grow min-w-0 self-center z-auto! hover:z-auto!",
                        }}
                        wrapperProps={{
                            className:
                                "p-0! outline-0! border-0! bg-transparent! dark:bg-transparent! rounded-none",
                        }}
                        autoFocus
                    />
                    <ComposerSendButton
                        disabled={!can_send}
                        loading={sending || files.uploading}
                        onClick={send}
                    />
                </Row>
                <ComposerTools bot={bot} workspace_id={workspace_id} initial={extensions} />
            </Stack>
        </Stack>
    );
}
