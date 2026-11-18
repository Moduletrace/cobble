import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    /**
     * The table alias to test, for queries that join sessions.
     */
    alias?: string;
};

/**
 * The one test for "a session a user can open": not one bot's part of a
 * crew request (`ask_id`, status `ask`). Every query that lists or picks a
 * conversation adds it, or a hidden session leaks into the rail, a session
 * list or the prompt. A routine's and a hook's threads are ordinary
 * sessions: they show and can be chatted in.
 */
export default function visibleSessionSql({ alias = "bot_sessions" }: Params = {}) {
    return `(${alias}.ask_id IS NULL)`;
}
