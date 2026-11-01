import BunSQLite from "@moduletrace/bun-sqlite";
import type { BotHookWithNames } from "@/src/types";
import botFaceSql from "@/src/utils/bot-face-sql";
import routineScopeSql from "@/src/utils/routine-scope/routine-scope-sql";

type Params = {
    user_id: number | string;
    /**
     * Only this bot's.
     */
    bot_id?: number | string;
    /**
     * With `bot_id`: only the hooks of that conversation (null is the
     * bot's own chat), as `grabCronJobs` does for routines.
     */
    workspace_id?: number | string | null;
    /**
     * Only this one.
     */
    hook_id?: number | string;
};

/**
 * The user's hooks with their bot (its face as the user sees it) and
 * workspace names, the most recently called first. Never their token hash
 * or signing secret, nor a notification hook's stored token.
 */
export default async function grabBotHooks({
    user_id,
    bot_id,
    workspace_id,
    hook_id,
}: Params): Promise<BotHookWithNames[]> {
    const face = botFaceSql({ user_id, prefix: "bot_" });
    const where = [`h.user_id = ?`];
    const values: (number | string)[] = [user_id];

    if (bot_id) {
        if (workspace_id === undefined) {
            where.push(`h.bot_id = ?`);
            values.push(bot_id);
        } else {
            const scope = routineScopeSql({ bot_id, workspace_id, alias: "h" });

            where.push(scope.sql);
            values.push(...scope.values);
        }
    }

    if (hook_id) {
        where.push(`h.id = ?`);
        values.push(hook_id);
    }

    const res = await BunSQLite.sql<BotHookWithNames>({
        sql: `SELECT h.id, h.created_at, h.updated_at, h.user_id, h.bot_id, h.workspace_id, h.title,
                h.instructions, h.computer_id, h.token_prefix, h.signature_header, h.signature_format,
                h.enabled, h.run_count, h.last_called_at, h.last_job_id, h.last_error,
                h.source, h.watch_computer_id, h.watch_filter, wc.name AS watch_computer_name,
                (COALESCE(h.signing_secret, '') != '') AS has_signing_secret,
                b.name AS bot_name, b.kind AS bot_kind, b.hue AS bot_hue, b.color AS bot_color, b.stone AS bot_stone, ${face.sql},
                b.image_media_id AS bot_image_media_id, w.name AS workspace_name
            FROM bot_hooks h
            JOIN bots b ON b.id = h.bot_id
            LEFT JOIN workspaces w ON w.id = h.workspace_id
            LEFT JOIN computers wc ON wc.id = h.watch_computer_id
            WHERE ${where.join(" AND ")}
            ORDER BY h.enabled DESC, h.last_called_at IS NULL, h.last_called_at DESC, h.id DESC`,
        values: [...face.values, ...values],
    });

    return res.payload || [];
}
