import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_BOT_TASKS,
    BUN_SQLITE_COBBLE_BOTS_QUEUE,
    BunSQLiteTables,
} from "@/db/types/db";
import AppError from "@/src/utils/app-error";
import grabUserBot from "../bots/grab-user-bot";
import grabBotComputers from "../computers/grab-bot-computers";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    title: string;
    /**
     * The brief the bot writes for itself (markdown): what to do and how
     * it knows it's done.
     */
    instructions: string;
    params?: Record<string, unknown>;
    /**
     * The user message that asked for this work.
     */
    message_id?: number | string;
    /**
     * The task for the working-on panel. One is created from `title` when
     * not given.
     */
    task_id?: number | string;
    /**
     * Must be one of the bot's computers (direct or through a workspace).
     */
    computer_id?: number | string;
    /**
     * Milliseconds to hold the job back before it can be claimed.
     */
    delay?: number;
};

/**
 * Queues long-running work for one of the user's bots and returns the job
 * id. The bot replies to the user straight away (that it's on it); the
 * queue handler does the work and `completeBotJob` posts the result. Not
 * every message needs a job; quick answers are replied to directly.
 */
export default async function enqueueBotJob({
    user_id,
    bot_id,
    title,
    instructions,
    params,
    message_id,
    task_id,
    computer_id,
    delay,
}: Params) {
    const bot = await grabUserBot({ bot_id, user_id });

    if (!bot?.id) {
        throw new AppError(`Bot not found.`);
    }

    if (message_id && !(await belongsToBot({ table: "bot_messages", id: message_id, bot_id: bot.id }))) {
        throw new AppError(`Message not found.`);
    }

    if (task_id && !(await belongsToBot({ table: "bot_tasks", id: task_id, bot_id: bot.id }))) {
        throw new AppError(`Task not found.`);
    }

    if (computer_id) {
        const computers = await grabBotComputers({ bot_id: bot.id, user_id });

        if (!computers.some((c) => String(c.id) == String(computer_id))) {
            throw new AppError(`This bot has no access to that computer.`);
        }
    }

    const final_task_id = task_id || (await createJobTask({ bot_id: bot.id, title }));

    const res = await BunSQLite.queue.add<
        BUN_SQLITE_COBBLE_BOTS_QUEUE,
        (typeof BunSQLiteTables)[number]
    >({
        table: "bots_queue",
        data: [
            {
                bot_id: bot.id,
                title,
                instructions,
                params: params ? JSON.stringify(params) : undefined,
                message_id: message_id ? Number(message_id) : undefined,
                task_id: Number(final_task_id),
                computer_id: computer_id ? Number(computer_id) : undefined,
            },
        ],
        delay,
    });

    const job_id = res.singleRes?.id || res.postInsertReturn?.insertId;

    if (!res.success || !job_id) {
        throw new Error(`Couldn't queue the job: ${res.msg || res.error}`);
    }

    return job_id;
}

async function belongsToBot({
    table,
    id,
    bot_id,
}: {
    table: "bot_messages" | "bot_tasks";
    id: number | string;
    bot_id: number;
}) {
    const res = await BunSQLite.sql({
        sql: `SELECT id FROM ${table} WHERE id = ? AND bot_id = ? LIMIT 1`,
        values: [id, bot_id],
    });

    return Boolean(res.payload?.[0]);
}

async function createJobTask({
    bot_id,
    title,
}: {
    bot_id: number;
    title: string;
}) {
    const res = await BunSQLite.insert<
        BUN_SQLITE_COBBLE_BOT_TASKS,
        (typeof BunSQLiteTables)[number]
    >({
        table: "bot_tasks",
        data: [{ bot_id, title, status: "active" }],
    });

    const task_id = res.singleRes?.id || res.postInsertReturn?.insertId;

    if (!res.success || !task_id) {
        throw new Error(`Couldn't create the job's task: ${res.msg}`);
    }

    return task_id;
}
