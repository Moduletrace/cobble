import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_HOOKS, BunSQLiteTables } from "@/db/types/db";
import type { BotHookSignatureFormat, BotHookSource } from "@/src/dict/bot-hook-dict";
import type { BotHookWithToken } from "@/src/types";
import AppError from "@/src/utils/app-error";
import { encrypt } from "@/src/utils/crypt";
import generateHookToken from "@/src/utils/generate-hook-token";
import grabUserConversation from "../bot-sessions/grab-user-conversation";
import assertHookComputers from "./assert-hook-computers";
import assertHookRoom from "./assert-hook-room";
import assertHookRunner from "./assert-hook-runner";
import syncComputerNotifyWatch from "./sync-computer-notify-watch";
import syncHookRunners from "./sync-hook-runners";
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
    /**
     * Its runs stay in its own thread, pushed nowhere, instead of taking
     * over the conversation (see `updateBotHook`).
     */
    silent?: boolean;
    /**
     * A process the app keeps running for the hook (the thing that calls
     * it, like a bridge): typically started by hand in the computer's
     * Shell, it dies with the container, and this brings it back
     * (`syncHookRunners`). A crew manager sets it, and it's never a bot's
     * own: a run doesn't pass it.
     */
    runner_command?: string | null;
    /**
     * Where the runner starts, inside the bot's folder (empty: the folder
     * itself).
     */
    runner_dir?: string | null;
    /**
     * The computer it runs on; none means the hook's own (`computer_id`),
     * else the bot's current one.
     */
    runner_computer_id?: number | string | null;
};

/**
 * Gives one of the user's bots a hook: a secret URL whose calls each queue
 * the brief, with the call's payload, as a task there (`fireBotHook`), in
 * the hook's own thread: the conversation's active one unless it's silent,
 * where the thread stays its own. Returns the hook and its token, which is shown
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
    silent,
    runner_command,
    runner_dir,
    runner_computer_id,
}: Params): Promise<BotHookWithToken> {
    const conversation = await grabUserConversation({ user_id, bot_id, workspace_id });
    const bot_id_num = conversation.bot.id;

    await assertHookRoom({ user_id, bot_id: bot_id_num, bot_name: conversation.bot.name });

    const watching = source == "browser_notifications";
    const run_computer_id = await assertHookComputers({
        user_id,
        bot_id: bot_id_num,
        workspace_id: conversation.workspace_id,
        source,
        computer_id,
        watch_computer_id,
    });

    const secret = watching ? undefined : signing_secret?.trim();

    if (secret && !signature_header?.trim()) {
        throw new AppError(`Say which header carries the signature.`);
    }

    const runner = runner_command?.trim()
        ? {
              command: runner_command.trim(),
              dir: runner_dir?.trim() || null,
              computer_id: await assertHookRunner({
                  user_id,
                  bot_id: bot_id_num,
                  workspace_id: conversation.workspace_id,
                  runner_computer_id,
              }),
          }
        : null;

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
                silent: silent ? 1 : 0,
                runner_command: runner?.command,
                runner_dir: runner?.dir || undefined,
                runner_computer_id: runner?.computer_id || undefined,
            },
        ],
    });

    const hook_id = res.singleRes?.id || res.postInsertReturn?.insertId;

    if (!res.success || !hook_id) {
        throw new Error(`Couldn't save the hook: ${res.msg}`);
    }

    /**
     * A runner is started now rather than at the next check (up to five
     * minutes), and the sync reads what it needs from the row: no need to
     * wait for it here.
     */
    const runner_computer = runner?.computer_id || run_computer_id || null;

    if (runner) {
        syncHookRunners(runner_computer ? { computer_id: runner_computer } : {}).catch(() => {});
    }

    if (watching) {
        const watch = await syncComputerNotifyWatch({ computer_id: watch_computer_id! });

        return { hook: await grabUserBotHook({ user_id, hook_id }), watch };
    }

    return { hook: await grabUserBotHook({ user_id, hook_id }), token };
}
