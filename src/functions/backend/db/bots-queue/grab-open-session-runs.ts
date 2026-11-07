import BunSQLite from "@moduletrace/bun-sqlite";
import openSessionRunsSql from "./open-session-runs-sql";

type Params = {
    bot_id: number | string;
    session_id: number | string;
};

export type OpenSessionRun = {
    id: number;
    title: string | null;
    status: "pending" | "processing";
};

/**
 * The bot's runs in this session that are still to report and take in
 * what the user writes here (`openSessionRunsSql`), for the reply to know
 * a correction reaches them.
 */
export default async function grabOpenSessionRuns({ bot_id, session_id }: Params): Promise<OpenSessionRun[]> {
    const { sql, values } = openSessionRunsSql({ bot_id, session_id });
    const res = await BunSQLite.sql<OpenSessionRun>({ sql, values });

    return res.payload || [];
}
