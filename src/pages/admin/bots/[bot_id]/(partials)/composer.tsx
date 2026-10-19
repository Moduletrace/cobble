import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import Textarea from "@moduletrace/twui/form/Textarea";
import P from "@moduletrace/twui/layout/P";
import type {
    BotExtensionsPayload,
    BotMessageWithAttachments,
    BotVoicePayload,
    BotWithLastMessage,
} from "@/src/types";
import sendBotMessage from "../(functions)/send-bot-message";
import transcribeVoice from "../(functions)/transcribe-voice";
import useComposerAttachments from "../(hooks)/use-composer-attachments";
import useComposerDraft from "../(hooks)/use-composer-draft";
import useAutoGrowTextarea from "../(hooks)/use-auto-grow-textarea";
import useVoiceRecorder from "../(hooks)/use-voice-recorder";
import useOnlineStatus from "@/src/hooks/use-online-status";
import ComposerAttachButton from "./composer-attach-button";
import ComposerAttachments from "./composer-attachments";
import ComposerReplyPreview from "./composer-reply-preview";
import ComposerSendButton from "./composer-send-button";
import ComposerTools from "./composer-tools";
import ComposerVoiceButton from "./composer-voice-button";

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
    /**
     * The dictation mic is disabled while transcription has no model.
     */
    voice?: BotVoicePayload | null;
    /**
     * The message the next one quotes, if the user picked one.
     */
    reply_to?: BotMessageWithAttachments | null;
    onCancelReply?: () => void;
    onSent: (params: { message: BotMessageWithAttachments }) => void;
};

/**
 * Enter sends, Shift+Enter adds a line. Grows to eight lines, then scrolls.
 * Its top rule lines up with the rail's user-row rule; picked files sit
 * just above it. A click anywhere on the row focuses the input. Files can
 * also be pasted or dropped in. Unsent text is kept per conversation
 * across reloads, with its uploaded files. The bot's MCP servers and tools
 * are listed under the input. The mic dictates: what's said is written
 * into the input at the cursor, to edit before sending.
 */
export default function Composer({
    bot,
    workspace_id,
    extensions,
    voice,
    reply_to,
    onCancelReply,
    onSent,
}: Props) {
    const { text, setText } = useComposerDraft({ bot_id: bot.id, workspace_id });
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string>();
    const files = useComposerAttachments({ bot_id: bot.id, workspace_id });
    const online = useOnlineStatus();
    const input_ref = useRef<HTMLTextAreaElement>(null);

    useAutoGrowTextarea({ ref: input_ref, value: text });

    /**
     * Picking a message to reply to puts the cursor back in the input.
     */
    useEffect(() => {
        if (reply_to) input_ref.current?.focus();
    }, [reply_to]);

    const recorder = useVoiceRecorder({
        onRecorded: async ({ audio }) => {
            if (!bot.id) return;

            const res = await transcribeVoice({ bot_id: bot.id, workspace_id, audio });

            if (!res.success || !res.singleRes?.text) {
                recorder.setError(res.msg || "Couldn't write that out");
                return;
            }

            insertText({ insert: res.singleRes.text });
        },
    });

    const can_send =
        Boolean(text.trim() || files.media_ids.length) &&
        !sending &&
        !files.uploading &&
        recorder.state == "idle" &&
        online;

    /**
     * Puts dictated text at the cursor (or the end), spaced from what's
     * around it, and leaves the cursor after it.
     */
    function insertText({ insert }: { insert: string }) {
        const el = input_ref.current;
        const start = el ? el.selectionStart : text.length;
        const end = el ? el.selectionEnd : text.length;
        const before = text.slice(0, start);
        const after = text.slice(end);
        const piece =
            (before && !/\s$/.test(before) ? " " : "") +
            insert +
            (after && !/^\s/.test(after) ? " " : "");
        const cursor = before.length + piece.length;

        setText(before + piece + after);

        requestAnimationFrame(() => {
            input_ref.current?.focus();
            input_ref.current?.setSelectionRange(cursor, cursor);
        });
    }

    async function send() {
        if (!can_send || !bot.id) return;

        setSending(true);
        setError(undefined);

        const res = await sendBotMessage({
            bot_id: bot.id,
            workspace_id,
            text,
            media_ids: files.media_ids,
            reply_to_message_id: reply_to?.id || null,
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
                {reply_to && onCancelReply ? (
                    <ComposerReplyPreview
                        message={reply_to}
                        bot_name={bot.name || "the bot"}
                        onCancel={onCancelReply}
                    />
                ) : null}
                <Row className={`w-full max-w-container mx-auto min-h-[88px] ${reply_to ? "pt-3 pb-7" : "py-7"} gap-3! md:gap-4! flex-nowrap items-end px-3 md:px-6 cursor-text`}
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
                    {recorder.supported ? (
                        <ComposerVoiceButton
                            state={recorder.state}
                            elapsed_ms={recorder.elapsed_ms}
                            error={recorder.error}
                            unavailable={!voice?.transcription}
                            disabled={!online}
                            onStart={recorder.start}
                            onStop={recorder.stop}
                        />
                    ) : null}
                    <ComposerSendButton
                        disabled={!can_send}
                        loading={sending || files.uploading}
                        onClick={send}
                    />
                </Row>
                {recorder.error ? (
                    <P role="alert" className="w-full max-w-container mx-auto px-3 md:px-6 -mt-5 pb-3 text-xs text-ink-secondary">
                        {recorder.error}
                    </P>
                ) : null}
                <ComposerTools bot={bot} workspace_id={workspace_id} initial={extensions} />
            </Stack>
        </Stack>
    );
}
