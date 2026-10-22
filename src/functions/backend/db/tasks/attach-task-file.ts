import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_BOT_FILES,
    BUN_SQLITE_COBBLE_MEDIA,
    BUN_SQLITE_COBBLE_TASK_MEDIA,
    BunSQLiteTables,
} from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import type { TaskMediaKind } from "@/src/dict/task-dict";
import AppError from "@/src/utils/app-error";
import type { StorageScope } from "@/src/utils/storage-access";
import grabBotFile from "../bot-files/grab-bot-file";
import grabTaskMedia from "./grab-task-media";
import grabTaskRow from "./grab-task-scope";

type Params = {
    task_id: number | string;
    /**
     * One of the run's folders' catalog ids: the file must reach it
     * (`grabBotFile`), so a bot can't link a file outside its storage.
     */
    file_id?: number | string | null;
    /**
     * Or a `media` row the user owns (a chat upload being filed onto a
     * task). Ignored when `file_id` is given.
     */
    media_id?: number | string | null;
    /**
     * The user whose own media may be linked.
     */
    user_id: number | string;
    /**
     * The run's storage scopes, for a bot's file.
     */
    scopes?: StorageScope[];
    kind?: TaskMediaKind;
    /**
     * The bot linking it, when a bot does.
     */
    added_by_bot_id?: number | string | null;
};

export type AttachTaskFileResult = {
    file: BUN_SQLITE_COBBLE_TASK_MEDIA;
    /**
     * Whether the link was already there (the call succeeded either way).
     */
    existed: boolean;
};

/**
 * Links a file to a task as its deliverable or a reference. A bot file is
 * resolved through `grabBotFile`, so only what the run reaches links; a
 * chat upload must be one of the user's own `media` rows. Caps a task at
 * `TaskMediaMaxPerTask` files and never links the same file twice.
 */
export default async function attachTaskFile({
    task_id,
    file_id,
    media_id,
    user_id,
    scopes = [],
    kind = "deliverable",
    added_by_bot_id,
}: Params): Promise<AttachTaskFileResult> {
    const task = await grabTaskRow({ task_id });

    let file: BUN_SQLITE_COBBLE_BOT_FILES | null = null;
    let media: BUN_SQLITE_COBBLE_MEDIA | null = null;

    if (file_id) {
        file = await grabBotFile({ scopes, file_id });

        if (!file?.media_id) {
            throw new AppError(`File #${file_id} isn't one you can reach.`);
        }

        media_id = file.media_id;
    }

    if (!media_id) {
        throw new AppError(`Which file? Give its file id.`);
    }

    media = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_MEDIA>({
            sql: `SELECT * FROM media WHERE id = ? LIMIT 1`,
            values: [Number(media_id)],
        })
    ).payload?.[0] || null;

    if (!media?.id) {
        throw new AppError(`That file's bytes are gone.`);
    }

    /**
     * Without a bot file, the media must be one the user owns: never
     * someone else's upload.
     */
    if (!file && Number(media.user_id || 0) != Number(user_id)) {
        throw new AppError(`That file isn't yours to attach.`);
    }

    const existing = await BunSQLite.sql<BUN_SQLITE_COBBLE_TASK_MEDIA>({
        sql: `SELECT * FROM task_media WHERE task_id = ? AND media_id = ? LIMIT 1`,
        values: [Number(task.id), Number(media.id)],
    });

    if (existing.payload?.[0]) {
        return { file: existing.payload[0], existed: true };
    }

    const count = (await grabTaskMedia({ task_id: task.id! })).length;

    if (count >= AppData.TaskMediaMaxPerTask) {
        throw new AppError(`Task #${task.id} already carries ${AppData.TaskMediaMaxPerTask} files. Unlink one first.`);
    }

    const res = await BunSQLite.insert<BUN_SQLITE_COBBLE_TASK_MEDIA, (typeof BunSQLiteTables)[number]>({
        table: "task_media",
        data: [
            {
                task_id: Number(task.id),
                media_id: Number(media.id),
                bot_file_id: file?.id ? Number(file.id) : undefined,
                kind,
                name: file?.name || media.title || `File ${media.id}`,
                added_by_bot_id: added_by_bot_id ? Number(added_by_bot_id) : undefined,
            },
        ],
    });

    const link_id = res.singleRes?.id || res.postInsertReturn?.insertId;

    if (!res.success || !link_id) {
        throw new Error(`Couldn't link the file: ${res.msg}`);
    }

    return {
        file: (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_TASK_MEDIA>({
                sql: `SELECT * FROM task_media WHERE id = ? LIMIT 1`,
                values: [link_id],
            })
        ).payload![0]!,
        existed: false,
    };
}
