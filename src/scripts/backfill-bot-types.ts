import BunSQLite from "@moduletrace/bun-sqlite";
import ensureCoordinatorType from "@/src/functions/backend/db/bot-types/ensure-coordinator-type";

/**
 * Safe to run again: gives the coordinator (`kind = 'coordinator'`) its
 * install-wide `coordinator` bot type. The super admin's `/admin/bots` does
 * the same through `ensureCoordinatorBot`; this is for a headless install.
 *
 * `bun src/scripts/backfill-bot-types.ts`
 */
async function backfillBotTypes() {
    const res = await BunSQLite.sql<{ id: number }>({ sql: `SELECT id FROM bots WHERE kind = 'coordinator'` });

    for (const row of res.payload || []) await ensureCoordinatorType({ bot_id: row.id });

    console.log(`Checked ${res.payload?.length || 0} coordinator bot types.`);
}

await backfillBotTypes();
process.exit(0);
