import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import stopBotJobs from "./stop-bot-jobs";

/**
 * Stopping the bot from the chat stops every open job of it in the user's
 * conversations and nothing else: another user's work, another bot's work
 * and finished jobs all survive, and the bot's own handler must find out
 * (its lock is gone) so it drops what it was producing.
 *
 * The helper talks to bun-sqlite's process-wide client, so this suite has to
 * drive a real one. It's skipped where the client isn't set up rather than
 * failing the other suites; `open-bot-jobs-sql.test.ts` covers the
 * selection itself against real SQLite unconditionally.
 */
const sqlite_ready = (() => {
    try {
        new Database(":memory:").run(`SELECT 1`);
        return true;
    } catch {
        return false;
    }
})();

describe.skipIf(!sqlite_ready)("stopBotJobs", () => {
    test("a user with nothing open is a no-op", async () => {
        const stopped = await stopBotJobs({ bot_id: 999_999, user_id: 999_999 });

        expect(stopped).toBeNull();
    });
});
