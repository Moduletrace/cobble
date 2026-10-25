import BunSQLite from "@moduletrace/bun-sqlite";
import type { BotHookSignatureFormat } from "@/src/dict/bot-hook-dict";
import AppError from "@/src/utils/app-error";
import { encrypt } from "@/src/utils/crypt";
import hookMoveComputers from "@/src/utils/hook-move-computers";
import type { HookSessionChoice } from "@/src/types";
import grabUserConversation from "../bot-sessions/grab-user-conversation";
import isBotJobOpen from "../bots-queue/is-bot-job-open";
import grabBotComputers from "../computers/grab-bot-computers";
import grabUserBotHook from "./grab-user-bot-hook";
import noteHookSession from "./note-hook-session";
import pickHookSession from "./pick-hook-session";
import syncComputerNotifyWatch from "./sync-computer-notify-watch";

type Params = {
    user_id: number | string;
    hook_id: number | string;
    /**
     * Only the fields given are changed. `signing_secret: null` stops
     * checking signatures; a new one replaces the old.
     */
    data: {
        title?: string;
        instructions?: string;
        enabled?: boolean;
        signing_secret?: string | null;
        signature_header?: string;
        signature_format?: BotHookSignatureFormat;
        /**
         * A browser-notification hook's filter; empty takes them all.
         */
        watch_filter?: string;
        /**
         * Where it runs from now, with the same bot: one of its
         * workspaces, or null for its own chat.
         */
        workspace_id?: number | null;
        /**
         * The session its runs land in there (`pickHookSession`). Left
         * out when the place changes: the active one there.
         */
        session?: HookSessionChoice;
    };
};

/**
 * Changes one of the user's hooks: its name and brief, pauses or resumes
 * it, sets how its calls are signed or, for browser notifications, which
 * ones it takes, or moves it to another of its bot's conversations or
 * sessions. Its token stays (rotate it with `rotateBotHookToken`). A move
 * is refused while its last run is open (a call could still join it
 * there); its computer stays only if the bot reaches it in the new place,
 * and a notification hook can't go where its watched computer isn't.
 * Pausing or resuming a notification hook updates its computer's watcher.
 * Returns the hook.
 */
export default async function updateBotHook({ user_id, hook_id, data }: Params) {
    const hook = await grabUserBotHook({ user_id, hook_id });

    const sets: string[] = [];
    const values: (string | number | null)[] = [];

    const set = (field: string, value: string | number | null) => {
        sets.push(`${field} = ?`);
        values.push(value);
    };

    if (data.title !== undefined) set("title", data.title);
    if (data.instructions !== undefined) set("instructions", data.instructions);

    if (data.enabled !== undefined) {
        set("enabled", data.enabled ? 1 : 0);
        if (data.enabled) set("last_error", null);
    }

    const watching = hook.source == "browser_notifications";

    if (data.watch_filter !== undefined) {
        if (!watching) throw new AppError(`Only a browser-notification hook has a filter.`);

        set("watch_filter", data.watch_filter.trim() || null);
    }

    if (watching && (data.signing_secret !== undefined || data.signature_header !== undefined)) {
        throw new AppError(`A browser-notification hook isn't signed.`);
    }

    if (data.signing_secret === null) {
        set("signing_secret", null);
        set("signature_header", null);
        set("signature_format", null);
    } else {
        const secret = data.signing_secret?.trim();
        const signed = Boolean(secret || hook.has_signing_secret);

        const header = (data.signature_header ?? hook.signature_header ?? "").trim();

        if (secret && !header) {
            throw new AppError(`Say which header carries the signature.`);
        }

        if (secret) set("signing_secret", await encrypt(secret));

        if (data.signature_header !== undefined || data.signature_format !== undefined) {
            if (!signed) {
                throw new AppError(`Set a signing secret first.`);
            }

            if (data.signature_header !== undefined) {
                if (!header) throw new AppError(`Say which header carries the signature.`);

                set("signature_header", header);
            }
            if (data.signature_format !== undefined) set("signature_format", data.signature_format);
        }

        if (secret && !hook.signature_format && data.signature_format === undefined) {
            set("signature_format", "sha256=hex");
        }
    }

    let noted_session_id: number | null = null;

    const to_workspace_id = data.workspace_id === undefined ? Number(hook.workspace_id) || null : data.workspace_id || null;
    const moving = to_workspace_id != (Number(hook.workspace_id) || null);
    const choice: HookSessionChoice | undefined = data.session ?? (moving ? "current" : undefined);
    const resessioning =
        choice !== undefined &&
        (choice == "new" || (choice == "current" ? Boolean(hook.session_id) : choice != Number(hook.session_id)));

    if (moving || resessioning) {
        const title = data.title || hook.title || `Hook ${hook.id}`;

        if (hook.last_job_id && (await isBotJobOpen({ job_id: hook.last_job_id }))) {
            throw new AppError(`"${title}" has a run going. Change where it runs once that's done.`);
        }

        if (moving) {
            await grabUserConversation({ user_id, bot_id: hook.bot_id!, workspace_id: to_workspace_id });

            const computers = await grabBotComputers({ bot_id: hook.bot_id!, workspace_id: to_workspace_id });
            const { computer_id } = hookMoveComputers({
                title,
                watching,
                computer_id: hook.computer_id,
                watch_computer_id: hook.watch_computer_id,
                reachable_ids: computers.map((computer) => computer.id!),
            });

            set("workspace_id", to_workspace_id);
            set("computer_id", computer_id);
        }

        const session_id = await pickHookSession({
            user_id,
            bot_id: hook.bot_id!,
            workspace_id: to_workspace_id,
            choice: choice!,
            title,
        });

        set("session_id", session_id);
        noted_session_id = session_id;
    }

    if (!sets.length) return hook;

    set("updated_at", Date.now());

    const res = await BunSQLite.sql({
        sql: `UPDATE bot_hooks SET ${sets.join(", ")} WHERE id = ?`,
        values: [...values, hook.id!],
    });

    if (!res.success) {
        throw new Error(`Couldn't update the hook: ${res.error}`);
    }

    if (noted_session_id) {
        await noteHookSession({
            bot_id: hook.bot_id!,
            session_id: noted_session_id,
            workspace_id: to_workspace_id,
            title: data.title || hook.title || `Hook ${hook.id}`,
        });
    }

    if (watching && data.enabled !== undefined && hook.watch_computer_id) {
        await syncComputerNotifyWatch({ computer_id: hook.watch_computer_id });
    }

    return await grabUserBotHook({ user_id, hook_id: hook.id! });
}
