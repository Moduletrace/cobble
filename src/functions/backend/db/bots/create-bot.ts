import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS, BunSQLiteTables } from "@/db/types/db";
import type { BotHue } from "@/src/dict/bot-dict";
import assertPromptLength from "@/src/utils/assert-prompt-length";

type Params = {
    user_id: number | string;
    name: string;
    role?: string;
    hue: BotHue;
    /**
     * Its core instructions (markdown).
     */
    system_prompt: string;
};

/**
 * Adds a worker bot to the user's crew and returns its id. It has no
 * computer of its own until it's given one; in a workspace it uses the
 * workspace's.
 */
export default async function createBot({ user_id, name, role, hue, system_prompt }: Params) {
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
                hue,
                role: role || undefined,
                face: "idle",
                status_line: "",
                system_prompt,
            },
        ],
    });

    const bot_id = res.singleRes?.id || res.postInsertReturn?.insertId;

    if (!res.success || !bot_id) {
        throw new Error(`Couldn't add the bot: ${res.msg}`);
    }

    return Number(bot_id);
}
