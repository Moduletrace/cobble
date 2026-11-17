import type { ComputerApi } from "@/src/functions/backend/computers/computer-fetch";
import statComputerFile from "@/src/functions/backend/computers/stat-computer-file";
import listBotFiles from "@/src/functions/backend/db/bot-files/list-bot-files";
import { resolveComputerPath, type ComputerRunDirs } from "@/src/utils/computer-work-dirs";
import fileRef from "@/src/utils/file-ref";
import formatBytes from "@/src/utils/format-bytes";
import namedFiles from "@/src/utils/named-files";
import type { StorageScope } from "@/src/utils/storage-access";

type Params = {
    computer: ComputerApi;
    dirs: ComputerRunDirs;
    scopes: StorageScope[];
    /**
     * The user's own request and the brief the bot wrote: both name the
     * files the run is about.
     */
    text: string;
    signal?: AbortSignal;
};

/**
 * Where the files a task brief names actually stand, checked before the run
 * starts: on the computer, or gone but still in the bot's files.
 *
 * App storage is the copy that survives a rebuild, and the computer's
 * workspace is the copy that doesn't, so a source the user gave the bot in
 * chat is on the computer only until the next rebuild. Without this check
 * nothing tells the run that: one looked at its empty folder, concluded the
 * file had to be somewhere, and spent thirty turns probing the container and
 * then the user's own accounts for a copy the app was holding as [file:313]
 * the whole time.
 *
 * Best effort by design: a stat that fails, or a path the run may not touch,
 * says nothing rather than blocking the run. Empty when the brief names no
 * files.
 */
export default async function namedFilesNote({ computer, dirs, scopes, text, signal }: Params): Promise<string> {
    const files = namedFiles({ text });

    if (!files.length) return "";

    const lines: string[] = [];

    for (const file of files) {
        let path: string;

        try {
            path = resolveComputerPath({ path: file.path, dirs });
        } catch {
            continue;
        }

        const stat = await statComputerFile({ computer, path, run_as: dirs.run_as, signal }).catch(() => null);

        /**
         * A computer that stopped answering is not asked again: the rest of
         * the note would be guesses, and the run is better off starting.
         */
        if (!stat) break;

        if (stat.exists) {
            lines.push(`- ${file.path}: there now${stat.type == "directory" ? "" : ` (${formatBytes({ bytes: stat.size })})`}.`);
            continue;
        }

        const saved = await listBotFiles({ scopes, search: file.name, limit: 3 }).catch(() => []);
        const hit = saved.find((row) => (row.name || "").toLowerCase() == file.name.toLowerCase());

        lines.push(
            hit?.id
                ? `- ${file.path}: not on this computer, but you have it in your files as ${fileRef({ id: hit.id })} (${hit.path}): copy it there with export_file and work from that.`
                : `- ${file.path}: not on this computer. It isn't elsewhere on the machine either: don't go looking through the rest of it or through the user's own accounts for it. Ask the user for it, or use the way they named.`,
        );
    }

    if (!lines.length) return "";

    return [
        `# Where the files this brief names stand`,
        `Checked on this computer just now, before you started. A file that isn't there was lost when the computer was rebuilt (only your folders and the browser's logins survive that) or it never arrived, so where it is isn't a question for you to go looking into.`,
        ...lines,
    ].join("\n\n");
}