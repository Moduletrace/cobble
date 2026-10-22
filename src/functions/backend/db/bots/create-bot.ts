import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS, BunSQLiteTables } from "@/db/types/db";
import type { BotStoneShape } from "@/src/dict/bot-dict";
import assertPromptLength from "@/src/utils/assert-prompt-length";
import assertCrewManager from "@/src/functions/backend/db/access/assert-crew-manager";
import attachDefaultExtensions from "../extensions/attach-default-extensions";

type Params = {
    /**
     * Who creates it (a super admin or admin). Bots belong to the install.
     */
    user_id: number | string;
    name: string;
    role?: string;
    /**
     * Its identity colour, `#rrggbb`.
     */
    color: string;
    /**
     * Which flat-cut stone it's drawn on.
     */
    stone: BotStoneShape;
    /**
     * Its core instructions (markdown).
     */
    system_prompt: string;
};

/**
 * Adds a worker bot to the install and returns its id. Nobody but super
 * admins and admins reaches it until it's assigned to a user or added to
 * a workspace. It has no
 * computer of its own until it's given one; in a workspace it uses the
 * workspace's.
 */
export default async function createBot({ user_id, name, role, color, stone, system_prompt }: Params) {
    await assertCrewManager({ user_id });

    assertPromptLength({ label: "Instructions", text: system_prompt });

    const res = await BunSQLite.insert<
        BUN_SQLITE_COBBLE_BOTS,
        (typeof BunSQLiteTables)[number]
    >({
        table: "bots",
        data: [
            {
                user_id: Number(user_id),
                name,
                kind: "worker",
                color,
                stone,
                role: role || undefined,
                system_prompt,
            },
        ],
    });

    const bot_id = res.singleRes?.id || res.postInsertReturn?.insertId;

    if (!res.success || !bot_id) {
        throw new Error(`Couldn't add the bot: ${res.msg}`);
    }

    await attachDefaultExtensions({ bot_id });

    return Number(bot_id);
}
