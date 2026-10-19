import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_CRON_JOBS, BunSQLiteTables } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import AppError from "@/src/utils/app-error";
import nextCronRun from "@/src/utils/next-cron-run";
import grabUserConversation from "../bot-sessions/grab-user-conversation";
import grabBotComputers from "../computers/grab-bot-computers";
import grabUserCronJob from "./grab-user-cron-job";

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
     * A Bun.cron expression, in UTC.
     */
    schedule: string;
    /**
     * Must be one of the bot's computers there; none runs on its current
     * one.
     */
    computer_id?: number | string | null;
    max_runs?: number | null;
};

/**
 * Gives one of the user's bots a schedule: its brief is queued as a task
 * at every run (`fireCronJob`), in the bot's conversation there. Returns
 * the new schedule.
 */
export default async function createCronJob({
    user_id,
    bot_id,
    workspace_id,
    title,
    instructions,
    schedule,
    computer_id,
    max_runs,
}: Params) {
    const conversation = await grabUserConversation({ user_id, bot_id, workspace_id });
    const bot_id_num = conversation.bot.id;

    const count = Number(
        (
            await BunSQLite.sql<{ n: number }>({
                sql: `SELECT COUNT(*) AS n FROM cron_jobs WHERE bot_id = ?`,
                values: [bot_id_num],
            })
        ).payload?.[0]?.n || 0,
    );

    if (count >= AppData.CronJobMaxPerBot) {
        throw new AppError(
            `${conversation.bot.name || "This bot"} already has ${AppData.CronJobMaxPerBot} schedules. Delete one first.`,
        );
    }

    if (computer_id) {
        const computers = await grabBotComputers({
            bot_id: bot_id_num,
            user_id,
            workspace_id: conversation.workspace_id,
        });

        if (!computers.some((c) => String(c.id) == String(computer_id))) {
            throw new AppError(`This bot has no access to that computer.`);
        }
    }

    const next_run_at = nextCronRun({ schedule, check_interval: true });

    if (!next_run_at) {
        throw new AppError(`"${schedule}" never runs.`);
    }

    const res = await BunSQLite.insert<BUN_SQLITE_COBBLE_CRON_JOBS, (typeof BunSQLiteTables)[number]>({
        table: "cron_jobs",
        data: [
            {
                user_id: Number(user_id),
                bot_id: bot_id_num,
                workspace_id: conversation.workspace_id || undefined,
                title,
                instructions,
                schedule: schedule.trim(),
                computer_id: computer_id ? Number(computer_id) : undefined,
                enabled: 1,
                max_runs: max_runs || undefined,
                run_count: 0,
                next_run_at,
            },
        ],
    });

    const cron_job_id = res.singleRes?.id || res.postInsertReturn?.insertId;

    if (!res.success || !cron_job_id) {
        throw new Error(`Couldn't save the schedule: ${res.msg}`);
    }

    return await grabUserCronJob({ user_id, cron_job_id });
}
