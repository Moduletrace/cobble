import { BotJobStoppedError } from "@/src/dict/bot-queue-dict";
import cancelAskJobs from "./cancel-ask-jobs";
import finishAsk from "./finish-ask";
import grabAsk from "./grab-ask";

type Params = {
    ask_id: number | string;
    /**
     * Tell the bot that asked and wake it (false when its own run was
     * stopped).
     */
    wake?: boolean;
    /**
     * Why it stopped, in the message the asking bot gets.
     */
    reason?: string | null;
};

/**
 * Stops one open request: it ends as `stopped`, the bot that asked hears
 * (when `wake`), and whatever run is working it is cancelled.
 */
export default async function stopAsk({ ask_id, wake = true, reason }: Params) {
    const ask = await grabAsk({ ask_id });

    if (!ask?.id || (ask.status != "pending" && ask.status != "working")) return null;

    const finished = await finishAsk({ ask, status: "stopped", outcome: reason || null, wake });

    if (finished) await cancelAskJobs({ ask_id, reason: BotJobStoppedError });

    return finished;
}
