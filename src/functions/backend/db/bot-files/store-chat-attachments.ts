import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_MEDIA } from "@/db/types/db";
import { BotUploadFolder } from "@/src/dict/bot-file-dict";
import enqueueFileIngest from "@/src/file-ingest/enqueue-file-ingest";
import { logError } from "@/src/functions/backend/logger";
import grabDirNames from "@/src/utils/grab-dir-names";
import recordBotFile from "./record-bot-file";

type Params = {
    bot_id: number | string;
    workspace_id?: number | string | null;
    user_id: number | string;
    media: BUN_SQLITE_COBBLE_MEDIA[];
};

/**
 * Copies the files the user attached to a message into the conversation's
 * folder (`uploads/<yyyy-mm>/<name>`), so they stay searchable after the
 * message scrolls away and a later run can find them. Best effort: a
 * failure is logged, never shown, and the message still goes out.
 */
export default async function storeChatAttachments({
    bot_id,
    workspace_id,
    user_id,
    media,
}: Params) {
    if (!media.length) return;

    const { DATA_DIR } = grabDirNames();
    const folder = `${BotUploadFolder}/${new Date().toISOString().slice(0, 7)}`;

    for (const file of media) {
        try {
            if (!file.media_write_path) continue;

            const source = Bun.file(`${DATA_DIR}/${file.media_write_path}`);

            if (!(await source.exists())) continue;

            /**
             * Its name, made safe and unique enough that a second upload
             * of "invoice.pdf" doesn't overwrite the first.
             */
            const name = safeName({ name: file.title || `file-${file.id}` });

            const saved = await recordBotFile({
                bot_id,
                scope: workspace_id ? "workspace" : "bot",
                owner_id: workspace_id || bot_id,
                path: `${folder}/${name}`,
                data: new Uint8Array(await source.arrayBuffer()),
                purpose: "upload",
                source: "chat-upload",
                media_type: (file.media_type as any) || undefined,
                mime_type: file.mime_type || undefined,
                user_id,
            });

            /**
             * The same text the upload already extracted, so a PDF isn't
             * unpacked a second time.
             */
            if (file.text_content && saved.media_id) {
                await BunSQLite.sql({
                    sql: `UPDATE media SET text_content = ? WHERE id = ?`,
                    values: [file.text_content, saved.media_id],
                }).catch(() => {});
            }

            await enqueueFileIngest({ file_id: saved.id! });
        } catch (error) {
            await logError({
                title: `A chat attachment couldn't be saved to the bot's files`,
                error,
                metadata: { media_id: file.id, bot_id },
            }).catch(() => {});
        }
    }
}

/**
 * A file name that is safe on disk.
 */
function safeName({ name }: { name: string }) {
    const cleaned = name
        .replace(/[<>:"|?*/\\]/g, "-")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 100);

    return cleaned || "file";
}
