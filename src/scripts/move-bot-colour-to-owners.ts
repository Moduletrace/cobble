import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import { paletteColor } from "@/src/utils/bot-color";

/**
 * One-off: bots used to carry a palette `hue`, which decided both their
 * colour and their stone shape. They now store a free `color` (`#rrggbb`)
 * and their own `stone`, so a bot keeps the shape it always had while the
 * user can pick any colour. This fills both from the old hue.
 *
 * Safe to run more than once: a bot that already has a colour and a stone
 * is left alone. Run it with
 * `bun src/scripts/move-bot-colour-to-owners.ts`, then it can be deleted
 * along with the `hue` column.
 */
async function moveBotColourToOwners() {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS>({
        sql: `SELECT id, kind, hue, color, stone FROM bots`,
    });

    const bots = res.payload || [];
    let moved = 0;

    for (const bot of bots) {
        if (!bot.id) continue;

        /** The coordinator stays hue-less, whatever it carried. */
        if (bot.kind == "coordinator") {
            if (bot.color || bot.stone || bot.hue) {
                await BunSQLite.sql({
                    sql: `UPDATE bots SET color = NULL, stone = 'ember', hue = NULL, updated_at = ? WHERE id = ?`,
                    values: [Date.now(), bot.id],
                });
            }

            continue;
        }

        /**
         * A bot with a colour has been through this already. A bot without
         * one hasn't, so its `stone` is only the column's default and its
         * hue is the truth: both come from there.
         */
        if (bot.color) continue;

        const color = paletteColor({ hue: bot.hue }) || paletteColor({ hue: "ember" })!;
        const stone = bot.hue || "ember";

        await BunSQLite.sql({
            sql: `UPDATE bots SET color = ?, stone = ?, updated_at = ? WHERE id = ?`,
            values: [color, stone, Date.now(), bot.id],
        });

        moved++;
    }

    console.log(`Done: ${moved} bot(s) given a colour and a stone, ${bots.length} checked.`);
}

await moveBotColourToOwners();
process.exit(0);
