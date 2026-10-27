import type { ChatroomStatus } from "@/src/dict/chatroom-dict";

type Params = {
    chatroom_id: number | string;
    title?: string | null;
    status: ChatroomStatus;
    outcome?: string | null;
};

/**
 * The message that brings a room's outcome back to the bot that asked,
 * naming the request and linking the room.
 */
export default function chatroomOutcomeMessage({ chatroom_id, title, status, outcome }: Params) {
    const request = `"${(title || "your request").trim()}" ([room:${chatroom_id}])`;
    const body = (outcome || "").trim();

    const heading =
        status == "answered"
            ? `The coordinator answered your request ${request}:`
            : status == "refused"
              ? `The coordinator turned down your request ${request}:`
              : status == "stopped"
                ? `Your request ${request} was stopped by the user.`
                : `Your request ${request} couldn't be answered:`;

    return body && status != "stopped" ? `${heading}\n\n${body}` : heading;
}
