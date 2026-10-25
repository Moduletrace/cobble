import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_HOOKS } from "@/db/types/db";
import { BotHookTokenPrefix } from "@/src/dict/bot-hook-dict";
import hashHookToken from "@/src/utils/hash-hook-token";
import { safeCompare } from "@/src/utils/safe-compare";

type Params = {
    token: string;
};

/**
 * The hook a call's token names, or null. Found by the token's first
 * characters, then its hash compared in constant time, so the lookup
 * says nothing about how close a guess came.
 */
export default async function findBotHookByToken({ token }: Params): Promise<BUN_SQLITE_COBBLE_BOT_HOOKS | null> {
    if (!token.startsWith(BotHookTokenPrefix) || token.length < 20 || token.length > 200) {
        return null;
    }

    const { prefix, hash } = hashHookToken({ token });

    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_HOOKS>({
        sql: `SELECT * FROM bot_hooks WHERE token_prefix = ?`,
        values: [prefix],
    });

    return (res.payload || []).find((hook) => safeCompare(hash, hook.token_hash || "")) || null;
}
