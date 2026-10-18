import { useContext, useState } from "react";
import Stack from "@moduletrace/twui/layout/Stack";
import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import { AppContext } from "@/src/pages/__root";
import ConversationHeader from "../(partials)/conversation-header";
import MessageThread from "../(partials)/message-thread";
import Composer from "../(partials)/composer";

/**
 * The 900px conversation column: header, bottom-anchored thread, composer.
 */
export default function Conversation() {
    const { pageProps } = useContext(AppContext);
    const bot = pageProps?.bot;

    const [messages, setMessages] = useState<BUN_SQLITE_COBBLE_BOT_MESSAGES[]>(
        pageProps?.bot_messages || [],
    );

    if (!bot?.id) return null;

    return (
        <Stack className="grow min-w-0 h-full gap-0! items-stretch">
            <ConversationHeader bot={bot} bots={pageProps?.bots || []} />
            <MessageThread bot={bot} messages={messages} />
            <Composer
                bot={bot}
                onSent={({ message }) =>
                    setMessages((prev) => [...prev, message])
                }
            />
        </Stack>
    );
}
