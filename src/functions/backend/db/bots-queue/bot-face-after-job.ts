import type { BUN_SQLITE_COBBLE_BOTS_QUEUE } from "@/db/types/db";
import { BotWaitingStatusLine } from "@/src/dict/bot-queue-dict";
import setBotFace from "../bots/set-bot-face";
import answeringAskFace from "./answering-ask-face";
import countOpenBotJobs from "./count-open-bot-jobs";
import grabRunningBotJobFace from "./grab-running-bot-job-face";

type Params = {
    bot_id: number | string;
    user_id: number | string;
    /**
     * Of the job that just ended, so a bot with nothing left shows done
     * after a task and idle after a reply.
     */
    kind?: BUN_SQLITE_COBBLE_BOTS_QUEUE["kind"];
};

/**
 * What a bot shows a user now that one of its jobs ended without asking
 * for them: its resting face when nothing else is open, else the work still
 * running, or waiting when what is left is only queued. Counted for the
 * user alone: another user's job is never on this face.
 */
export default async function botFaceAfterJob({ bot_id, user_id, kind }: Params) {
    /**
     * A crew request's run shows its work too, so the face left to show is
     * the one still processing. Asked first: its session is hidden, so the
     * job counts of one that's still being answered read as nothing open.
     */
    const running = await grabRunningBotJobFace({ bot_id, user_id });

    if (running) return await setBotFace({ bot_id, user_id, ...running });

    const answering = await answeringAskFace({ bot_id, user_id });

    if (answering) return await setBotFace({ bot_id, user_id, ...answering });

    const open = await countOpenBotJobs({ bot_id, user_id, conversations_only: true });

    if (!open) {
        return await setBotFace({ bot_id, user_id, face: kind == "task" ? "done" : "idle" });
    }

    /**
     * Jobs are open for this user but none is running (`deferBotJob` put
     * them back while every model rests, or they wait in the queue): the
     * bot waits, rather than showing work that isn't happening.
     */
    return await setBotFace({
        bot_id,
        user_id,
        face: "asleep",
        status_line: BotWaitingStatusLine,
    });
}