import BunSQLite from "@moduletrace/bun-sqlite";
import syncComputerNotifyWatch from "@/src/functions/backend/db/bot-hooks/sync-computer-notify-watch";
import { logError } from "@/src/functions/backend/logger";

/**
 * Keeps the notification watcher running on every computer a hook that's
 * on watches (`syncComputerNotifyWatch`): a restarted or recreated
 * container gets it back, and a Chrome restart put off while a task worked
 * there happens once the computer is free. A failure is logged once per
 * computer and run; the next run tries again.
 */
export default async function syncNotifyWatchers() {
    const rows =
        (
            await BunSQLite.sql<{ computer_id: number }>({
                sql: `SELECT DISTINCT watch_computer_id AS computer_id FROM bot_hooks
                    WHERE source = 'browser_notifications' AND enabled = 1 AND watch_computer_id IS NOT NULL`,
            })
        ).payload || [];

    for (const { computer_id } of rows) {
        const result = await syncComputerNotifyWatch({ computer_id });

        if (!result.ok) {
            await logError({
                title: `Computer #${computer_id}'s notification watcher isn't running`,
                category: "hook",
                error: new Error(result.error || "Unknown"),
                metadata: { computer_id },
            }).catch(() => {});
        }
    }
}
