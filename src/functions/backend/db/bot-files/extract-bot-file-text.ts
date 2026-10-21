import { AppData } from "@/src/data/app-data";
import {
    BotImageFileExtensions,
    BotTextFileExtensions,
} from "@/src/dict/bot-file-dict";
import grabDirNames from "@/src/utils/grab-dir-names";
import fileToText from "../users/media/file-to-text";
import { extensionOf } from "./media-type-for-file";

type Params = {
    /**
     * The `media` row's write path (relative to `DATA_DIR`).
     */
    write_path?: string | null;
    /**
     * Its text, when a previous upload already extracted it.
     */
    text_content?: string | null;
    name?: string | null;
    mime_type?: string | null;
    /**
     * Read images and audio too, through the media harness. Off by
     * default: only a bot asking for it pays for that.
     */
    read_media?: boolean;
};

/**
 * A file's text, for chunking: documents unpacked locally (PDF, DOCX,
 * plain text, markdown, CSV, JSON, HTML), images and audio only when
 * `read_media` is set. Null when the file has no text to read.
 */
export default async function extractBotFileText({
    write_path,
    text_content,
    name,
    mime_type,
    read_media,
}: Params): Promise<string | null> {
    if (text_content?.trim()) return text_content.trim();

    if (!write_path) return null;

    const ext = extensionOf({ name, mime_type });

    if (!ext) return null;

    const { DATA_DIR } = grabDirNames();
    const file_path = `${DATA_DIR}/${write_path}`;

    if ((BotTextFileExtensions as readonly string[]).includes(ext)) {
        /**
         * Markdown, CSV and the other plain text types read as they are:
         * no unpacking needed, and no size limit spent on it.
         */
        if (!["pdf", "docx"].includes(ext)) {
            const file = Bun.file(file_path);

            if (file.size > AppData.IngestMaxBytes) return null;

            return await file.text();
        }

        const file = Bun.file(file_path);

        if (file.size > AppData.IngestMaxBytes) return null;

        return (await fileToText({ file_path })) || null;
    }

    if (read_media) {
        const file = Bun.file(file_path);

        if (file.size > AppData.IngestMaxBytes) return null;

        const { default: readMedia } = await import("@/src/harness/media/read-media");
        const media_type = (BotImageFileExtensions as readonly string[]).includes(ext)
            ? `image/${ext == "jpg" ? "jpeg" : ext}`
            : mime_type || "audio/mpeg";

        return await readMedia({
            data: new Uint8Array(await file.arrayBuffer()),
            media_type,
            name: name || undefined,
        })
            .then((text) => text?.trim() || null)
            .catch(() => null);
    }

    return null;
}
