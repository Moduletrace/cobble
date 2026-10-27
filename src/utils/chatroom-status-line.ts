import type { ChatroomSummary } from "@/src/types";

type Params = Pick<ChatroomSummary, "status" | "working">;

/**
 * One line on where a chatroom stands, for its rows and header. Said in
 * words: hues are bot identity, never status.
 */
export default function chatroomStatusLine({ status, working }: Params) {
    switch (status) {
        case "answered":
            return "Answered";
        case "refused":
            return "Turned down";
        case "failed":
            return "Couldn't be answered";
        case "stopped":
            return "Stopped";
        default:
            return working ? "Working on it" : "Waiting";
    }
}
