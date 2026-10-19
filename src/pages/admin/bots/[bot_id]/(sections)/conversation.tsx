import { useContext, useState } from "react";
import Stack from "@moduletrace/twui/layout/Stack";
import type { BotMessageWithAttachments } from "@/src/types";
import { AppContext } from "@/src/pages/__root";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import useLiveBots from "@/src/hooks/use-live-bots";
import useServerEvent from "@/src/hooks/use-server-event";
import { BotComputersContext } from "../(data)/bot-computers-context";
import useBotComputers from "../(hooks)/use-bot-computers";
import useTaskProgress from "../(hooks)/use-task-progress";
import ConversationHeader from "../(partials)/conversation-header";
import MessageThread from "../(partials)/message-thread";
import Composer from "../(partials)/composer";
import ComputerViewerModal from "../(partials)/computer-viewer-modal";

/**
 * The conversation column: header, bottom-anchored thread, composer, the
 * thread and composer held to a readable width.
 * The bot's computers are shared with the header's modal and the computer
 * buttons in the thread, so a switch from either shows in both; either
 * can open one in the viewer.
 */
export default function Conversation() {
    const { pageProps } = useContext(AppContext);
    const bot = pageProps?.bot;

    const [messages, setMessages] = useState<BotMessageWithAttachments[]>(
        pageProps?.bot_messages || [],
    );

    const bots = useLiveBots({
        bots: pageProps?.bots || [],
        open_bot_id: bot?.id || undefined,
    });
    const live_bot = bots.find((b) => b.id == bot?.id) || bot;
    const bot_computers = useBotComputers({
        bot_id: bot?.id || 0,
        computers: pageProps?.bot_computers || [],
    });

    const progress = useTaskProgress({
        bot_id: bot?.id || 0,
        task: pageProps?.bot_task || null,
    });

    console.log(`Refreshing ...`);

    useServerEvent({
        event: "server:bot-message",
        onData: (message: BotMessageWithAttachments) => {
            if (message.bot_id != bot?.id) return;

            setMessages((prev) =>
                prev.some((m) => m.id == message.id)
                    ? prev
                    : [...prev, message],
            );

            if (message.author == "bot") {
                fetchApi(`/api/admin/bots/mark-read`, {
                    method: "POST",
                    body: { bot_id: message.bot_id },
                }).catch(() => {});
            }
        },
    });

    if (!bot?.id || !live_bot) return null;

    return (
        <BotComputersContext.Provider value={bot_computers}>
            <Stack className="grow min-w-0 h-full gap-0! items-stretch">
                <ConversationHeader
                    bot={live_bot}
                    harnesses={pageProps?.bot_harness_overview?.harnesses}
                />
                <MessageThread
                    bot={live_bot}
                    messages={messages}
                    progress={progress}
                />
                <Composer
                    bot={bot}
                    onSent={({ message }) =>
                        setMessages((prev) =>
                            prev.some((m) => m.id == message.id)
                                ? prev
                                : [...prev, message],
                        )
                    }
                />
            </Stack>
            <ComputerViewerModal bot={live_bot} />
        </BotComputersContext.Provider>
    );
}
