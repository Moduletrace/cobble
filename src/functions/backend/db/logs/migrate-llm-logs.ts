import BunSQLite from "@moduletrace/bun-sqlite";

/**
 * Moves model failures logged before the LLM category existed out of
 * System, safe to run on every start.
 */
export default async function migrateLlmLogs() {
    await BunSQLite.sql({
        sql: `UPDATE logs SET category = 'llm' WHERE category = 'system' AND title = 'Model failed'`,
    });
}
