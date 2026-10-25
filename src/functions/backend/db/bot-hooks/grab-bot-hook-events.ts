import BunSQLite from "@moduletrace/bun-sqlite";
import type { BotHookCall } from "@/src/types";
import searchHookCallsSql, { type SearchHookCallsParams } from "./search-hook-calls-sql";

/**
 * Calls to the user's hooks, newest first: all of them, one hook's or one
 * bot's, found by words in what they sent or what their run answered.
 * Each payload and response is cut to a preview in SQL.
 */
export default async function grabBotHookEvents(params: SearchHookCallsParams) {
    const res = await BunSQLite.sql<BotHookCall>(searchHookCallsSql(params));

    return res.payload || [];
}
