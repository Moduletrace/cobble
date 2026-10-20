import BunSQLite from "@moduletrace/bun-sqlite";
import { z } from "zod";
import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import botRef from "@/src/utils/bot-ref";
import type { HarnessTool } from "../../types";

type Args = {
    query?: string;
    limit?: number;
};

/**
 * Lets the coordinator look up crew members in the install: by id, name,
 * role or core instructions, so it can find the bot behind a job before
 * changing or deleting it. Read fresh every call, so a bot another reply
 * just created is already there.
 */
export default function findBotTool(): HarnessTool<Args> {
    return {
        name: "find_bot",
        description: `Find crew members: by id, name, the one-line role, or words in their core instructions. Returns each match's ref (its id, e.g. [bot:3]), name, kind and role. With no query it lists the crew, up to limit. The coordinator is listed too but can't be deleted.`,
        schema: z.object({
            query: z.string().trim().max(200).optional(),
            limit: z.number().int().min(1).max(50).optional(),
        }),
        run: async ({ args }) => {
            const all =
                (
                    await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS>({
                        sql: `SELECT * FROM bots ORDER BY id ASC`,
                        values: [],
                    })
                ).payload || [];

            const query = (args.query || "").trim().toLowerCase();

            const matches = (
                query
                    ? all.filter((bot) =>
                          [bot.id ? String(bot.id) : "", bot.name, bot.role, bot.system_prompt].some(
                              (field) => (field || "").toLowerCase().includes(query),
                          ),
                      )
                    : all
            ).slice(0, args.limit ?? 20);

            if (!matches.length) {
                return `No crew member matches "${args.query || ""}".`;
            }

            return matches
                .map(
                    (bot) =>
                        `${botRef({ id: bot.id || 0 })} ${bot.name} (${bot.kind}${bot.role ? `: ${bot.role}` : ""})`,
                )
                .join("\n");
        },
    };
}
