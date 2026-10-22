import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_TASK_NOTES, BunSQLiteTables } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import type { TaskAuthor } from "@/src/dict/task-dict";
import AppError from "@/src/utils/app-error";
import grabTaskRow from "./grab-task-scope";

type Params = {
    task_id: number | string;
    text: string;
    author?: TaskAuthor;
    /**
     * The bot writing it, when a bot does.
     */
    bot_id?: number | string | null;
};

/**
 * Adds a line to a task's progress log. The caller checked the run or user
 * reaches the task. Returns the note read back, so `ActionCheckNote`'s
 * verify step has something real.
 */
export default async function addTaskNote({
    task_id,
    text,
    author = "bot",
    bot_id,
}: Params): Promise<BUN_SQLITE_COBBLE_TASK_NOTES> {
    const task = await grabTaskRow({ task_id });
    const clean = String(text).trim().slice(0, AppData.TaskNoteMaxLength);

    if (!clean) {
        throw new AppError(`A note needs some text.`);
    }

    const res = await BunSQLite.insert<BUN_SQLITE_COBBLE_TASK_NOTES, (typeof BunSQLiteTables)[number]>({
        table: "task_notes",
        data: [{ task_id: Number(task.id), author, bot_id: bot_id ? Number(bot_id) : undefined, text: clean }],
    });

    const note_id = res.singleRes?.id || res.postInsertReturn?.insertId;

    if (!res.success || !note_id) {
        throw new Error(`Couldn't save the note: ${res.msg}`);
    }

    const saved = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_TASK_NOTES>({
            sql: `SELECT * FROM task_notes WHERE id = ? LIMIT 1`,
            values: [note_id],
        })
    ).payload?.[0];

    if (!saved) {
        throw new Error(`The note didn't save.`);
    }

    return saved;
}
