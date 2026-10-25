import BunSQLite from "@moduletrace/bun-sqlite";
import pushBotNotice from "@/src/bots-queue/push-bot-notice";
import { AppData } from "@/src/data/app-data";
import AppError from "@/src/utils/app-error";
import handOverPlace from "@/src/utils/hand-over-place";
import grabUserConversation from "../bot-sessions/grab-user-conversation";
import ensureBotSession from "../bot-sessions/ensure-bot-session";
import isBotJobOpen from "../bots-queue/is-bot-job-open";
import grabBotById from "../bots/grab-bot-by-id";
import insertBotMessage from "../bots/insert-bot-message";
import grabBotComputers from "../computers/grab-bot-computers";
import ensureBotInWorkspace from "../workspaces/ensure-bot-in-workspace";
import grabUserCronJob from "./grab-user-cron-job";

type Params = {
    /**
     * The user the routine belongs to.
     */
    user_id: number | string;
    cron_job_id: number | string;
    /**
     * Only if it's this bot's (a bot handing over its own).
     */
    from_bot_id?: number | string;
    to_bot_id: number | string;
    /**
     * Where it runs from now, for a routine in the bot's own chat: left
     * out, the new bot's own chat. A routine in a workspace stays there.
     */
    workspace_id?: number | string | null;
    /**
     * Who hands it over, shown in the new bot's conversation.
     */
    handed_by: string;
};

/**
 * Moves one of the user's routines to another bot. A routine in a
 * workspace keeps running there (the bot is added first when it isn't in
 * it); one in a bot's own chat runs in the new bot's, or in the workspace
 * given. Its computer stays only if the new bot reaches it there; its
 * schedule, count and next run are kept. Refused while a run is going,
 * or when the new bot has no room for another. Returns the routine and
 * what was said about joining.
 */
export default async function handOverCronJob({
    user_id,
    cron_job_id,
    from_bot_id,
    to_bot_id,
    workspace_id,
    handed_by,
}: Params) {
    const cron_job = await grabUserCronJob({ user_id, cron_job_id, bot_id: from_bot_id });

    if (Number(cron_job.bot_id) == Number(to_bot_id)) {
        throw new AppError(`${cron_job.bot_name || "That bot"} already runs "${cron_job.title}".`);
    }

    const run_workspace_id = handOverPlace({
        workspace_id: cron_job.workspace_id,
        asked_workspace_id: workspace_id,
        label: `Routine #${cron_job.id} "${cron_job.title}"`,
    });

    if (cron_job.last_job_id && (await isBotJobOpen({ job_id: cron_job.last_job_id }))) {
        throw new AppError(`"${cron_job.title}" has a run going. Hand it over once that's done.`);
    }

    const bot = await grabBotById({ bot_id: to_bot_id });

    if (!bot?.id) {
        throw new AppError(`Bot not found.`);
    }

    const count = Number(
        (
            await BunSQLite.sql<{ n: number }>({
                sql: `SELECT COUNT(*) AS n FROM cron_jobs WHERE bot_id = ? AND user_id = ?`,
                values: [bot.id, user_id],
            })
        ).payload?.[0]?.n || 0,
    );

    if (count >= AppData.CronJobMaxPerBot) {
        throw new AppError(`${bot.name || "That bot"} already has ${AppData.CronJobMaxPerBot} routines.`);
    }

    const joined = run_workspace_id ? await ensureBotInWorkspace({ user_id, bot, workspace_id: run_workspace_id }) : "";

    /**
     * The user must reach the bot there: its own chat, or the workspace.
     */
    await grabUserConversation({ user_id, bot_id: bot.id, workspace_id: run_workspace_id });

    const computers = await grabBotComputers({ bot_id: bot.id, workspace_id: run_workspace_id });
    const computer_id =
        cron_job.computer_id && computers.some((computer) => computer.id == cron_job.computer_id)
            ? cron_job.computer_id
            : null;

    const res = await BunSQLite.sql({
        sql: `UPDATE cron_jobs SET bot_id = ?, workspace_id = ?, computer_id = ?, last_error = NULL, updated_at = ? WHERE id = ?`,
        values: [bot.id, run_workspace_id, computer_id, Date.now(), cron_job.id!],
    });

    if (!res.success) {
        throw new AppError(`Couldn't hand the routine over: ${res.msg || res.error}`);
    }

    const session = await ensureBotSession({ user_id, bot_id: bot.id, workspace_id: run_workspace_id });

    await pushBotNotice({
        bot_id: bot.id,
        message: await insertBotMessage({
            bot_id: bot.id,
            session_id: Number(session.id),
            workspace_id: run_workspace_id,
            text: `${handed_by} handed me the routine **${cron_job.title}** (\`${cron_job.schedule}\`, UTC). It runs here from now on.`,
        }),
    });

    return {
        cron_job: await grabUserCronJob({ user_id, cron_job_id: cron_job.id! }),
        bot_name: bot.name || "The bot",
        joined,
        computer_dropped: Boolean(cron_job.computer_id && !computer_id),
    };
}
