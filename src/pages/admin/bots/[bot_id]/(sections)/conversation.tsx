import { useContext, useState } from "react";
import Stack from "@moduletrace/twui/layout/Stack";
import type { BotMessageWithAttachments } from "@/src/types";
import { AppContext } from "@/src/pages/__root";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import useLiveBots from "@/src/hooks/use-live-bots";
import useServerEvent from "@/src/hooks/use-server-event";
import ConversationHeader from "../(partials)/conversation-header";
import MessageThread from "../(partials)/message-thread";
import Composer from "../(partials)/composer";

/**
 * The 900px conversation column: header, bottom-anchored thread, composer.
 */
export default function Conversation() {
    const { pageProps } = useContext(AppContext);
    const bot = pageProps?.bot;

    const [messages, setMessages] = useState<BotMessageWithAttachments[]>(
        pageProps?.bot_messages || [],
    );

    const bots = useLiveBots({ bots: pageProps?.bots || [], open_bot_id: bot?.id || undefined });
    const live_bot = bots.find((b) => b.id == bot?.id) || bot;

    useServerEvent({
        event: "server:bot-message",
        onData: (message: BotMessageWithAttachments) => {
            if (message.bot_id != bot?.id) return;

            setMessages((prev) =>
                prev.some((m) => m.id == message.id) ? prev : [...prev, message],
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
        <Stack className="grow min-w-0 h-full gap-0! items-stretch">
            <ConversationHeader
                bot={live_bot}
                bots={bots}
                harnesses={pageProps?.bot_harness_overview?.harnesses}
            />
            <MessageThread bot={live_bot} messages={messages} />
            <Composer
                bot={bot}
                onSent={({ message }) =>
                    setMessages((prev) =>
                        prev.some((m) => m.id == message.id) ? prev : [...prev, message],
                    )
                }
            />
        </Stack>
    );
}
