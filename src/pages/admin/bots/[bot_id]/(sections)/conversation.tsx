import { useContext, useEffect, useMemo, useRef, useState } from "react";
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
import reactToBotMessage from "../(functions)/react-to-bot-message";
import useBotComputers from "../(hooks)/use-bot-computers";
import useTaskProgress from "../(hooks)/use-task-progress";
import useReplyProgress from "../(hooks)/use-reply-progress";
import useReplyCatchUp from "../(hooks)/use-reply-catch-up";
import useSpeakMessage from "../(hooks)/use-speak-message";
import ConversationHeader from "../(partials)/conversation-header";
import MessageThread from "../(partials)/message-thread";
import Composer, { type ComposerHandle } from "../(partials)/composer";
import ComputerViewerModal from "../(partials)/computer-viewer-modal";

/**
 * The conversation column: header, bottom-anchored thread, composer, the
 * thread and composer held to a readable width. Shows one session of the
 * bot's conversation, on its own or in a workspace (`pageProps.workspace`).
 * The bot's computers are shared with the header's modal and the computer
 * buttons in the thread, so a switch from either shows in both; either
 * can open one in the viewer. Bot messages can be read aloud, one at a
 * time. Text selected in the thread can be quoted in the composer, which
 * mentions the crew and workspaces the user sees.
 */
export default function Conversation() {
    const { pageProps } = useContext(AppContext);
    const bot = pageProps?.bot;
    const workspace = pageProps?.workspace?.id ? pageProps.workspace : null;
    const workspace_id = workspace?.id || null;

    const [messages, setMessages] = useState<BotMessageWithAttachments[]>(
        pageProps?.bot_messages || [],
    );
    const [session_id, setSessionId] = useState<number | null>(
        pageProps?.bot_session?.id || null,
    );
    const [has_other_unread, setHasOtherUnread] = useState(false);
    const [reply_to, setReplyTo] = useState<BotMessageWithAttachments | null>(
        null,
    );

    /**
     * A quote picked in one session doesn't follow the thread to another.
     */
    useEffect(() => {
        setReplyTo(null);
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

    const speak = useSpeakMessage({
        enabled: Boolean(pageProps?.bot_voice?.speech),
    });

    const progress = useTaskProgress({
        bot_id: bot?.id || 0,
        session_id,
        task: pageProps?.bot_task || null,
    });

    const reply_progress = useReplyProgress({
        bot_id: bot?.id || 0,
        session_id,
        last_message_id: messages[messages.length - 1]?.id || null,
    });

    const awaiting_reply = messages[messages.length - 1]?.author == "user";

    useReplyCatchUp({
        session_id,
        awaiting_reply,
        last_message_id: messages[messages.length - 1]?.id || null,
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

            if (message.session_id && message.session_id != session_id) {
                if (message.author == "user" && startsNewSession(message)) {
                    setSessionId(Number(message.session_id));
                    setMessages([message]);
                } else if (message.author == "user") {
                    window.location.reload();
                } else {
                    setHasOtherUnread(true);
                }

                return;
            }

            setMessages((prev) =>
                prev.some((m) => m.id == message.id)
                    ? prev
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

    return (
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
                                <MessageThread
                                    bot={live_bot}
                                    messages={messages}
                                    progress={progress.text}
                                    reply_progress={reply_progress}
                                    has_task={Boolean(progress.task_id)}
                                    onQuote={({ text }) =>
                                        composer.current?.insertQuote({ text })
                                    }
                                />
                                <Composer
                                    handle_ref={composer}
                                    bot={bot}
                                    workspace_id={workspace_id}
                                    extensions={pageProps?.bot_extensions}
                                    voice={pageProps?.bot_voice}
                                    reply_to={reply_to}
                                    onCancelReply={() => setReplyTo(null)}
                                    onSent={({ message }) => {
                                        setReplyTo(null);

                                        if (
                                            startsNewSession(message) &&
                                            message.session_id != session_id
                                        ) {
                                            setSessionId(
                                                Number(message.session_id),
                                            );
                                            setMessages([message]);
                                            return;
                                        }

                                        setMessages((prev) =>
                                            prev.some((m) => m.id == message.id)
                                                ? prev
                                                : [...prev, message],
                                        );
                                    }}
                                />
                            </Stack>
                        </BotMessageActionsContext.Provider>
                        <ComputerViewerModal bot={live_bot} />
                    </SpeakMessageContext.Provider>
                </BotComputersContext.Provider>
            </CrewWorkspacesContext.Provider>
        </CrewBotsContext.Provider>
    );
}
