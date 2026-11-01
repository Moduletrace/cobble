import type { BUN_SQLITE_COBBLE_CHATROOMS } from "@/db/types/db";

type Params = {
    chatroom: Pick<BUN_SQLITE_COBBLE_CHATROOMS, "status" | "outcome">;
};

/**
 * What a retried room says on the asking bot's side, so the coordinator
 * knows why it's back and the thread keeps how the last try ended.
 */
export default function chatroomRetryNote({ chatroom }: Params) {
    const heading = `**The user asked to try this again.**`;
    const outcome = chatroom.outcome?.trim();

    if (chatroom.status == "stopped") return `${heading} They stopped the last try.`;

    return outcome ? `${heading} The last try ended with: ${outcome}` : heading;
}
