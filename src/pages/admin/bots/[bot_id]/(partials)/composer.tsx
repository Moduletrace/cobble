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
import type {
    BotExtensionsPayload,
    BotMessageAttachment,
    BotMessageWithAttachments,
    BotVoicePayload,
    BotWithLastMessage,
} from "@/src/types";
import type { ComposerCommand } from "../(data)/composer-commands";
import { CrewBotsContext } from "../(data)/crew-bots-context";
import { CrewWorkspacesContext } from "../(data)/crew-workspaces-context";
import postSessionApi from "@/src/functions/frontend/post-session-api";
import sendBotMessage from "../(functions)/send-bot-message";
import transcribeVoice from "../(functions)/transcribe-voice";
import useComposerAttachments from "../(hooks)/use-composer-attachments";
import useComposerDraft from "../(hooks)/use-composer-draft";
import useComposerEditor from "../(hooks)/use-composer-editor";
import useComposerHistory from "../(hooks)/use-composer-history";
import useVoiceRecorder from "../(hooks)/use-voice-recorder";
import useOnlineStatus from "@/src/hooks/use-online-status";
import { AppData } from "@/src/data/app-data";
import messageTooLongMessage from "@/src/utils/message-too-long-message";
import conversationHref from "@/src/utils/conversation-href";
import composerHistoryTexts from "../(utils)/composer-history-texts";
import composerDraftKey from "../(utils)/composer-draft-key";
import composerCommandMatches from "../(utils)/composer-command-matches";
import loadedBuildId from "../(utils)/loaded-build";
import ComposerAttachButton from "./composer-attach-button";
import ComposerAttachments from "./composer-attachments";
import ComposerClearButton from "./composer-clear-button";
import ComposerCommandList from "./composer-command-list";
import ComposerEditor from "./composer-editor";
import ComposerMentionList from "./composer-mention-list";
import ComposerNotice from "./composer-notice";
import ComposerReplyPreview from "./composer-reply-preview";
import ComposerSendButton from "./composer-send-button";
import ComposerTools from "./composer-tools";
import ComposerVoiceButton from "./composer-voice-button";
import { twMerge } from "tailwind-merge";

/**
 * What the conversation can do to the composer from outside it.
 */
export type ComposerHandle = {
    /**
     * Quotes text from the thread at the cursor.
     */
    insertQuote: (params: { text: string }) => void;
    /**
     * Puts text at the cursor (a suggested next step), leaving the draft
     * to the user to edit and send.
     */
    insertText: (params: { text: string }) => void;
};

type Props = {
    bot: BotWithLastMessage;
    /**
     * The workspace the conversation is in, if any.
     */
    workspace_id?: number | null;
    /**
     * Its MCP servers, tools and skills, listed under the input.
     */
    extensions?: BotExtensionsPayload | null;
    /**
     * The dictation mic is disabled while transcription has no model.
     */
    voice?: BotVoicePayload | null;
    /**
     * The Browser button shows only when the user has a browser of their own.
     */
    has_browsers?: boolean;
    /**
     * The longest message the install takes, in characters; checked here
     * before anything is sent, and again by the server.
     */
    max_chars?: number | null;
    /**
     * The user's own earlier messages in the thread, oldest first: the Up
     * and Down arrows walk them.
     */
    previous_messages?: BotMessageWithAttachments[];
    /**
     * The session the thread shows, so the message lands in it rather than
     * in whichever session is active (a routine's or a hook's thread).
     */
    session_id?: number | null;
    /**
     * The message the next one quotes, if the user picked one.
     */
    reply_to?: BotMessageWithAttachments | null;
    onCancelReply?: () => void;
    /**
     * Plan mode: the next message asks the bot to plan and read, and change
     * nothing. Sent with the message, and shown above the input while on.
     */
    plan_mode?: boolean;
    onTogglePlanMode?: () => void;
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
 * connection never holds either; a failed send puts both back. Up recalls
 * the message the user sent before (Down comes forward again, back to what
 * they were typing), and the X button empties the text without sending it.
 */
export default function Composer({
    bot,
    workspace_id,
    extensions,
    voice,
    has_browsers,
    max_chars,
    previous_messages,
    session_id,
    reply_to,
    onCancelReply,
    plan_mode,
    onTogglePlanMode,
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
     * The slash commands the text is asking for, the one highlighted, and
     * a command still on its way (`/continue` writes a summary).
     */
    const commands = composerCommandMatches({ text });
    const [command_index, set_command_index] = useState(0);
    const [command_busy, set_command_busy] = useState(false);

    /**
     * Temporary ids for messages the server doesn't have yet, and the text
     * as it stands now, for a failed send that has to put it back.
     */
    const temp_id = useRef(0);
    const latest_text = useRef(text);
    /**
     * A send still on its way: no second one starts until it answers.
     */
    const sending = useRef(false);

    latest_text.current = text;

    const history = useComposerHistory({
        texts: composerHistoryTexts({ messages: previous_messages || [] }),
    });
    /**
     * Assigned once the editor exists, since recalling a message writes
     * into it; the editor's keys read it through a ref.
     */
    const walk_history = useRef<
        (params: { direction: "up" | "down"; empty: boolean }) => boolean
    >(() => false);

    const input = useComposerEditor({
        placeholder: `Message ${bot.name}`,
        bots,
        workspaces,
        onChange: ({ markdown }) => {
            history.reset();
            setText(markdown);
        },
        onSubmit: () => send_ref.current(),
        onFiles: files.add,
        onHistory: (params) => {
            /**
             * An open command list keeps the arrows: they walk it when
             * there's more than one, rather than the user's earlier
             * messages.
             */
            if (commands.length) {
                if (commands.length > 1) {
                    moveCommand({ direction: params.direction });
                }

                return true;
            }

            return walk_history.current(params);
        },
    });
    const editor = input.editor;

    function moveCommand({ direction }: { direction: "up" | "down" }) {
        const count = commands.length;
        const step = direction == "down" ? 1 : -1;

        set_command_index((index) => (index + step + count) % count);
    }

    /**
     * Typing or deleting moves the highlight back to the first command.
     */
    useEffect(() => set_command_index(0), [text]);

    walk_history.current = ({ direction, empty }) => {
        const next = history.step({
            direction,
            draft: latest_text.current,
            empty,
        });

        if (!next) return false;

        setText(next.text);
        input.setMarkdown({ markdown: next.text });
        editor?.commands.focus("end");

        return true;
    };

    useImperativeHandle(
        handle_ref,
        () => ({
            insertQuote: input.insertQuote,
            insertText: input.insertText,
        }),
        [input.insertQuote, input.insertText],
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
     * The page is a build older than the server's: what was being sent goes
     * into the draft synchronously (the hooks' own writes are debounced and
     * may never run before the reload) and the page reloads into the
     * running build, which picks the draft up.
     */
    const keepForReload = ({
        lost_text,
        attachments,
    }: {
        lost_text: string;
        attachments: BotMessageAttachment[];
    }) => {
        const keep_text = latest_text.current.trim() ? latest_text.current : lost_text;
        const text_key = composerDraftKey({ bot_id: bot.id, workspace_id, part: "text" });
        const files_key = composerDraftKey({ bot_id: bot.id, workspace_id, part: "files" });

        try {
            localStorage.setItem(text_key, keep_text);

            if (attachments.length) localStorage.setItem(files_key, JSON.stringify(attachments));
            else localStorage.removeItem(files_key);
        } catch {}
    };

    /**
     * Empties the input's text, without sending it: what was typed is
     * dropped, the quote and the picked files stay.
     */
    function clearText() {
        setText("");
        history.reset();
        input.clear();
        editor?.commands.focus();
    }

    /**
     * A picked command goes into the input rather than running from the
     * click, so what it does is read before Enter runs it.
     */
    function pickCommand(command: ComposerCommand) {
        const command_text = `/${command.name}`;

        setText(command_text);
        history.reset();
        input.setMarkdown({ markdown: command_text });
        editor?.commands.focus("end");
    }

    /**
     * `/new`, `/continue` and `/clear` act on the conversation's session
     * rather than being sent, and the page lands on the session they
     * leave. `/clear` destroys messages, so it asks first. A failure puts
     * the command back in the input with the reason under it (a session
     * with a run in progress can't be deleted).
     */
    async function runCommand({ command }: { command: ComposerCommand }) {
        if (sending.current) return;

        if (command.name == "clear") {
            if (!session_id) {
                setError("The session is still loading. Try again in a moment.");
                return;
            }

            if (
                !window.confirm(
                    "Delete this session and all its messages, then start a new one? This can't be undone.",
                )
            ) {
                return;
            }
        }

        sending.current = true;
        set_command_busy(true);
        setError(undefined);

        const lost_text = text.trim();

        setText("");
        history.reset();
        input.clear();

        const res = await postSessionApi({
            path:
                command.name == "new"
                    ? "new-session"
                    : command.name == "continue"
                      ? "continue-session"
                      : "delete-session",
            body:
                command.name == "clear"
                    ? { session_id }
                    : { bot_id: bot.id, workspace_id },
        }).catch(() => null);

        if (res?.success) {
            window.location.assign(
                conversationHref({ bot_id: Number(bot.id), workspace_id }),
            );
            return;
        }

        sending.current = false;
        set_command_busy(false);
        setError(res?.msg || "That didn't work.");

        if (!latest_text.current.trim()) {
            setText(lost_text);
            input.setMarkdown({ markdown: lost_text });
        }
    }

    /**
     * The bubble and the bot's "getting your message" row show at once, and
     * the input empties, so a slow connection never holds any of it. The
     * response swaps the bubble for the saved message, or takes it back.
     */
    async function send() {
        if (!can_send || !bot.id || sending.current) return;

        const command = commands[command_index] ?? commands[0];

        if (command) {
            await runCommand({ command });
            return;
        }

        /**
         * Held until this send comes back: a second click while the first is
         * still on its way (a double tap, Enter twice, a phone that fires
         * both) queued a second message with its own id, and the two raced
         * the conversation's rollover against each other.
         */
        sending.current = true;

        try {
            setError(undefined);

            /**
             * A message over the limit stays in the input, untouched, with the
             * reason under it, instead of flashing into the thread and back.
             */
            const limit = max_chars || AppData.BotMessageMaxChars;
            const length = text.trim().length;

            if (length > limit) {
                setError(messageTooLongMessage({ length, max_chars: limit }));
                return;
            }

            temp_id.current -= 1;

            const client_id = temp_id.current;
            /**
             * The text goes as the server will store it, trimmed: a message
             * with a trailing newline was saved without it, and the bubble
             * waiting for it never matched the saved one.
             */
            const text_sent = text.trim();
            /**
             * The server's own handle for this send, so a send whose answer
             * never arrived is recognised as the message already stored. Not
             * the thread's temp id: that restarts after a reload and would
             * match an older message of the same conversation.
             */
            const request_id = crypto.randomUUID();
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
            history.reset();
            input.clear();
            files.clear();

            const res = await sendBotMessage({
                bot_id: bot.id,
                workspace_id,
                text: text_sent,
                media_ids,
                reply_to_message_id: reply_to?.id || null,
                session_id: session_id || null,
                client_id: request_id,
                plan_mode,
                build_id: loadedBuildId(),
            });

            /**
             * A deploy replaced the build while this page was open: reload
             * into it rather than writing from code the server no longer
             * serves.
             */
            if (res.error == "stale_build") {
                keepForReload({ lost_text: text_sent, attachments });
                window.location.reload();
                return;
            }

            if (!res.success || !res.singleRes) {
                setError(res.msg || "Message not sent");
                restore({ lost_text: text_sent, attachments });
                onSendFailed({ temp_id: client_id });
                return;
            }

            onSent({ message: res.singleRes });
        } finally {
            sending.current = false;
        }
    }

    send_ref.current = send;

    /**
     * Why the last send didn't go, else why dictation stopped. The editor's
     * red edge alone never said why.
     */
    const notice = error || recorder.error;

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
                {commands.length ? (
                    <ComposerCommandList
                        commands={commands}
                        index={command_index}
                        onPick={pickCommand}
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

                    <ComposerClearButton
                        disabled={!text.trim()}
                        onClick={clearText}
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
                        loading={files.uploading || command_busy}
                        onClick={send}
                    />
                </Row>
                {notice ? (
                    <Stack
                        className={twMerge(
                            "w-full px-3 pb-3 md:px-6 gap-0! items-stretch max-w-container m-auto",
                            "mb-4",
                        )}
                    >
                        <ComposerNotice
                            message={notice}
                            tone={error ? "error" : "warning"}
                            onClose={() => {
                                setError(undefined);
                                recorder.setError(undefined);
                            }}
                        />
                    </Stack>
                ) : null}

                <ComposerTools
                    bot={bot}
                    workspace_id={workspace_id}
                    initial={extensions}
                    has_browsers={has_browsers}
                    plan_mode={plan_mode}
                    on_toggle_plan_mode={onTogglePlanMode}
                />
            </Stack>
        </Stack>
    );
}
