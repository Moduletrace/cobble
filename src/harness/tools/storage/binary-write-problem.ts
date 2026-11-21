import { BotImageFileExtensions } from "@/src/dict/bot-file-dict";
import { extensionOf } from "@/src/functions/backend/db/bot-files/media-type-for-file";

/**
 * Extensions that hold bytes rather than text. `write_file` stores what the
 * model passes as it is, so a `.png` path and a truncated `base64` string
 * became a 2.6 KB "image" the user could not open, while the reply said a
 * 1376x768 PNG was attached. SVG stays out: it is text, and a bot can write
 * one by hand.
 */
export const BinaryWriteExtensions = [
    ...BotImageFileExtensions.filter((extension) => extension != "svg"),
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
    "zip",
    "gz",
    "tgz",
    "tar",
    "7z",
    "rar",
    "mp3",
    "wav",
    "m4a",
    "ogg",
    "flac",
    "mp4",
    "mov",
    "mkv",
    "avi",
    "webm",
    "sqlite",
    "db",
    "exe",
    "bin",
    "woff",
    "woff2",
    "ttf",
    "otf",
];

/**
 * Why `write_file` refuses a path, or null when it can save it: a binary
 * extension would turn text into a file that does not open, and the tool
 * that makes the real one is one of the named ones.
 */
export default function binaryWriteProblem({ path }: { path: string }) {
    const extension = extensionOf({ name: path });

    if (!extension || !BinaryWriteExtensions.includes(extension)) return null;

    return `write_file saves text, and ${path} is a binary file (.${extension}): the text would be stored as it is, so the user would get a file that does not open. Make an image with generate_image (or transform_image), a PDF with make_pdf, a video with generate_video, or build the file on a computer and bring it in with import_file.`;
}