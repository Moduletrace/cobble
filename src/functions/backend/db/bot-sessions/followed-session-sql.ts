import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    /**
     * The table alias to test, for queries that join sessions.
     */
    alias?: string;
};

/**
 * The sessions a user follows: every one but a crew request's (status
 * `ask`, read by the bots working it) and a silent hook's thread (its runs
 * are pushed nowhere and read where the hook is). Used where a session
 * should count as the user's activity: unread marks, the rail, the
 * dashboard and the bot's face. Routine threads and a hook that isn't
 * silent always count.
 */
export default function followedSessionSql({ alias = "bot_sessions" }: Params = {}) {
    return `(${alias}.ask_id IS NULL AND NOT EXISTS (SELECT 1 FROM bot_hooks h WHERE h.id = ${alias}.hook_id AND h.silent = 1))`;
}