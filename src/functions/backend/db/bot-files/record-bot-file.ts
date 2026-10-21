import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_BOT_FILES,
    BUN_SQLITE_COBBLE_MEDIA,
    BunSQLiteTables,
} from "@/db/types/db";
import type { BotFilePurpose, BotFileScope, BotFileSource } from "@/src/dict/bot-file-dict";
import type { MediaType } from "@/src/types";
import grabDirNames from "@/src/utils/grab-dir-names";
import resolveBotPath from "@/src/utils/resolve-bot-path";
import assertStorageRoom from "./assert-storage-room";
import grabStorageDir from "./grab-storage-dir";
import mediaTypeForFile, { mimeTypeForFile } from "./media-type-for-file";

type Params = {
    /**
     * The bot saving it (who `bot_files.bot_id` names).
     */
    bot_id: number | string;
    scope: BotFileScope;
    /**
     * The bot or workspace owning the directory.
     */
    owner_id: number | string;
    /**
     * Path inside the directory, e.g. `reports/q3.md`.
     */
    path: string;
    data: Uint8Array | string;
    purpose?: BotFilePurpose;
    source?: BotFileSource;
    /**
     * Overrides the type read from the name.
     */
    media_type?: MediaType;
    mime_type?: string;
    /**
     * Who the `media` row says uploaded it: the user the run is for.
     */
    user_id?: number | string;
};

/**
 * Saves a file into a storage directory: the bytes on the data volume and
 * the catalog row holding them, as one step. Every writer goes through
 * here (a bot's `write_file`, an upload, a generated image, a PDF), so
 * disk and database never disagree.
 *
 * Writing over an existing path keeps its `bot_files` row and its `media`
 * row, so a message that attached the file now shows the new bytes.
 */
export default async function recordBotFile({
    bot_id,
    scope,
    owner_id,
    path,
    data,
    purpose = "writing",
    source = "bot-write",
    media_type,
    mime_type,
    user_id,
}: Params): Promise<BUN_SQLITE_COBBLE_BOT_FILES> {
    const root = grabStorageDir({ scope, owner_id });
    const resolved = resolveBotPath({ root, path });
    const bytes = typeof data == "string" ? Buffer.from(data, "utf8") : data;
    const media_type_resolved = media_type || mediaTypeForFile({ name: resolved.name, mime_type });
    const mime = mimeTypeForFile({ name: resolved.name, mime_type });
    const { DATA_DIR } = grabDirNames();

    const existing = await grabBotFileRow({ scope, owner_id, path: resolved.relative });
    const previous_size = Number(existing?.size) || 0;

    await assertStorageRoom({
        scope,
        owner_id,
        incoming_bytes: bytes.byteLength - previous_size,
    });

    const absolute = resolved.absolute;
    const write_path = absolute.startsWith(DATA_DIR)
        ? absolute.slice(DATA_DIR.length).replace(/^[\\/]/, "").split("\\").join("/")
        : resolved.relative;

    await Bun.write(absolute, bytes);

    const media_id = existing?.media_id
        ? await updateMediaRow({
              media_id: existing.media_id,
              write_path,
              mime,
              media_type: media_type_resolved,
          })
        : await insertMediaRow({
              write_path,
              mime,
              media_type: media_type_resolved,
              title: resolved.name,
              user_id,
          });

    const now = Date.now();

    if (existing?.id) {
        await BunSQLite.sql({
            sql: `UPDATE bot_files SET media_id = ?, name = ?, folder = ?, mime_type = ?, media_type = ?, size = ?,
                purpose = ?, source = ?, ingested_at = NULL, ingest_error = NULL, updated_at = ? WHERE id = ?`,
            values: [
                media_id,
                resolved.name,
                resolved.folder,
                mime,
                media_type_resolved,
                bytes.byteLength,
                purpose,
                source,
                now,
                existing.id,
            ],
        });

        return {
            ...existing,
            media_id,
            name: resolved.name,
            folder: resolved.folder,
            mime_type: mime,
            media_type: media_type_resolved as any,
            size: bytes.byteLength,
            purpose,
            source,
            ingested_at: undefined,
            ingest_error: undefined,
            updated_at: now,
        };
    }

    const res = await BunSQLite.insert<BUN_SQLITE_COBBLE_BOT_FILES, (typeof BunSQLiteTables)[number]>({
        table: "bot_files",
        data: [
            {
                bot_id: Number(bot_id),
                scope,
                owner_id: Number(owner_id),
                media_id,
                path: resolved.relative,
                name: resolved.name,
                folder: resolved.folder,
                mime_type: mime,
                media_type: media_type_resolved as any,
                size: bytes.byteLength,
                purpose,
                source,
            },
        ],
    });

    const id = res.postInsertReturn?.insertId;

    if (!res.success || !id) {
        throw new Error(`Couldn't record the file: ${res.msg || res.error}`);
    }

    return {
        id,
        bot_id: Number(bot_id),
        scope,
        owner_id: Number(owner_id),
        media_id,
        path: resolved.relative,
        name: resolved.name,
        folder: resolved.folder,
        mime_type: mime,
        media_type: media_type_resolved as any,
        size: bytes.byteLength,
        purpose,
        source,
    };
}

/**
 * The catalog row at a path, if there is one.
 */
export async function grabBotFileRow({
    scope,
    owner_id,
    path,
}: {
    scope: BotFileScope;
    owner_id: number | string;
    path: string;
}) {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_FILES>({
        sql: `SELECT * FROM bot_files WHERE scope = ? AND owner_id = ? AND path = ? LIMIT 1`,
        values: [scope, owner_id, path],
    });

    return res.payload?.[0] || null;
}

async function insertMediaRow({
    write_path,
    mime,
    media_type,
    title,
    user_id,
}: {
    write_path: string;
    mime: string;
    media_type: MediaType;
    title: string;
    user_id?: number | string;
}) {
    const res = await BunSQLite.insert<BUN_SQLITE_COBBLE_MEDIA, (typeof BunSQLiteTables)[number]>({
        table: "media",
        data: [
            {
                user_id: Number(user_id) || 0,
                title,
                media_type: media_type as any,
                media_write_path: write_path,
                mime_type: mime,
                is_private: 1,
            },
        ],
    });

    const id = res.postInsertReturn?.insertId;

    if (!res.success || !id) {
        throw new Error(`Couldn't record the file's bytes: ${res.msg || res.error}`);
    }

    await BunSQLite.insert({
        table: "media_paradigms",
        data: [{ media_id: id, media_paradigm: "bot-file" as any }],
    });

    return id;
}

async function updateMediaRow({
    media_id,
    write_path,
    mime,
    media_type,
}: {
    media_id: number | string;
    write_path: string;
    mime: string;
    media_type: MediaType;
}): Promise<number> {
    await BunSQLite.sql({
        sql: `UPDATE media SET media_write_path = ?, mime_type = ?, media_type = ?, is_rag_ingested = 0, updated_at = ? WHERE id = ?`,
        values: [write_path, mime, media_type, Date.now(), media_id],
    });

    return Number(media_id);
}
