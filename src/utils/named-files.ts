import { AppData } from "@/src/data/app-data";

/**
 * Extensions a brief names a file by. A token without a `/` only counts as
 * a file when it ends in one of these, so "node.js" or "v1.2" in a brief
 * don't send a run looking for a file that was never meant.
 */
const NamedFileExtensions = new Set([
    "png",
    "jpg",
    "jpeg",
    "gif",
    "webp",
    "svg",
    "heic",
    "tif",
    "tiff",
    "avif",
    "psd",
    "ai",
    "eps",
    "indd",
    "sketch",
    "fig",
    "pdf",
    "csv",
    "tsv",
    "xlsx",
    "xls",
    "ods",
    "docx",
    "doc",
    "odt",
    "pptx",
    "ppt",
    "key",
    "md",
    "txt",
    "rtf",
    "json",
    "xml",
    "yaml",
    "yml",
    "zip",
    "tar",
    "gz",
    "7z",
    "mp3",
    "wav",
    "m4a",
    "mp4",
    "mov",
    "webm",
    "avi",
    "mkv",
    "epub",
    "sql",
    "db",
    "ipynb",
]);

/**
 * A path-ish token with an extension, e.g. `uploads/2026-11/summit.png`.
 * Punctuation is not part of it, so a match never keeps the comma or the
 * bracket around it.
 */
const NamedFileToken = /[A-Za-z0-9_][A-Za-z0-9_.\-/]*\.[A-Za-z0-9]{2,5}/g;

export type NamedFile = {
    /**
     * As the brief wrote it: `uploads/2026-11/summit-canva-v1.png`.
     */
    path: string;
    /**
     * Its last segment: `summit-canva-v1.png`.
     */
    name: string;
};

type Params = {
    /**
     * What the user asked for and the brief the bot wrote: both name the
     * files the run is about.
     */
    text: string;
    limit?: number;
};

/**
 * The files a brief names, in the order it names them, deduped.
 *
 * A run that needs a source which a rebuild took off its computer otherwise
 * has nothing to go on but the name in its brief, and one went looking for
 * it across the container and then the user's own accounts. Checking those
 * names against the computer, and against the bot's files, starts the run
 * with the answer (`namedFilesNote`).
 *
 * Deliberately conservative: a token counts as a file when it has a folder
 * in it or a known file extension, so prose ("node.js", "v1.2", "e.g")
 * stays out of it. A URL is not a file on the computer either, so its path
 * (the part after the host) is dropped.
 */
export default function namedFiles({ text, limit = AppData.NamedFilesMax }: Params): NamedFile[] {
    if (!text.trim()) return [];

    const found: NamedFile[] = [];
    const seen = new Set<string>();

    for (const match of text.matchAll(NamedFileToken)) {
        const token = match[0];

        if (found.length >= limit) break;
        /**
         * `https://host/a.png` leaves `host/a.png`, since the regex has no
         * `:`: a URL is not a file on this computer.
         */
        if (text[match.index - 1] == "/" || /^[a-z0-9-]+\.[a-z]{2,4}\//i.test(token)) continue;
        /**
         * A path ending in a folder is not a file; only the last segment's
         * extension counts.
         */
        const name = token.split("/").pop() || "";
        const ext = name.split(".").pop()?.toLowerCase() || "";

        if (!name.includes(".") || !ext) continue;
        if (!token.includes("/") && !NamedFileExtensions.has(ext)) continue;

        const key = token.toLowerCase();

        if (seen.has(key)) continue;

        seen.add(key);
        found.push({ path: token, name });
    }

    return found;
}