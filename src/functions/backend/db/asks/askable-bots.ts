import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import grabCrewWorkers from "../bots/grab-crew-workers";
import grabUserBot from "../bots/grab-user-bot";

type Params = {
    user_id: number | string;
    requester_bot_id: number | string;
    /**
     * In a workspace its members only; otherwise every worker the user
     * reaches.
     */
    workspace_id?: number | string | null;
};

/**
 * Who one bot may ask from where it works: the other workers the user
 * reaches there, never itself and never the coordinator (the coordinator is
 * the gate, not a member of the crew).
 */
export default async function askableBots({
    user_id,
    requester_bot_id,
    workspace_id,
}: Params): Promise<BUN_SQLITE_COBBLE_BOTS[]> {
    const workers = await grabCrewWorkers({ workspace_id });
    const reachable: BUN_SQLITE_COBBLE_BOTS[] = [];

    for (const worker of workers) {
        if (!worker.id || Number(worker.id) == Number(requester_bot_id)) continue;
        if (!(await grabUserBot({ bot_id: worker.id, user_id }))) continue;

        reachable.push(worker);
    }

    return reachable;
}
