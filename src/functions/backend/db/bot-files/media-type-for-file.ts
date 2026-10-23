import type { MediaType } from "@/src/types";
import { BotImageFileExtensions } from "@/src/dict/bot-file-dict";
import extensionOf from "@/src/utils/extension-of";

type Params = {
    /**
     * A file name or an extension, e.g. `report.pdf` or `pdf`.
     */
    name?: string | null;
    mime_type?: string | null;
};

const AudioExtensions = ["mp3", "wav", "m4a", "ogg", "flac", "webm"];
const VideoExtensions = ["mp4", "mov", "mkv", "avi"];

/**
 * What a file's `media_type` is, from its extension (else its MIME type):
 * an image, a document, audio or video.
 */
export default function mediaTypeForFile({ name, mime_type }: Params): MediaType {
    const ext = extensionOf({ name, mime_type });

    if (ext && BotImageFileExtensions.includes(ext)) return "image";
    if (ext && AudioExtensions.includes(ext)) return "audio";
    if (ext && VideoExtensions.includes(ext)) return "video";

    return "document";
}

/**
 * Its extension, lower case, without the dot. Shared, so the storage
 * catalog and the text extractor read a name the same way.
 */
export { extensionOf };

/**
 * A MIME type for the row, from the extension when there isn't one.
 */
export function mimeTypeForFile({ name, mime_type }: Params) {
    if (mime_type && mime_type != "application/octet-stream") return mime_type;

    const ext = extensionOf({ name });

    return (ext && MediaTypesByExtension[ext]) || "application/octet-stream";
}

/**
 * The types worth knowing, so nothing has to guess (SNIFFING a file for
 * this would mean reading it twice).
 */
const MediaTypesByExtension: Record<string, string> = {
    txt: "text/plain",
    text: "text/plain",
    log: "text/plain",
    md: "text/markdown",
    markdown: "text/markdown",
    csv: "text/csv",
    tsv: "text/tab-separated-values",
    json: "application/json",
    html: "text/html",
    htm: "text/html",
    xml: "application/xml",
    yml: "application/yaml",
    yaml: "application/yaml",
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    doc: "application/msword",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
    bmp: "image/bmp",
    svg: "image/svg+xml",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    m4a: "audio/mp4",
    ogg: "audio/ogg",
    flac: "audio/flac",
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
    zip: "application/zip",
};
