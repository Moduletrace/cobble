import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS, BunSQLiteTables } from "@/db/types/db";
import { CoordinatorBotName } from "@/src/dict/bot-dict";
import { CoordinatorSystemPrompt } from "@/src/data/coordinator-system-prompt";
import attachDefaultExtensions from "../extensions/attach-default-extensions";
import ensureCoordinatorType from "../bot-types/ensure-coordinator-type";

type Params = {
    /**
     * Who it's created by when it's missing (the super admin).
     */
    user_id: number | string;
};

/**
 * Returns the id of the install's one coordinator (the super admin's
 * alone), creating it first (with the default `CoordinatorSystemPrompt`)
 * if there is none. A
 * coordinator without a prompt gets the default; an edited prompt is never
 * overwritten. Its install-wide `coordinator` bot type is written too
 * (`ensureCoordinatorType`), which backfills older installs. Safe to call
 * on every visit.
 */
export default async function ensureCoordinatorBot({ user_id }: Params) {
    const existing = (
        await BunSQLite.select<
            BUN_SQLITE_COBBLE_BOTS,
            (typeof BunSQLiteTables)[number]
        >({
            table: "bots",
            query: {
                query: {
                    kind: { value: "coordinator" },
                },
                order: { field: "id", strategy: "ASC" },
                limit: 1,
            },
        })
    ).payload?.[0];

    if (existing?.id) {
        if (!existing.system_prompt?.trim()) {
            await BunSQLite.sql({
                sql: `UPDATE bots SET system_prompt = ? WHERE id = ?`,
                values: [CoordinatorSystemPrompt, existing.id],
            });
        }

        await ensureCoordinatorType({ bot_id: existing.id });

        return existing.id;
    }

    const res = await BunSQLite.insert<
        BUN_SQLITE_COBBLE_BOTS,
        (typeof BunSQLiteTables)[number]
    >({
        table: "bots",
        data: [
            {
                user_id: Number(user_id),
                name: CoordinatorBotName,
                kind: "coordinator",
                system_prompt: CoordinatorSystemPrompt,
            },
        ],
    });

    const bot_id = res.singleRes?.id || res.postInsertReturn?.insertId;

    if (!res.success || !bot_id) {
        throw new Error(`Couldn't create the coordinator: ${res.msg}`);
    }

    await attachDefaultExtensions({ bot_id });
    await ensureCoordinatorType({ bot_id });

    return bot_id;
}
