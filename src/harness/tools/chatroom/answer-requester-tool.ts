import { z } from "zod";
import type { BUN_SQLITE_COBBLE_CHATROOMS } from "@/db/types/db";
import closeChatroom from "@/src/functions/backend/db/chatrooms/close-chatroom";
import grabChatroomOpenJobs from "@/src/functions/backend/db/chatrooms/grab-chatroom-open-jobs";
import shareRoomFiles from "@/src/functions/backend/db/chatrooms/share-room-files";
import chatroomOpenJobsWarning from "@/src/utils/chatroom-open-jobs-warning";
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
    /**
     * Closes over a job still running in the room, cancelling it.
     */
    close_anyway?: boolean;
};

/**
 * The coordinator sends the answer back to the bot that asked, closing the
 * room as answered (`closeChatroom`). Files it names that the asker can't
 * read are copied to it first and their refs pointed at the copies
 * (`shareRoomFiles`). While a member's job still runs it refuses, unless
 * `close_anyway` says the answer doesn't depend on it: closing cancels that
 * job and the work with it.
 */
export default function answerRequesterTool({ chatroom, job_id, onClosed }: Params): HarnessTool<Args> {
    return {
        name: "answer_requester",
        description: `Send the answer back to the bot that asked, and close the room. Write the answer itself, complete and in markdown. Closing cancels whatever still runs in the room, so while a bot is working this refuses: read where it stands first, or pass close_anyway when the answer doesn't depend on its work.`,
        schema: z.object({
            answer: z.string().trim().min(1).max(12000),
            close_anyway: z
                .boolean()
                .optional()
                .describe("Close over a run still working here, cancelling it: only when the answer doesn't depend on it"),
        }),
        run: async ({ args }) => {
            const open = await grabChatroomOpenJobs({ chatroom_id: chatroom.id!, except_job_id: job_id });

            if (open.length && !args.close_anyway) {
                throw new Error(chatroomOpenJobsWarning({ jobs: open, closing: "Answering" }));
            }

            const outcome = await shareRoomFiles({ chatroom, answer: args.answer });
            const closed = await closeChatroom({ chatroom_id: chatroom.id!, status: "answered", outcome, job_id });

            if (!closed) {
                throw new Error(`This room is already closed.`);
            }

            onClosed?.();

            return `Sent. The room is closed.`;
        },
    };
}
