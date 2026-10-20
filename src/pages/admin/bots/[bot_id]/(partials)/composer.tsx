import {
    useContext,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
    type Ref,
} from "react";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import P from "@moduletrace/twui/layout/P";
import type {
    BotExtensionsPayload,
    BotMessageAttachment,
    BotMessageWithAttachments,
    BotVoicePayload,
    BotWithLastMessage,
} from "@/src/types";
import { CrewBotsContext } from "../(data)/crew-bots-context";
import { CrewWorkspacesContext } from "../(data)/crew-workspaces-context";
import sendBotMessage from "../(functions)/send-bot-message";
import transcribeVoice from "../(functions)/transcribe-voice";
import useComposerAttachments from "../(hooks)/use-composer-attachments";
import useComposerDraft from "../(hooks)/use-composer-draft";
import useComposerEditor from "../(hooks)/use-composer-editor";
import useVoiceRecorder from "../(hooks)/use-voice-recorder";
import useOnlineStatus from "@/src/hooks/use-online-status";
import ComposerAttachButton from "./composer-attach-button";
import ComposerAttachments from "./composer-attachments";
import ComposerEditor from "./composer-editor";
import ComposerMentionList from "./composer-mention-list";
import ComposerReplyPreview from "./composer-reply-preview";
import ComposerSendButton from "./composer-send-button";
import ComposerTools from "./composer-tools";
import ComposerVoiceButton from "./composer-voice-button";

/**
 * What the conversation can do to the composer from outside it.
 */
export type ComposerHandle = {
    /**
     * Quotes text from the thread at the cursor.
     */
    insertQuote: (params: { text: string }) => void;
};

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
    /**
     * The message is put in the thread at once, before the server has it.
     */
    onSendStart: (params: { message: BotMessageWithAttachments }) => void;
    /**
     * The server took it, so the pending copy makes way for the saved one.
     */
    onSent: (params: { message: BotMessageWithAttachments }) => void;
    /**
     * It didn't make it: the pending copy goes.
     */
    onSendFailed: (params: { temp_id: number }) => void;
    handle_ref?: Ref<ComposerHandle>;
};

/**
 * A Tiptap editor (`useComposerEditor`) writing markdown: Enter sends,
 * Shift+Enter adds a line, a selection can be formatted, `@` mentions a
 * bot and `#` a workspace. Grows to eight lines, then scrolls.
 * Its top rule lines up with the rail's user-row rule; picked files sit
 * just above it. A click anywhere on the row focuses the input. Files can
 * also be pasted or dropped in. Unsent text is kept per conversation
 * across reloads, with its uploaded files. The bot's MCP servers and tools
 * are listed under the input. The mic dictates: what's said is written
 * into the input at the cursor, to edit before sending. Sending shows the
 * message in the thread straight away and empties the input, so a slow
 * connection never holds either; a failed send puts both back.
 */
export default function Composer({
    bot,
    workspace_id,
    extensions,
    voice,
    reply_to,
    onCancelReply,
    onSendStart,
    onSent,
    onSendFailed,
    handle_ref,
}: Props) {
    const draft = useComposerDraft({ bot_id: bot.id, workspace_id });
    const { text, setText } = draft;
    const [error, setError] = useState<string>();
    const files = useComposerAttachments({ bot_id: bot.id, workspace_id });
    const online = useOnlineStatus();
    const bots = useContext(CrewBotsContext);
    const workspaces = useContext(CrewWorkspacesContext);
    const send_ref = useRef<() => void>(() => {});

    /**
     * Temporary ids for messages the server doesn't have yet, and the text
     * as it stands now, for a failed send that has to put it back.
     */
    const temp_id = useRef(0);
    const latest_text = useRef(text);
    const send_lock = useRef(false);

    latest_text.current = text;

    const input = useComposerEditor({
        placeholder: `Message ${bot.name}`,
        bots,
        workspaces,
        onChange: ({ markdown }) => setText(markdown),
        onSubmit: () => send_ref.current(),
        onFiles: files.add,
    });
    const editor = input.editor;

    useImperativeHandle(
        handle_ref,
        () => ({ insertQuote: input.insertQuote }),
        [input.insertQuote],
    );

    /**
     * The saved draft goes into the editor once per conversation, after
     * it's read; typing saves it back from then on.
     */
    const applied_key = useRef<string | null>(null);

    useEffect(() => {
        if (!editor || !draft.loaded || applied_key.current == draft.key)
            return;

        applied_key.current = draft.key;

        /** Out of React's render, since mention chips mount as it loads. */
        queueMicrotask(() => {
            input.setMarkdown({ markdown: text });
            editor.commands.focus("end");
        });
    }, [editor, draft.loaded, draft.key]);

    /**
     * Picking a message to reply to puts the cursor back in the input.
     */
    useEffect(() => {
        if (reply_to) editor?.commands.focus();
    }, [reply_to]);

    const recorder = useVoiceRecorder({
        onRecorded: async ({ audio }) => {
            if (!bot.id) return;

            const res = await transcribeVoice({
                bot_id: bot.id,
                workspace_id,
                audio,
            });

            if (!res.success || !res.singleRes?.text) {
                recorder.setError(res.msg || "Couldn't write that out");
                return;
            }

            input.insertText({ text: res.singleRes.text });
        },
    });

    const can_send =
        Boolean(text.trim() || files.media_ids.length) &&
        !files.uploading &&
        recorder.state == "idle" &&
        online;

    /**
     * A send that didn't make it puts its files back, and its text too
     * unless something has been typed since.
     */
    const restore = ({
        lost_text,
        attachments,
    }: {
        lost_text: string;
        attachments: BotMessageAttachment[];
    }) => {
        if (lost_text && !latest_text.current.trim()) {
            setText(lost_text);
            input.setMarkdown({ markdown: lost_text });
        }

        files.restore({ attachments });
    };

    /**
     * The bubble and the bot's "getting your message" row show at once, and
     * the input empties, so a slow connection never holds any of it. The
     * response swaps the bubble for the saved message, or takes it back.
     */
    async function send() {
        if (!can_send || !bot.id || send_lock.current) return;

        /** Only for this tick: the cleared editor lands by the next one. */
        send_lock.current = true;
        setTimeout(() => {
            send_lock.current = false;
        }, 0);

        setError(undefined);

        temp_id.current -= 1;

        const client_id = temp_id.current;
        const text_sent = text;
        const media_ids = files.media_ids;
        const attachments = files.pending.flatMap((item) =>
            item.status == "ready" && item.attachment ? [item.attachment] : [],
        );

        onSendStart({
            message: {
                id: client_id,
                bot_id: bot.id,
                workspace_id: workspace_id || undefined,
                author: "user",
                text: text_sent,
                created_at: Date.now(),
                updated_at: Date.now(),
                attachments,
                reply_to: reply_to
                    ? {
                          id: Number(reply_to.id),
                          author: reply_to.author == "bot" ? "bot" : "user",
                          text: reply_to.text || "",
                      }
                    : null,
            },
        });

        /**
         * The message takes the quote with it, so a new one typed while it
         * is on its way doesn't inherit it.
         */
        onCancelReply?.();

        setText("");
        input.clear();
        files.clear();

        const res = await sendBotMessage({
            bot_id: bot.id,
            workspace_id,
            text: text_sent,
            media_ids,
            reply_to_message_id: reply_to?.id || null,
        });

        if (!res.success || !res.singleRes) {
            setError(res.msg || "Message not sent");
            restore({ lost_text: text_sent, attachments });
            onSendFailed({ temp_id: client_id });
            return;
        }

        onSent({ message: res.singleRes });
    }

    send_ref.current = send;

    return (
        <Stack
            className="shrink-0 gap-0! items-stretch"
            onDragOver={(e) => {
                if (e.dataTransfer.types.includes("Files")) e.preventDefault();
            }}
            onDrop={(e) => {
                /** Dropped on the editor, which took the files already. */
                if (e.defaultPrevented || !e.dataTransfer.files.length) return;

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
                {input.menu ? <ComposerMentionList menu={input.menu} /> : null}
                <Row
                    className={`w-full max-w-container mx-auto min-h-[88px] ${reply_to ? "pt-3 pb-7" : "py-7"} gap-3! md:gap-4! flex-nowrap items-end px-3 md:px-6 cursor-text`}
                    onMouseDown={(e) => {
                        const target = e.target as HTMLElement;

                        if (target.closest("button, [contenteditable]")) return;

                        e.preventDefault();
                        editor?.commands.focus();
                    }}
                >
                    <ComposerAttachButton
                        disabled={files.full}
                        onFiles={files.add}
                    />

                    <ComposerEditor
                        editor={editor}
                        invalid={Boolean(error)}
                        title={error}
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
                        loading={files.uploading}
                        onClick={send}
                    />
                </Row>
                {recorder.error ? (
                    <P
                        role="alert"
                        className="w-full max-w-container mx-auto px-3 md:px-6 -mt-5 pb-3 text-xs text-ink-secondary"
                    >
                        {recorder.error}
                    </P>
                ) : null}
                <ComposerTools
                    bot={bot}
                    workspace_id={workspace_id}
                    initial={extensions}
                />
            </Stack>
        </Stack>
    );
}
