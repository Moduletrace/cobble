import { z } from "zod";
import type { BUN_SQLITE_COBBLE_CHATROOMS } from "@/db/types/db";
import closeChatroom from "@/src/functions/backend/db/chatrooms/close-chatroom";
import type { HarnessTool } from "../../types";

type Params = {
    chatroom: BUN_SQLITE_COBBLE_CHATROOMS;
    /**
     * The turn's own job, left to finish when the room closes.
     */
    job_id?: number | null;
    /**
     * Called once the room is closed: the turn is done.
     */
    onClosed?: () => void;
};

type Args = {
    answer: string;
};

/**
 * The coordinator sends the answer back to the bot that asked, closing the
 * room as answered (`closeChatroom`).
 */
export default function answerRequesterTool({ chatroom, job_id, onClosed }: Params): HarnessTool<Args> {
    return {
        name: "answer_requester",
        description: `Send the answer back to the bot that asked, and close the room. Write the answer itself, complete and in markdown.`,
        schema: z.object({
            answer: z.string().trim().min(1).max(12000),
        }),
        run: async ({ args }) => {
            const closed = await closeChatroom({ chatroom_id: chatroom.id!, status: "answered", outcome: args.answer, job_id });

            if (!closed) {
                throw new Error(`This room is already closed.`);
            }

            onClosed?.();

            return `Sent. The room is closed.`;
        },
    };
}
