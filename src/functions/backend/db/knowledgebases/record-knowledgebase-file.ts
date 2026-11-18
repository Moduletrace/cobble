import uploadAndRecordMedia from "@/src/functions/backend/db/users/media/upload-and-record-media";
import { logError } from "@/src/functions/backend/logger";
import { AppData } from "@/src/data/app-data";
import { BotTextFileExtensions } from "@/src/dict/bot-file-dict";
import AppError from "@/src/utils/app-error";
import attachmentFileKind from "@/src/utils/attachment-file-kind";
import canExtractText from "@/src/utils/can-extract-text";
import recordKnowledgebaseDocument from "./record-knowledgebase-document";

type Params = {
    /**
     * Whoever adds it: the settings page's super admin, or the coordinator
     * adding one for them.
     */
    user_id: number | string;
    knowledgebase_id: number | string;
    name: string;
    data: Buffer;
    /**
     * From the data URL or the file's own row; the name's extension decides
     * when it's empty.
     */
    mime_type?: string;
};

type ProblemParams = {
    name: string;
    mime_type?: string;
    /**
     * Left out when the bytes haven't been read yet (a data URL's type is
     * checked before it's decoded).
     */
    size?: number;
};

/**
 * Why a file can't go into a knowledgebase, or null when it can: no text
 * the extractor reads, nothing in it, or past the document limit. Shared
 * by the settings page's upload and the coordinator's tool, so both refuse
 * the same way.
 */
export function knowledgebaseFileProblem({ name, mime_type, size }: ProblemParams): string | null {
    if (!canExtractText({ name, mime_type })) {
        return `${name} has no text to read. A knowledgebase takes ${BotTextFileExtensions.join(", ")} files.`;
    }

    if (size === undefined) return null;

    if (!size) {
        return `${name} is empty.`;
    }

    if (size > AppData.KnowledgebaseDocumentMaxBytes) {
        return `${name} is too big. Documents can be up to ${Math.round(AppData.KnowledgebaseDocumentMaxBytes / 1024 / 1024)} MB.`;
    }

    return null;
}

/**
 * Stores a file as a knowledgebase document: its bytes in private media,
 * its row, and a queued read. The copy is kept with the app, so the
 * document stays after the computer or the file it came from is gone.
 * Returns the document's id.
 */
export default async function recordKnowledgebaseFile({
    user_id,
    knowledgebase_id,
    name,
    data,
    mime_type,
}: Params) {
    const problem = knowledgebaseFileProblem({ name, mime_type, size: data.length });

    if (problem) throw new AppError(problem);

    const { media_type, ext } = attachmentFileKind({ mime: mime_type, name });

    const media = await uploadAndRecordMedia({
        data,
        media_type,
        media_mime_type: ext,
        media_paradigms: ["knowledgebase-document"],
        media: { title: name },
        extract_media_text_content: true,
        user: { id: Number(user_id) },
    }).catch(async (error) => {
        await logError({ title: `Knowledgebase document ${name} couldn't be saved`, error }).catch(() => {});
        throw new AppError(`Couldn't save ${name}.`);
    });

    if (!media.singleRes?.id) {
        throw new AppError(`Couldn't save ${name}.`);
    }

    return await recordKnowledgebaseDocument({
        user_id,
        knowledgebase_id,
        name,
        source: "file",
        media_id: media.singleRes.id,
        mime_type: mime_type || "",
        size: data.length,
    });
}