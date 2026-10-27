import { useState } from "react";
import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import useServerEvent from "@/src/hooks/use-server-event";
import type { ChatroomMessageData, ChatroomSummary } from "@/src/types";

type Params = {
    chatroom: ChatroomSummary;
    messages: BUN_SQLITE_COBBLE_BOT_MESSAGES[];
};

/**
 * The open room kept current from server pushes: its state and bots
 * (`server:chatroom-updated`) and every new message in it
 * (`server:chatroom-message`), deduped by id.
 */
export default function useLiveChatroom({ chatroom, messages }: Params) {
    const [room, setRoom] = useState(chatroom);
    const [thread, setThread] = useState(messages);

    useServerEvent({
        event: "server:chatroom-updated",
        onData: (data: ChatroomSummary) => {
            if (data.id == room.id) setRoom(data);
        },
    });

    useServerEvent({
        event: "server:chatroom-message",
        onData: (data: ChatroomMessageData) => {
            if (data.chatroom_id != room.id) return;

            setThread((prev) =>
                prev.some((message) => message.id == data.message.id) ? prev : [...prev, data.message],
            );
        },
    });

    return { room, thread };
}
