import { lazy, Suspense, useContext, useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import type { Editor } from "@tiptap/react";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import P from "@moduletrace/twui/layout/P";
import type {
    BotExtensionsPayload,
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
import type { ComposerMentionMenu } from "../(hooks)/use-composer-editor";
import useVoiceRecorder from "../(hooks)/use-voice-recorder";
import useOnlineStatus from "@/src/hooks/use-online-status";
import ComposerAttachButton from "./composer-attach-button";
import ComposerAttachments from "./composer-attachments";
import ComposerInputFallback from "./composer-input-fallback";
import type { ComposerInputApi } from "./composer-input";
import ComposerMentionList from "./composer-mention-list";
import ComposerReplyPreview from "./composer-reply-preview";
import ComposerSendButton from "./composer-send-button";
import ComposerTools from "./composer-tools";
import ComposerVoiceButton from "./composer-voice-button";

/**
 * Tiptap is the heaviest code on the page, so the editor loads on its own
 * once the page is up; a stand-in holds its place until then.
 */
const ComposerInput = lazy(() => import("./composer-input"));

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
    onSent: (params: { message: BotMessageWithAttachments }) => void;
    handle_ref?: Ref<ComposerHandle>;
};

/**
 * A Tiptap editor (`useComposerEditor`, loaded lazily by `ComposerInput`) writing markdown: Enter sends,
 * Shift+Enter adds a line, a selection can be formatted, `@` mentions a
 * bot and `#` a workspace. Grows to eight lines, then scrolls.
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
    handle_ref,
}: Props) {
    const draft = useComposerDraft({ bot_id: bot.id, workspace_id });
    const { text, setText } = draft;
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string>();
    const files = useComposerAttachments({ bot_id: bot.id, workspace_id });
    const online = useOnlineStatus();
    const bots = useContext(CrewBotsContext);
    const workspaces = useContext(CrewWorkspacesContext);
    const send_ref = useRef<() => void>(() => {});

    const input = useRef<ComposerInputApi | null>(null);
    const [editor, setEditor] = useState<Editor | null>(null);
    const [menu, setMenu] = useState<ComposerMentionMenu | null>(null);
    const placeholder = `Message ${bot.name}`;

    useImperativeHandle(
        handle_ref,
        () => ({ insertQuote: ({ text }) => input.current?.insertQuote({ text }) }),
        [],
    );

    /**
     * The saved draft goes into the editor once per conversation, after
     * it's read; typing saves it back from then on.
     */
    const applied_key = useRef<string | null>(null);

    useEffect(() => {
        if (!editor || !draft.loaded || applied_key.current == draft.key) return;

        applied_key.current = draft.key;

        /** Out of React's render, since mention chips mount as it loads. */
        queueMicrotask(() => {
            input.current?.setMarkdown({ markdown: text });
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

            const res = await transcribeVoice({ bot_id: bot.id, workspace_id, audio });

            if (!res.success || !res.singleRes?.text) {
                recorder.setError(res.msg || "Couldn't write that out");
                return;
            }

            input.current?.insertText({ text: res.singleRes.text });
        },
    });

    const can_send =
        Boolean(text.trim() || files.media_ids.length) &&
        !sending &&
        !files.uploading &&
        recorder.state == "idle" &&
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
            reply_to_message_id: reply_to?.id || null,
        });

        setSending(false);

        if (!res.success || !res.singleRes) {
            setError(res.msg || "Message not sent");
            return;
        }

        setText("");
        input.current?.clear();
        files.clear();
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
                {menu ? <ComposerMentionList menu={menu} /> : null}
                <Row className={`w-full max-w-container mx-auto min-h-[88px] ${reply_to ? "pt-3 pb-7" : "py-7"} gap-3! md:gap-4! flex-nowrap items-end px-3 md:px-6 cursor-text`}
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
                    <Suspense fallback={<ComposerInputFallback placeholder={placeholder} />}>
                        <ComposerInput
                            api_ref={input}
                            onEditor={setEditor}
                            onMenu={setMenu}
                            placeholder={placeholder}
                            bots={bots}
                            workspaces={workspaces}
                            onChange={({ markdown }) => setText(markdown)}
                            onSubmit={() => send_ref.current()}
                            onFiles={files.add}
                            invalid={Boolean(error)}
                            title={error}
                        />
                    </Suspense>
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
