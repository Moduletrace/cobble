import { useContext, useState } from "react";
import Stack from "@moduletrace/twui/layout/Stack";
import type { BotMessageWithAttachments } from "@/src/types";
import { AppContext } from "@/src/pages/__root";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import useLiveBots from "@/src/hooks/use-live-bots";
import useServerEvent from "@/src/hooks/use-server-event";
import { BotComputersContext } from "../(data)/bot-computers-context";
import { SpeakMessageContext } from "../(data)/speak-message-context";
import useBotComputers from "../(hooks)/use-bot-computers";
import useTaskProgress from "../(hooks)/use-task-progress";
import useReplyProgress from "../(hooks)/use-reply-progress";
import useReplyCatchUp from "../(hooks)/use-reply-catch-up";
import useSpeakMessage from "../(hooks)/use-speak-message";
import ConversationHeader from "../(partials)/conversation-header";
import MessageThread from "../(partials)/message-thread";
import Composer from "../(partials)/composer";
import ComputerViewerModal from "../(partials)/computer-viewer-modal";

/**
 * The conversation column: header, bottom-anchored thread, composer, the
 * thread and composer held to a readable width. Shows one session of the
 * bot's conversation, on its own or in a workspace (`pageProps.workspace`).
 * The bot's computers are shared with the header's modal and the computer
 * buttons in the thread, so a switch from either shows in both; either
 * can open one in the viewer. Bot messages can be read aloud, one at a
 * time.
 */
export default function Conversation() {
    const { pageProps } = useContext(AppContext);
    const bot = pageProps?.bot;
    const workspace = pageProps?.workspace?.id ? pageProps.workspace : null;
    const workspace_id = workspace?.id || null;

    const [messages, setMessages] = useState<BotMessageWithAttachments[]>(
        pageProps?.bot_messages || [],
    );
    const [session_id, setSessionId] = useState<number | null>(pageProps?.bot_session?.id || null);
    const [has_other_unread, setHasOtherUnread] = useState(false);

    const bots = useLiveBots({
        bots: pageProps?.bots || [],
        open_bot_id: bot?.id || undefined,
        workspace_id,
    });
    const live_bot = bots.find((b) => b.id == bot?.id) || bot;
    const bot_computers = useBotComputers({
        bot_id: bot?.id || 0,
        workspace_id,
        computers: pageProps?.bot_computers || [],
    });

    const speak = useSpeakMessage({ enabled: Boolean(pageProps?.bot_voice?.speech) });

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
        Boolean(message.session_id && (!session_id || Number(message.session_id) > session_id));

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

    if (!bot?.id || !live_bot) return null;

    return (
        <BotComputersContext.Provider value={bot_computers}>
            <SpeakMessageContext.Provider value={speak}>
                <Stack className="grow min-w-0 h-full gap-0! items-stretch">
                    <ConversationHeader
                        bot={live_bot}
                        workspace={workspace}
                        has_other_unread={has_other_unread}
                        harnesses={pageProps?.bot_harness_overview?.harnesses}
                    />
                    <MessageThread
                        bot={live_bot}
                        messages={messages}
                        progress={progress.text}
                        reply_progress={reply_progress}
                        has_task={Boolean(progress.task_id)}
                    />
                    <Composer
                        bot={bot}
                        workspace_id={workspace_id}
                        extensions={pageProps?.bot_extensions}
                        voice={pageProps?.bot_voice}
                        onSent={({ message }) => {
                            if (startsNewSession(message) && message.session_id != session_id) {
                                setSessionId(Number(message.session_id));
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
                <ComputerViewerModal bot={live_bot} />
            </SpeakMessageContext.Provider>
        </BotComputersContext.Provider>
    );
}
