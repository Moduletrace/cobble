import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    /**
     * The table alias to test, for queries that join sessions.
     */
    alias?: string;
};

/**
 * The one test for "a session a user can open": not one bot's part of a
 * crew request (`ask_id`, status `ask`) and not a hook's runs (`hook_id`,
 * status `hook`). Every query that lists or picks a conversation adds it,
 * or a hidden session leaks into the rail, a session list or the prompt.
 */
export default function visibleSessionSql({ alias = "bot_sessions" }: Params = {}) {
    return `(${alias}.ask_id IS NULL AND ${alias}.hook_id IS NULL)`;
}