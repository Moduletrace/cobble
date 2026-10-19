import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS, BUN_SQLITE_COBBLE_COMPUTERS } from "@/db/types/db";
import { MainComputerName } from "@/src/dict/computer-dict";

/**
 * One-off, safe to run again: moves an install from one crew per user to
 * one shared crew. Before, every user owned their bots, workspaces and
 * computers, with a coordinator and a main computer each; now they belong
 * to the install, with one coordinator (the super admin's alone) and one
 * main computer, and users reach bots through `bot_users` and
 * `workspace_users`.
 *
 * - Every conversation is given to the user who owned its bot.
 * - The super admin's coordinator is kept; every other one is folded into
 *   it (conversations, jobs, routines, memories kept), then deleted.
 * - The super admin's main computer is kept; the others become sandboxes.
 * - A member keeps reaching what they had: their workers are assigned to
 *   them and they're added to their workspaces.
 *
 * Run once per install: `bun src/scripts/share-crew.ts`.
 */
async function shareCrew() {
    const now = Date.now();

    await BunSQLite.sql({
        sql: `UPDATE bot_sessions SET user_id = (SELECT user_id FROM bots WHERE bots.id = bot_sessions.bot_id)
            WHERE user_id IS NULL`,
    });

    const super_admin_id = Number(
        (
            await BunSQLite.sql<{ user_id: number }>({
                sql: `SELECT user_id FROM user_types WHERE user_type = 'super_admin' ORDER BY user_id ASC LIMIT 1`,
            })
        ).payload?.[0]?.user_id,
    );

    if (!super_admin_id) {
        console.log(`No super admin yet: nothing to share.`);
        return;
    }

    await foldCoordinators({ super_admin_id, now });
    await keepOneMainComputer({ super_admin_id, now });
    await keepMembersAccess({ now });
    await keepOneActiveSession({ now });

    console.log(`Done.`);
}

async function foldCoordinators({ super_admin_id, now }: { super_admin_id: number; now: number }) {
    const coordinators =
        (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS>({
                sql: `SELECT id, user_id FROM bots WHERE kind = 'coordinator'
                    ORDER BY user_id = ? DESC, id ASC`,
                values: [super_admin_id],
            })
        ).payload || [];

    const [kept, ...extra] = coordinators;

    if (!kept?.id) return;

    for (const bot of extra) {
        for (const [table, column] of [
            ["bot_sessions", "bot_id"],
            ["bot_messages", "bot_id"],
            ["bot_tasks", "bot_id"],
            ["bots_queue", "bot_id"],
            ["bots_queue", "requested_by_bot_id"],
            ["bots_queue_updates", "bot_id"],
            ["cron_jobs", "bot_id"],
        ] as const) {
            await BunSQLite.sql({
                sql: `UPDATE ${table} SET ${column} = ? WHERE ${column} = ?`,
                values: [kept.id, bot.id!],
            });
        }

        /**
         * What it remembered about a user joins what the kept one has.
         */
        await BunSQLite.sql({
            sql: `INSERT OR IGNORE INTO bot_user_memories (created_at, updated_at, bot_id, user_id, memory)
                SELECT ?, ?, ?, user_id, '' FROM bot_user_memories WHERE bot_id = ?`,
            values: [now, now, kept.id, bot.id!],
        });

        await BunSQLite.sql({
            sql: `UPDATE bot_user_memories SET updated_at = ?, memory = TRIM(memory || char(10) || char(10) || (
                    SELECT old.memory FROM bot_user_memories old WHERE old.bot_id = ? AND old.user_id = bot_user_memories.user_id
                ), char(10))
                WHERE bot_id = ? AND user_id IN (SELECT user_id FROM bot_user_memories WHERE bot_id = ? AND TRIM(COALESCE(memory, '')) != '')`,
            values: [now, bot.id!, kept.id, bot.id!],
        });

        await BunSQLite.sql({ sql: `DELETE FROM bots WHERE id = ?`, values: [bot.id!] });

        console.log(`Folded coordinator #${bot.id} (user #${bot.user_id}) into #${kept.id}.`);
    }
}

async function keepOneMainComputer({ super_admin_id, now }: { super_admin_id: number; now: number }) {
    const mains =
        (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_COMPUTERS>({
                sql: `SELECT id, user_id, name FROM computers WHERE kind = 'main' ORDER BY user_id = ? DESC, id ASC`,
                values: [super_admin_id],
            })
        ).payload || [];

    for (const computer of mains.slice(1)) {
        await BunSQLite.sql({
            sql: `UPDATE computers SET kind = 'sandbox', name = ?, updated_at = ? WHERE id = ?`,
            values: [
                computer.name == MainComputerName ? `Computer ${computer.id}` : computer.name || `Computer ${computer.id}`,
                now,
                computer.id!,
            ],
        });

        console.log(`Computer #${computer.id} (user #${computer.user_id}) is a sandbox now.`);
    }
}

/**
 * Members (not super admins or admins, who reach everything) keep the
 * workers and workspaces that were theirs.
 */
async function keepMembersAccess({ now }: { now: number }) {
    const members = `user_id NOT IN (SELECT user_id FROM user_types WHERE user_type IN ('super_admin', 'admin'))`;

    await BunSQLite.sql({
        sql: `INSERT OR IGNORE INTO bot_users (created_at, updated_at, bot_id, user_id)
            SELECT ?, ?, id, user_id FROM bots WHERE kind = 'worker' AND user_id IS NOT NULL AND ${members}`,
        values: [now, now],
    });

    await BunSQLite.sql({
        sql: `INSERT OR IGNORE INTO workspace_users (created_at, updated_at, workspace_id, user_id)
            SELECT ?, ?, id, user_id FROM workspaces WHERE user_id IS NOT NULL AND ${members}`,
        values: [now, now],
    });
}

/**
 * One active session per user's conversation: an empty extra one is
 * deleted, and of the rest only the latest stays active.
 */
async function keepOneActiveSession({ now }: { now: number }) {
    const same = `s2.user_id IS s.user_id AND s2.bot_id = s.bot_id AND s2.workspace_id IS s.workspace_id
        AND s2.status = 'active' AND s2.id != s.id`;

    await BunSQLite.sql({
        sql: `DELETE FROM bot_sessions WHERE id IN (
            SELECT s.id FROM bot_sessions s
            WHERE s.status = 'active'
            AND NOT EXISTS (SELECT 1 FROM bot_messages m WHERE m.session_id = s.id)
            AND EXISTS (SELECT 1 FROM bot_sessions s2 WHERE ${same})
        )`,
    });

    await BunSQLite.sql({
        sql: `UPDATE bot_sessions SET status = 'closed', updated_at = ? WHERE id IN (
            SELECT s.id FROM bot_sessions s
            WHERE s.status = 'active'
            AND EXISTS (SELECT 1 FROM bot_sessions s2 WHERE ${same}
                AND (s2.last_activity_at > s.last_activity_at OR (s2.last_activity_at = s.last_activity_at AND s2.id > s.id)))
        )`,
        values: [now],
    });
}

await shareCrew();
process.exit(0);
