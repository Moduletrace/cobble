import BunSQLite from "@moduletrace/bun-sqlite";
import type { BotJobUpdateData } from "@/src/types";
import openSessionReplyStepSql from "./open-session-reply-step-sql";

type Params = {
    session_id: number | string;
};

/**
 * The step the reply running in a session is on, as `server:bot-job-update`
 * carries it, or null when no reply runs there. Read with a conversation's
 * history and by its catch-up, so a reload (or a push missed while the page
 * stayed open) shows what the reply is doing instead of only its label.
 */
export default async function grabSessionReplyStep({
    session_id,
}: Params): Promise<BotJobUpdateData | null> {
    const { sql, values } = openSessionReplyStepSql({ session_id });
    const res = await BunSQLite.sql<BotJobUpdateData>({ sql, values });
    const step = (res.payload || [])[0];

    return step ? { ...step, id: Number(step.id), task_id: null } : null;
}