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
    reason: string;
};

/**
 * The coordinator turns the request down, telling the bot that asked why,
 * and closes the room as refused (`closeChatroom`).
 */
export default function refuseRequestTool({ chatroom, job_id, onClosed }: Params): HarnessTool<Args> {
    return {
        name: "refuse_request",
        description: `Turn the request down and close the room, when no one here can answer it or it shouldn't be done. Say why, so the bot that asked can go on without it.`,
        schema: z.object({
            reason: z.string().trim().min(1).max(4000),
        }),
        run: async ({ args }) => {
            const closed = await closeChatroom({ chatroom_id: chatroom.id!, status: "refused", outcome: args.reason, job_id });

            if (!closed) {
                throw new Error(`This room is already closed.`);
            }

            onClosed?.();

            return `Turned down. The room is closed.`;
        },
    };
}
