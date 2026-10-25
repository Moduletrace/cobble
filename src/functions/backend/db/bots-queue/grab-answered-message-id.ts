import BunSQLite from "@moduletrace/bun-sqlite";
import answeredMessageIdSql from "./answered-message-id-sql";

type Params = {
    session_id: number | string;
};

/**
 * The newest user message a finished reply in the session answered
 * (`answeredMessageIdSql`), or null when none is on record.
 */
export default async function grabAnsweredMessageId({ session_id }: Params) {
    const { sql, values } = answeredMessageIdSql({ session_id });

    const res = await BunSQLite.sql<{ id: number | null }>({ sql, values });
    const id = res.payload?.[0]?.id;

    return id ? Number(id) : null;
}
