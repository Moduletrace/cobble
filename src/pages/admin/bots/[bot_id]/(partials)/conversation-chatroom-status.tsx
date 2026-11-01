import { useContext } from "react";
import Stack from "@moduletrace/twui/layout/Stack";
import { ConversationChatroomsContext } from "../(data)/conversation-chatrooms-context";
import ConversationChatroomRow from "./conversation-chatroom-row";

/**
 * Under the thread: every request the bot has open with the crew, until
 * it's done.
 */
export default function ConversationChatroomStatus() {
    const chatrooms = useContext(ConversationChatroomsContext);
    const open = chatrooms.filter((room) => room.status == "open");

    if (!open.length) return null;

    return (
        <Stack className="w-full gap-2! items-stretch">
            {open.map((room) => (
                <ConversationChatroomRow key={room.id} room={room} />
            ))}
        </Stack>
    );
}
