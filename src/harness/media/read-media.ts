import fileToText from "@/src/functions/backend/db/users/media/file-to-text";
import AppError from "@/src/utils/app-error";
import transcribeAudio from "../audio/transcribe-audio";
import readImage from "./read-image";

type Params = {
    data: Uint8Array;
    /**
     * e.g. `image/png`, `audio/webm`, `application/pdf`.
     */
    media_type: string;
    /**
     * File name, used for its extension when the type is vague.
     */
    name?: string;
    signal?: AbortSignal;
    /**
     * Reads with this bot's models when it has its own.
     */
    bot_id?: number | string;
    /**
     * The workspace the call is in: its models win over the bot's.
     */
    workspace_id?: number | string | null;
};

const DocumentExtensions = ["pdf", "docx", "txt", "md", "csv", "json", "html", "xml", "yaml", "yml"];

const TypeExtensions: Record<string, string> = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "docx",
    "text/plain": "txt",
    "text/markdown": "md",
    "text/csv": "csv",
    "application/json": "json",
};

/**
 * Reads any attachment into text for the text harness: documents are
 * extracted on this machine, images go to the media reading harness and
 * audio to the transcription harness.
 */
export default async function readMedia({
    data,
    media_type,
    name,
    signal,
    bot_id,
    workspace_id,
}: Params): Promise<string> {
    const type = media_type.toLowerCase().split(";")[0]!.trim();
    const ext = (
        name?.includes(".")
            ? name.split(".").pop()
            : TypeExtensions[type] || type.split("/").pop()
    )?.toLowerCase() || "";

    if (type.startsWith("image/")) {
        return await readImage({
            url: `data:${type};base64,${Buffer.from(data).toString("base64")}`,
            signal,
            bot_id,
            workspace_id,
        });
    }

    if (type.startsWith("audio/")) {
        return await transcribeAudio({
            audio: { data, format: audioFormat({ type, ext }) },
            signal,
            bot_id,
            workspace_id,
        });
    }

    if (type.startsWith("text/") || DocumentExtensions.includes(ext)) {
        const text = await fileToText({
            file_stream: Buffer.from(data),
            file_type: ext,
        });

        if (!text?.trim()) {
            throw new AppError(
                ext == "pdf"
                    ? `This PDF has no text in it (it may be a scan). Send its pages as images instead.`
                    : `This file has no text in it.`,
            );
        }

        return text;
    }

    throw new AppError(`Bots can't read ${ext ? `.${ext}` : "this kind of"} files yet.`);
}

function audioFormat({ type, ext }: { type: string; ext: string }) {
    if (type.includes("mpeg") || ext == "mp3") return "mp3";
    if (type.includes("mp4") || ext == "m4a") return "m4a";
    if (type.includes("wav")) return "wav";
    if (type.includes("ogg")) return "ogg";
    if (type.includes("flac")) return "flac";
    return ext || "webm";
}
