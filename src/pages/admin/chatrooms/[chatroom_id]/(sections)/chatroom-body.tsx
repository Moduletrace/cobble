import { useContext } from "react";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import { AppContext } from "@/src/pages/__root";
import SettingsShell from "@/src/pages/admin/settings/(partials)/settings-shell";
import { CrewBotsContext } from "@/src/pages/admin/bots/[bot_id]/(data)/crew-bots-context";
import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import type { ChatroomSummary } from "@/src/types";
import chatroomStatusLine from "@/src/utils/chatroom-status-line";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import useLiveChatroom from "../(hooks)/use-live-chatroom";
import ChatroomBotsRow from "../(partials)/chatroom-bots-row";
import ChatroomMessageRow from "../(partials)/chatroom-message-row";
import ChatroomOutcome from "../(partials)/chatroom-outcome";
import ChatroomStopButton from "../(partials)/chatroom-stop-button";
import ChatroomStatus from "./chatroom-status";

type Props = {
    chatroom: ChatroomSummary;
    messages: BUN_SQLITE_COBBLE_BOT_MESSAGES[];
};

/**
 * The open room, live: who is in it and their part, the thread and the
 * outcome, where each bot stands while it's open, with Stop for anyone who can do more than read.
 */
export default function ChatroomBody({ chatroom, messages }: Props) {
    const { pageProps } = useContext(AppContext);
    const { room, thread } = useLiveChatroom({ chatroom, messages });

    const can_stop = room.status == "open" && !isReadOnlyUser({ user_types: pageProps?.user_types || [] });
    const bots = new Map(room.bots.map((bot) => [Number(bot.id), bot]));

    return (
        <CrewBotsContext.Provider value={pageProps?.bots || []}>
            <SettingsShell
                title={room.title || "Chatroom"}
                description={`${chatroomStatusLine(room)}. A request between bots, through the coordinator. Read-only.`}
                action={can_stop ? <ChatroomStopButton chatroom_id={Number(room.id)} /> : undefined}
                no_trail={Boolean(room.workspace_id)}
            >
                <Row className="w-full gap-x-6! gap-y-2! py-5 items-center">
                    {room.bots.map((bot) => (
                        <ChatroomBotsRow
                            key={bot.id}
                            bot={bot}
                            part={
                                bot.id == room.requester_bot_id
                                    ? "asked"
                                    : bot.kind == "coordinator"
                                      ? "passes it on"
                                      : "was asked"
                            }
                        />
                    ))}
                </Row>
                <Stack className="w-full gap-6! items-stretch py-2">
                    {thread.map((message) => (
                        <ChatroomMessageRow
                            key={message.id}
                            message={message}
                            bot={bots.get(Number(message.bot_id)) || null}
                        />
                    ))}
                    <ChatroomOutcome chatroom={room} />
                    <ChatroomStatus room={room} />
                </Stack>
            </SettingsShell>
        </CrewBotsContext.Provider>
    );
}
