import BunSQLite from "@moduletrace/bun-sqlite";
import { AppData } from "@/src/data/app-data";
import grabBotMessages from "@/src/functions/backend/db/bots/grab-bot-messages";
import type { HarnessMessage } from "@/src/harness/types";
import isCrewMessage from "@/src/utils/is-crew-message";
import messagesToTurns from "./messages-to-turns";
import taskIncomingBaselineSql from "./task-incoming-baseline-sql";

type Params = {
    session_id: number | string;
    /**
     * When the run was queued (`bots_queue.created_at`, ms).
     */
    queued_at: number;
    /**
     * Whose conversation it is.
     */
    user_id: number | string;
};

/**
 * What the user writes in a task run's conversation, for the run to take
 * in (`runTextLoop`'s `incoming`): each `take` returns the messages since
 * the last, starting from when the run was queued. A crew message (a
 * room's outcome, an install answer) is left to the reply it wakes.
 */
export default async function taskIncoming({ session_id, queued_at, user_id }: Params) {
    const { sql, values } = taskIncomingBaselineSql({ session_id, queued_at });
    const res = await BunSQLite.sql<{ id: number }>({ sql, values });

    let seen_id = Number(res.payload?.[0]?.id) || 0;

    const take = async (): Promise<HarnessMessage[]> => {
        const fresh = await grabBotMessages({
            session_id,
            after_id: seen_id,
            author: "user",
            limit: AppData.BotReplyHistoryMessages,
        });

        if (!fresh.length) return [];

        seen_id = Math.max(seen_id, ...fresh.map((message) => Number(message.id)));

        const from_user = fresh.filter((message) => !isCrewMessage({ message }));

        return from_user.length ? await messagesToTurns({ messages: from_user, user_id }) : [];
    };

    return { take };
}
