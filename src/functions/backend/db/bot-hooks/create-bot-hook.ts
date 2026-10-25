import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_HOOKS, BunSQLiteTables } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import type { BotHookSignatureFormat, BotHookSource } from "@/src/dict/bot-hook-dict";
import type { BotHookWithToken } from "@/src/types";
import AppError from "@/src/utils/app-error";
import { encrypt } from "@/src/utils/crypt";
import generateHookToken from "@/src/utils/generate-hook-token";
import grabUserConversation from "../bot-sessions/grab-user-conversation";
import grabBotComputers from "../computers/grab-bot-computers";
import grabUserComputer from "../computers/grab-user-computer";
import syncComputerNotifyWatch from "./sync-computer-notify-watch";
import grabUserBotHook from "./grab-user-bot-hook";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    /**
     * The workspace it runs in; none for the bot's own chat.
     */
    workspace_id?: number | string | null;
    title: string;
    instructions: string;
    /**
     * Must be one of the bot's computers there; none runs on its current
     * one.
     */
    computer_id?: number | string | null;
    /**
     * When given, every call must be signed with it (HMAC-SHA256 of the
     * raw body) in `signature_header`.
     */
    signing_secret?: string | null;
    signature_header?: string | null;
    signature_format?: BotHookSignatureFormat | null;
    /**
     * `browser_notifications`: called by the watcher on `watch_computer_id`
     * for each of its browser notifications (matching `watch_filter`)
     * instead of by an outside service. Its runs default to that computer.
     */
    source?: BotHookSource;
    watch_computer_id?: number | string | null;
    watch_filter?: string | null;
};

/**
 * Gives one of the user's bots a hook: a secret URL whose calls each queue
 * the brief, with the call's payload, as a task in the bot's conversation
 * there (`fireBotHook`). Returns the hook and its token, which is shown
 * this once: only its hash is kept. A browser-notification hook needs a
 * computer both the user and the bot reach; its token is kept encrypted
 * for that computer's watcher, set up before this returns
 * (`syncComputerNotifyWatch`), and never shown.
 */
export default async function createBotHook({
    user_id,
    bot_id,
    workspace_id,
    title,
    instructions,
    computer_id,
    signing_secret,
    signature_header,
    signature_format,
    source = "url",
    watch_computer_id,
    watch_filter,
}: Params): Promise<BotHookWithToken> {
    const conversation = await grabUserConversation({ user_id, bot_id, workspace_id });
    const bot_id_num = conversation.bot.id;

    const count = Number(
        (
            await BunSQLite.sql<{ n: number }>({
                sql: `SELECT COUNT(*) AS n FROM bot_hooks WHERE bot_id = ? AND user_id = ?`,
                values: [bot_id_num, user_id],
            })
        ).payload?.[0]?.n || 0,
    );

    if (count >= AppData.BotHookMaxPerBot) {
        throw new AppError(
            `${conversation.bot.name || "This bot"} already has ${AppData.BotHookMaxPerBot} hooks. Delete one first.`,
        );
    }

    const watching = source == "browser_notifications";
    const run_computer_id = computer_id || (watching ? watch_computer_id : null);

    if (watching && !watch_computer_id) {
        throw new AppError(`Pick the computer whose notifications it gets.`);
    }

    if (run_computer_id || watch_computer_id) {
        const computers = await grabBotComputers({
            bot_id: bot_id_num,
            workspace_id: conversation.workspace_id,
        });

        for (const id of [run_computer_id, watching ? watch_computer_id : null].filter(Boolean)) {
            if (!computers.some((c) => String(c.id) == String(id))) {
                throw new AppError(`This bot has no access to that computer.`);
            }
        }
    }

    if (watching && !(await grabUserComputer({ user_id, computer_id: watch_computer_id! }))?.id) {
        throw new AppError(`You have no access to that computer.`);
    }

    const secret = watching ? undefined : signing_secret?.trim();

    if (secret && !signature_header?.trim()) {
        throw new AppError(`Say which header carries the signature.`);
    }

    const { token, prefix, hash } = generateHookToken();

    const res = await BunSQLite.insert<BUN_SQLITE_COBBLE_BOT_HOOKS, (typeof BunSQLiteTables)[number]>({
        table: "bot_hooks",
        data: [
            {
                user_id: Number(user_id),
                bot_id: bot_id_num,
                workspace_id: conversation.workspace_id || undefined,
                title,
                instructions,
                computer_id: run_computer_id ? Number(run_computer_id) : undefined,
                source,
                watch_computer_id: watching ? Number(watch_computer_id) : undefined,
                watch_filter: watching ? watch_filter?.trim() || undefined : undefined,
                watch_token: watching ? await encrypt(token) : undefined,
                token_prefix: prefix,
                token_hash: hash,
                signing_secret: secret ? await encrypt(secret) : undefined,
                signature_header: secret ? signature_header?.trim() || undefined : undefined,
                signature_format: secret ? signature_format || "sha256=hex" : undefined,
                enabled: 1,
                run_count: 0,
            },
        ],
    });

    const hook_id = res.singleRes?.id || res.postInsertReturn?.insertId;

    if (!res.success || !hook_id) {
        throw new Error(`Couldn't save the hook: ${res.msg}`);
    }

    if (watching) {
        const watch = await syncComputerNotifyWatch({ computer_id: watch_computer_id! });

        return { hook: await grabUserBotHook({ user_id, hook_id }), watch };
    }

    return { hook: await grabUserBotHook({ user_id, hook_id }), token };
}
