import { useContext, useEffect, useMemo, useRef, useState } from "react";
import isAwaitingReply from "../(utils)/is-awaiting-reply";
import Stack from "@moduletrace/twui/layout/Stack";
import type { BotMessageReactionEmoji } from "@/src/dict/bot-dict";
import type {
    BotMessageReactionData,
    BotMessageWithAttachments,
} from "@/src/types";
import { AppContext } from "@/src/pages/__root";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import useLiveBots from "@/src/hooks/use-live-bots";
import useServerEvent from "@/src/hooks/use-server-event";
import useLiveWorkspaces from "@/src/layouts/bots/(hooks)/use-live-workspaces";
import { BotComputersContext } from "../(data)/bot-computers-context";
import { CrewBotsContext } from "../(data)/crew-bots-context";
import { CrewWorkspacesContext } from "../(data)/crew-workspaces-context";
import { BotMessageActionsContext } from "../(data)/message-actions-context";
import { SpeakMessageContext } from "../(data)/speak-message-context";
import {
    StopBotContext,
    type StopBotState,
} from "../(data)/stop-bot-context";
import reactToBotMessage from "../(functions)/react-to-bot-message";
import botBusyState from "../(utils)/bot-busy-state";
import dropSentMessage from "../(utils)/drop-sent-message";
import useBotComputers from "../(hooks)/use-bot-computers";
import useStopBot from "../(hooks)/use-stop-bot";
import useTaskProgress from "../(hooks)/use-task-progress";
import useReplyProgress from "../(hooks)/use-reply-progress";
import useReplyCatchUp from "../(hooks)/use-reply-catch-up";
import useSpeakMessage from "../(hooks)/use-speak-message";
import useOlderMessages from "../(hooks)/use-older-messages";
import ConversationHeader from "../(partials)/conversation-header";
import MessageThread from "../(partials)/message-thread";
import Composer, { type ComposerHandle } from "../(partials)/composer";
import ComputerViewerModal from "../(partials)/computer-viewer-modal";
import HistoryErrorRow from "../(partials)/history-error-row";
import useConversationHistory from "../(hooks)/use-conversation-history";
import mergeLoadedHistory from "../(utils)/merge-loaded-history";
import LoadingLine from "@/src/components/general/loading-line";
import SessionMovedBar from "../(partials)/session-moved-bar";
import syncSessionQuery from "../(utils)/sync-session-query";
import announceShownSession from "@/src/functions/frontend/announce-shown-session";

/**
 * The conversation column: header, bottom-anchored thread, composer, the
 * thread and composer held to a readable width. Shows one session of the
 * bot's conversation, on its own or in a workspace (`pageProps.workspace`).
 * The bot's computers are shared with the header's modal and the computer
 * buttons in the thread, so a switch from either shows in both; either
 * can open one in the viewer. Bot messages can be read aloud, one at a
 * time. Text selected in the thread can be quoted in the composer, which
 * mentions the crew and workspaces the user sees. The page brings
 * everything but the history, so the header and composer show at once;
 * the history (the session's latest messages and the bot's task there)
 * loads on the client with a loading line under the header, and again
 * when the back button restores the page. Older messages load as the
 * thread scrolls up. `?session_id=` opens another session of the
 * conversation; a closed one shows, in the composer's place, a link to
 * where the conversation went on.
 */
export default function Conversation() {
    const { pageProps } = useContext(AppContext);
    const bot = pageProps?.bot;
    const workspace = pageProps?.workspace?.id ? pageProps.workspace : null;
    const workspace_id = workspace?.id || null;

    const [messages, setMessages] = useState<BotMessageWithAttachments[]>(
        [],
    );
    /**
     * Messages sent here that the server hasn't confirmed yet, shown after
     * the saved ones so a slow connection never hides what was typed. They
     * give way to the saved message, which arrives by the response or a
     * push.
     */
    const [pending_messages, setPendingMessages] = useState<
        BotMessageWithAttachments[]
    >([]);
    const [session_id, setSessionId] = useState<number | null>(null);
    /**
     * Set when the session shown was carried over into a newer one
     * (opened by `?session_id=`, or carried on from while on screen): that
     * session, which the composer gives way to a link to.
     */
    const [moved_to_session_id, setMovedToSessionId] = useState<number | null>(null);
    const [has_other_unread, setHasOtherUnread] = useState(false);
    const [reply_to, setReplyTo] = useState<BotMessageWithAttachments | null>(
        null,
    );

    /**
     * A quote picked in one session doesn't follow the thread to another,
     * and neither does a message still on its way to the old one. The
     * first session the thread learns of isn't a move: what was sent
     * before the history landed stays.
     */
    const known_session = useRef<number | null>(null);
    /**
     * Set when the user's own message carried the conversation into a new
     * session (the rollover at the session length): the thread follows
     * it, and what's on its way goes there, so it stays.
     */
    const following_send = useRef(false);

    useEffect(() => {
        const moved = Boolean(known_session.current);

        known_session.current = session_id;

        if (!moved) return;

        if (following_send.current) {
            following_send.current = false;
            setReplyTo(null);
            return;
        }

        setReplyTo(null);
        setPendingMessages([]);
    }, [session_id]);

    const bots = useLiveBots({
        bots: pageProps?.bots || [],
        open_bot_id: bot?.id || undefined,
        workspace_id,
    });
    const live_bot = bots.find((b) => b.id == bot?.id) || bot;
    const workspaces = useLiveWorkspaces({
        workspaces: pageProps?.workspaces || [],
        open_workspace_id: workspace_id || undefined,
    });
    const composer = useRef<ComposerHandle>(null);
    const bot_computers = useBotComputers({
        bot_id: bot?.id || 0,
        workspace_id,
        computers: pageProps?.bot_computers || [],
    });
    const stop_bot = useStopBot({
        bot_id: bot?.id || 0,
        workspace_id,
    });

    const speak = useSpeakMessage({
        enabled: Boolean(pageProps?.bot_voice?.speech),
    });

    const progress = useTaskProgress({
        bot_id: bot?.id || 0,
        session_id,
        task: null,
    });

    const older = useOlderMessages({
        session_id,
        has_more: false,
        first_message_id: Number(messages[0]?.id) || null,
        onLoaded: ({ messages: older_messages }) =>
            setMessages((prev) => [
                ...older_messages.filter(
                    (message) => !prev.some((m) => m.id == message.id),
                ),
                ...prev,
            ]),
    });

    const history = useConversationHistory({
        bot_id: Number(bot?.id) || 0,
        workspace_id,
        onLoaded: ({ history }) => {
            const loaded_session_id = Number(history.session.id);

            setSessionId(loaded_session_id);
            setMovedToSessionId(history.moved_to_session_id || null);
            syncSessionQuery({ session: history.session });
            announceShownSession({
                bot_id: Number(bot?.id) || 0,
                workspace_id,
                session: history.session,
            });
            setMessages((prev) => mergeLoadedHistory({ shown: prev, history }));
            older.reset({
                session_id: loaded_session_id,
                has_more: history.has_more,
                previous_session_id: Number(history.session.previous_session_id) || null,
            });
            progress.reset({ task: history.task });
        },
    });

    const thread_messages = useMemo(
        () => [...messages, ...pending_messages],
        [messages, pending_messages],
    );

    const last_saved_id = messages[messages.length - 1]?.id || null;
    const last_thread_message = thread_messages[thread_messages.length - 1];
    /**
     * A session moved on from gets no reply here: the bot answered in the
     * new one. The face is the live one, as the thinking row reads it: the
     * page's is from when it rendered, so after an interim message the
     * catch-up would stop while the row stays up.
     */
    const awaiting_reply =
        !moved_to_session_id &&
        isAwaitingReply({ last_message: last_thread_message, face: live_bot?.face });

    const reply_progress = useReplyProgress({
        bot_id: bot?.id || 0,
        session_id,
        last_message_id: last_saved_id,
    });

    useReplyCatchUp({
        session_id,
        awaiting_reply,
        last_message_id: last_saved_id,
    });

    /**
     * A message that starts a newer session (sent here or in another tab)
     * moves the thread onto it.
     */
    const startsNewSession = (message: BotMessageWithAttachments) =>
        Boolean(
            message.session_id &&
            (!session_id || Number(message.session_id) > session_id),
        );

    useServerEvent({
        event: "server:bot-message",
        onData: (message: BotMessageWithAttachments) => {
            if (message.bot_id != bot?.id) return;
            if ((message.workspace_id || null) != workspace_id) return;

            /**
             * A pushed copy of a message sent here (its response can come
             * after the push) takes the pending bubble's place.
             */
            setPendingMessages((prev) =>
                dropSentMessage({ pending: prev, message }),
            );

            /**
             * Before the history lands the thread has no session yet: the
             * message waits in the thread, and the history merges with it.
             */
            if (
                session_id &&
                message.session_id &&
                message.session_id != session_id
            ) {
                /**
                 * This session's conversation was carried into a new one,
                 * whose summary opens it. While the user's message is on
                 * its way, it was that message (the rollover at the
                 * session length): the thread follows into the new
                 * session. Otherwise (the bot, Continue in new session in
                 * another tab) the composer gives way to a link there.
                 */
                if (Number(message.carried_from_session_id) == session_id) {
                    if (pending_messages.length) {
                        following_send.current = true;
                        history.retry();
                        return;
                    }

                    setMovedToSessionId(Number(message.session_id));
                    return;
                }

                /**
                 * The user wrote in a newer session (another tab, or a
                 * rollover whose summary push was missed): the thread
                 * moves there, and loads it so its opening shows too.
                 */
                if (message.author == "user" && !message.from_chatroom_id && startsNewSession(message)) {
                    setSessionId(Number(message.session_id));
                    setMessages([message]);
                    history.retry();
                } else if (message.author == "user" && !message.from_chatroom_id) {
                    window.location.reload();
                } else {
                    setHasOtherUnread(true);
                }

                return;
            }

            /**
             * A copy already shown keeps its place; one that arrives with
             * its usage (the relay or the catch-up, after a push without
             * it) fills in the tokens.
             */
            setMessages((prev) =>
                prev.some((m) => m.id == message.id)
                    ? message.usage
                        ? prev.map((m) =>
                              m.id == message.id && !m.usage
                                  ? { ...m, usage: message.usage }
                                  : m,
                          )
                        : prev
                    : [...prev, message],
            );

            if (message.author == "bot" && message.session_id) {
                fetchApi(`/api/admin/bots/mark-read`, {
                    method: "POST",
                    body: { session_id: message.session_id },
                }).catch(() => {});
            }
        },
    });

    /**
     * A reaction toggled here or in another tab: the pushed list replaces
     * the message's own.
     */
    const applyReactions = ({
        message_id,
        reactions,
    }: BotMessageReactionData) => {
        setMessages((prev) =>
            prev.map((message) =>
                Number(message.id) == message_id
                    ? { ...message, reactions }
                    : message,
            ),
        );
    };

    useServerEvent({ event: "server:bot-reaction", onData: applyReactions });

    const reactToMessage = async ({
        message_id,
        emoji,
    }: {
        message_id: number;
        emoji: BotMessageReactionEmoji;
    }) => {
        const res = await reactToBotMessage({ message_id, emoji });

        if (res.success && res.singleRes) applyReactions(res.singleRes);
    };

    /**
     * Kept the same across renders, so a live step or a face change
     * doesn't re-render every message (they read it from context).
     */
    const message_actions = useMemo(
        () => ({
            onReply: ({ message }: { message: BotMessageWithAttachments }) =>
                setReplyTo(message),
            onReact: reactToMessage,
        }),
        [],
    );

    if (!bot?.id || !live_bot) return null;

    /**
     * What the stop control pulls the plug on, read the way the thinking
     * row reads it: the same conditions, so the header's row is enabled
     * exactly while the thread shows the bot at work.
     */
    const stop_state: StopBotState = {
        ...stop_bot,
        can_stop: botBusyState({
            bot: live_bot,
            awaiting_reply,
            receiving: pending_messages.length > 0,
            has_task: Boolean(progress.task_id),
        }).stoppable,
    };

    /**
     * The thread, kept intact so the stop control can wrap it without
     * reindenting every provider.
     */
    const thread = (
        <CrewBotsContext.Provider value={bots}>
            <CrewWorkspacesContext.Provider value={workspaces}>
                <BotComputersContext.Provider value={bot_computers}>
                    <SpeakMessageContext.Provider value={speak}>
                        <BotMessageActionsContext.Provider
                            value={message_actions}
                        >
                            <Stack className="grow min-w-0 h-full gap-0! items-stretch">
                                <ConversationHeader
                                    bot={live_bot}
                                    workspace={workspace}
                                    has_other_unread={has_other_unread}
                                />
                                {history.loading ? (
                                    <LoadingLine label="Loading the conversation" />
                                ) : null}
                                {history.error ? (
                                    <HistoryErrorRow
                                        error={history.error}
                                        onRetry={history.retry}
                                    />
                                ) : null}
                                <MessageThread
                                    bot={live_bot}
                                    messages={thread_messages}
                                    progress={progress.text}
                                    reply_progress={reply_progress}
                                    receiving={pending_messages.length > 0}
                                    has_task={Boolean(progress.task_id)}
                                    moved_on={Boolean(moved_to_session_id)}
                                    older={older}
                                    onQuote={({ text }) =>
                                        composer.current?.insertQuote({ text })
                                    }
                                />
                                {moved_to_session_id ? (
                                    <SessionMovedBar
                                        bot_id={Number(bot.id)}
                                        workspace_id={workspace_id}
                                        moved_to_session_id={moved_to_session_id}
                                    />
                                ) : (
                                <Composer
                                    handle_ref={composer}
                                    bot={bot}
                                    workspace_id={workspace_id}
                                    extensions={pageProps?.bot_extensions}
                                    voice={pageProps?.bot_voice}
                                    reply_to={reply_to}
                                    onCancelReply={() => setReplyTo(null)}
                                    onSendStart={({ message }) =>
                                        setPendingMessages((prev) => [
                                            ...prev,
                                            message,
                                        ])
                                    }
                                    onSendFailed={({ temp_id }) =>
                                        setPendingMessages((prev) =>
                                            prev.filter(
                                                (message) =>
                                                    message.id != temp_id,
                                            ),
                                        )
                                    }
                                    onSent={({ message }) => {
                                        setReplyTo(null);
                                        setPendingMessages((prev) =>
                                            dropSentMessage({
                                                pending: prev,
                                                message,
                                            }),
                                        );

                                        if (
                                            startsNewSession(message) &&
                                            message.session_id != session_id
                                        ) {
                                            following_send.current = true;
                                            setSessionId(
                                                Number(message.session_id),
                                            );
                                            setMessages([message]);
                                            history.retry();
                                            return;
                                        }

                                        setMessages((prev) =>
                                            prev.some((m) => m.id == message.id)
                                                ? prev
                                                : [...prev, message],
                                        );
                                    }}
                                />
                                )}
                            </Stack>
                        </BotMessageActionsContext.Provider>
                        <ComputerViewerModal bot={live_bot} />
                    </SpeakMessageContext.Provider>
                </BotComputersContext.Provider>
            </CrewWorkspacesContext.Provider>
        </CrewBotsContext.Provider>
    );

    return (
        <StopBotContext.Provider value={stop_state}>
            {thread}
        </StopBotContext.Provider>
    );
}
