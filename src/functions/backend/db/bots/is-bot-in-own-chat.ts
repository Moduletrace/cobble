import BunSQLite from "@moduletrace/bun-sqlite";
import chatBotsSql from "@/src/utils/crew-access/chat-bots-sql";
import grabCrewRole from "../access/grab-crew-role";

type Params = {
    bot_id: number | string;
    user_id: number | string;
};

/**
 * Whether a bot belongs in a user's own chat list (`chatBotsSql`), as
 * opposed to only a workspace they're in. Used to tell a client which
 * rail a newly created bot shows up in.
 */
export default async function isBotInOwnChat({ bot_id, user_id }: Params) {
    const access = chatBotsSql({ role: await grabCrewRole({ user_id }), user_id });

    const res = await BunSQLite.sql<{ present: number }>({
        sql: `SELECT 1 AS present FROM bots b WHERE b.id = ? AND ${access.sql} LIMIT 1`,
        values: [bot_id, ...access.values],
    });

    return Boolean(res.payload?.[0]?.present);
}
