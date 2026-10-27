import { useContext } from "react";
import { AppContext } from "@/src/pages/__root";
import ChatroomBody from "./chatroom-body";

/**
 * A chatroom, read-only: who is in it, every bot's messages oldest first
 * and how it ended. Nobody writes here; to steer the coordinator, the
 * super admin talks to it directly. An open room can be stopped.
 */
export default function ChatroomView() {
    const { pageProps } = useContext(AppContext);
    const chatroom = pageProps?.chatroom;

    if (!chatroom?.id) return null;

    return <ChatroomBody key={chatroom.id} chatroom={chatroom} messages={pageProps?.chatroom_messages || []} />;
}
