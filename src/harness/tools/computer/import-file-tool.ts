import { lstatSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import enqueueFileIngest from "@/src/file-ingest/enqueue-file-ingest";
import recordBotFile, { grabBotFileRow } from "@/src/functions/backend/db/bot-files/record-bot-file";
import grabComputerMcpUrl from "@/src/functions/backend/db/computers/grab-computer-mcp-url";
import computerNotReadyMessage from "@/src/utils/computer-not-ready-message";
import folderRef from "@/src/utils/folder-ref";
import type { StorageScope } from "@/src/utils/storage-access";
import type { HarnessTool } from "../../types";
import downloadComputerFile, { shellQuote } from "./download-computer-file";
import runComputerCommand from "./run-computer-command";
import walkRegularFiles from "@/src/utils/walk-regular-files";

type Params = {
    /**
     * The computer the run is on: what it made is in its home.
     */
    computer_id: number | string;
    /**
     * The directories the run may write to (`grabStorageScopes`): the first
     * is where an import lands.
     */
    scopes: StorageScope[];
    bot_id: number | string;
    user_id: number | string;
    onAttach?: (params: { media_id: number; name: string }) => void;
};

type Args = {
    path: string;
    name?: string;
    attach?: boolean;
};

/**
 * Copies what a bot made on its computer into its own files: one file, or
 * a whole folder (taken as a gzipped tar and unpacked into one row per
 * file). The copies are kept with the app, stay after the computer is
 * rebuilt, and are searchable at once; the originals stay on the computer,
 * where the message's folder ref points at the folder holding them.
 *
 * The bytes come back over the sandbox's streaming download endpoint
 * (`downloadComputerFile`), never through its shell, whose output is
 * capped: a `base64` round trip through `/v1/shell/exec` silently cut every
 * import at 30,047 characters.
 */
export default function importFileTool({
    computer_id,
    scopes,
    bot_id,
    user_id,
    onAttach,
}: Params): HarnessTool<Args> {
    const own = scopes[0];
    const max_mb = Math.round(AppData.BotFileImportMaxBytes / (1024 * 1024));

    return {
        name: "import_file",
        description: `Copy a file or folder from this computer into your own files, so it is kept with the app and stays after the computer is rebuilt. Give its path on the computer, e.g. "seo/coderank/raw/crawl.json" or "seo/coderank/raw"; a folder comes in as it is, in one go. Up to ${max_mb} MB. Check with list_files and the computer's own tools what you already imported: importing the same thing twice just writes over the copy, so do it once.${
            own?.scope == "workspace" ? " The copies land in the workspace's shared files." : ""
        } Imports are searchable at once. Name a copy with its [file:ID] ref. Import the report you wrote before the last long steps of a run, so it is never lost to the step limit.`,
        schema: z.object({
            path: z
                .string()
                .min(1)
                .max(AppData.BotFilePathMaxChars)
                .describe(`The file or folder on the computer, relative to its home, e.g. "seo/coderank/raw"`),
            name: z
                .string()
                .max(AppData.BotFilePathMaxChars)
                .optional()
                .describe(`Where to save it in your files, e.g. "reports/coderank-audit.md"`),
            attach: z.boolean().optional().describe(`Also send it to the user with this reply`),
        }),
        run: async ({ args, signal }) => {
            if (!own) return `You have no files folder to import into.`;

            const source = normalizeSourcePath({ path: args.path });

            if (!source) return `Give a path inside the computer's home, e.g. "seo/coderank/raw".`;

            const target = await grabComputerMcpUrl({ computer_id });

            if (!target) return `Computer #${computer_id} has no container to copy from.`;

            if (!target.ready) return computerNotReadyMessage(target);

            const kind = await sourceKind({ base_url: target.base_url, source, signal });

            if (kind == "missing") {
                return `Nothing at ~/${source} on this computer. Check it with search_computers or the computer's own tools before importing.`;
            }

            if (kind == "folder") {
                return importFolder({
                    base_url: target.base_url,
                    source,
                    name: (args.name || source.split("/").pop() || "import").trim(),
                    scope: own,
                    bot_id,
                    user_id,
                    computer_id,
                    signal,
                });
            }

            return importOneFile({
                base_url: target.base_url,
                source,
                name: (args.name || source.split("/").pop() || "import").trim(),
                scope: own,
                bot_id,
                user_id,
                computer_id,
                attach: args.attach,
                onAttach,
                signal,
            });
        },
    };
}

type ImportTarget = {
    base_url: string;
    source: string;
    name: string;
    scope: StorageScope;
    bot_id: number | string;
    user_id: number | string;
    computer_id: number | string;
};

/**
 * Copies one file, then says where both copies are.
 */
async function importOneFile({
    name,
    attach,
    onAttach,
    signal,
    ...target
}: ImportTarget & {
    attach?: boolean;
    onAttach?: Params["onAttach"];
    signal?: AbortSignal;
}) {
    const download = await downloadComputerFile({
        base_url: target.base_url,
        path: `${AppData.ComputerHomeDir}/${target.source}`,
        max_bytes: AppData.BotFileImportMaxBytes,
        signal,
    });

    if (!download.ok) return importFailure({ reason: download.reason, size: download.size, path: target.source });

    const previous = await grabBotFileRow({
        scope: target.scope.scope,
        owner_id: target.scope.owner_id,
        path: name,
    });

    const saved = await recordBotFile({
        bot_id: target.bot_id,
        scope: target.scope.scope,
        owner_id: target.scope.owner_id,
        path: name,
        data: download.bytes,
        purpose: "artifact",
        source: "tool",
        user_id: target.user_id,
    });

    if (saved.id) await enqueueFileIngest({ file_id: saved.id });

    if (attach && saved.media_id) {
        onAttach?.({ media_id: Number(saved.media_id), name: saved.name || name });
    }

    return [
        previous?.id
            ? `You already had ${saved.path} (same ref, no second copy): its bytes are now this file, ${formatSize({ bytes: download.size })} byte for byte.`
            : `Copied ~/${target.source} into your files as ${saved.path} [file:${saved.id}], ${formatSize({ bytes: download.size })} byte for byte.`,
        `The original is still on the computer, in ${folderRef({
            volume: "computer",
            owner_id: target.computer_id,
            path: sourceFolder({ path: target.source }),
        })}`,
        "Name the copy with its [file:ID] ref when you tell the user about it.",
    ].join("\n");
}

/**
 * Copies a folder in as one archive, unpacked into a row per file.
 */
async function importFolder({
    name,
    scope,
    bot_id,
    user_id,
    computer_id,
    signal,
    ...target
}: ImportTarget & { signal?: AbortSignal }) {
    const archive = await readFolderArchive({
        base_url: target.base_url,
        source: target.source,
        signal,
    });

    if (!archive.ok) {
        return importFailure({
            reason: archive.reason,
            size: archive.size,
            path: target.source,
        });
    }

    const saved = await unpackArchive({ archive: archive.bytes, folder: name.replace(/\/+$/, ""), scope, bot_id, user_id });

    if (!saved.length) return `The folder ~/${target.source} is empty, so nothing was imported.`;

    return [
        `Copied ${saved.length} file(s) from ~/${target.source} into your files under ${name}/:`,
        ...saved.slice(0, 20).map((file) => `- ${file.path} [file:${file.id}]`),
        saved.length > 20 ? `(and ${saved.length - 20} more)` : "",
        `The originals are still on the computer, in ${folderRef({
            volume: "computer",
            owner_id: computer_id,
            path: target.source,
        })}`,
        "Name the copies that matter with their [file:ID] refs.",
    ]
        .filter(Boolean)
        .join("\n");
}

/**
 * The folder holding a path, for a folder ref: a ref is always a folder, so
 * a file's ref points at the directory the user can open to see it.
 */
function sourceFolder({ path: source }: { path: string }) {
    const segments = source.split("/").filter(Boolean);

    return segments.slice(0, -1).join("/");
}

/**
 * Whether the path is a file, a folder, or not there at all.
 */
async function sourceKind({
    base_url,
    source,
    signal,
}: {
    base_url: string;
    source: string;
    signal?: AbortSignal;
}): Promise<"file" | "folder" | "missing"> {
    const result = await runComputerCommand({
        base_url,
        command: `d="$HOME"/${shellQuote({ text: source })}; if [ -d "$d" ]; then echo folder; elif [ -f "$d" ]; then echo file; else echo missing; fi`,
        timeout_ms: AppData.ComputerSearchTimeoutMs,
        signal,
    });

    const answer = result.output.trim();

    return answer == "folder" ? "folder" : answer == "file" ? "file" : "missing";
}

/**
 * What a failed import says, so the bot reports it instead of a copy that
 * looks fine and isn't.
 */
function importFailure({
    reason,
    size,
    path: source,
}: {
    reason: "missing" | "too_big" | "cut_short";
    size: number;
    path: string;
}) {
    const limit = formatSize({ bytes: AppData.BotFileImportMaxBytes });

    if (reason == "missing") {
        return `Nothing at ~/${source} on this computer. Check it with search_computers or the computer's own tools before importing.`;
    }

    if (reason == "too_big") {
        return `~/${source} is ${formatSize({ bytes: size })}, over the ${limit} limit, so nothing was copied. Zip it on the computer first, or import the files that matter on their own.`;
    }

    return `The copy of ~/${source} came back with ${formatSize({ bytes: size })} of its bytes, so it was thrown away rather than saved. Try again; if it keeps happening, the file is changing while it is read.`;
}

/**
 * A human size for the tool's answer.
 */
function formatSize({ bytes }: { bytes: number }) {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;

    return `${bytes} B`;
}

/**
 * A folder as a gzipped tar. The tar is built in a temp file on the
 * computer, its size checked there, and then streamed over the download
 * endpoint (never through the shell, whose output is capped), so a folder
 * of any size under the limit arrives whole.
 */
async function readFolderArchive({
    base_url,
    source,
    signal,
}: {
    base_url: string;
    source: string;
    signal?: AbortSignal;
}): Promise<import("./download-computer-file").ComputerDownload> {
    const limit = AppData.BotFileImportMaxBytes;
    const result = await runComputerCommand({
        base_url,
        command: [
            `d="$HOME"/${shellQuote({ text: source })}`,
            `t=$(mktemp /tmp/cobble-import-XXXXXX.tgz)`,
            `tar -czf "$t" -C "$(dirname "$d")" "$(basename "$d")" || { rm -f "$t"; echo FAILED; exit 0; }`,
            `s=$(wc -c < "$t")`,
            `if [ "$s" -gt ${limit} ]; then rm -f "$t"; echo TOO_BIG; exit 0; fi`,
            `echo "PATH:$t"`,
            `echo "SIZE:$s"`,
        ].join("; "),
        timeout_ms: AppData.ComputerSearchTimeoutMs * 4,
        signal,
    });

    const archive_path = result.output.match(/^PATH:(.+)$/m)?.[1]?.trim();
    const size = Number(result.output.match(/^SIZE:(\d+)$/m)?.[1] || 0);

    if (!archive_path) {
        if (result.output.includes("TOO_BIG")) {
            return { ok: false, reason: "too_big", size: AppData.BotFileImportMaxBytes + 1 };
        }

        return { ok: false, reason: "missing", size: 0 };
    }

    try {
        return await downloadComputerFile({ base_url, path: archive_path, max_bytes: limit, signal });
    } finally {
        runComputerCommand({
            base_url,
            command: `rm -f ${shellQuote({ text: archive_path })}`,
            timeout_ms: 30_000,
        }).catch(() => undefined);
    }
}

/**
 * Unpacks an archive into a folder of the run's files, one `bot_files` row
 * per file. The archive's own top folder is dropped and replaced by
 * `folder`, so the tree under it is what the bot asked for.
 */
async function unpackArchive({
    archive,
    folder,
    scope,
    bot_id,
    user_id,
}: {
    archive: Buffer;
    folder: string;
    scope: StorageScope;
    bot_id: number | string;
    user_id: number | string;
}) {
    const dir = mkdtempSync(path.join(tmpdir(), "cobble-import-"));
    const saved: { id: number; path: string }[] = [];

    try {
        const file = path.join(dir, "import.tgz");

        await Bun.write(file, archive);

        const proc = Bun.spawnSync(["tar", "-xzf", file, "-C", dir], {
            stdout: "ignore",
            stderr: "ignore",
        });

        if (proc.exitCode != 0) return saved;

        const base = archiveRoot({ dir });

        for (const entry of walkRegularFiles({ dir: base })) {
            const relative = path.relative(base, entry).split(path.sep).join("/");
            const row = await recordBotFile({
                bot_id,
                scope: scope.scope,
                owner_id: scope.owner_id,
                path: `${folder}/${relative}`,
                data: readFileSync(entry),
                purpose: "artifact",
                source: "tool",
                user_id,
            }).catch(() => null);

            if (!row?.id) continue;

            await enqueueFileIngest({ file_id: row.id }).catch(() => {});

            saved.push({ id: Number(row.id), path: row.path || `${folder}/${relative}` });
        }
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }

    return saved;
}

/**
 * Where the archive's own tree starts: the single folder a tar made from a
 * folder has, else the unpack directory itself.
 */
function archiveRoot({ dir }: { dir: string }) {
    const entries = readdirSync(dir).filter((name) => name != "import.tgz");
    const only = entries.at(0);

    if (entries.length == 1 && only && lstatSync(path.join(dir, only)).isDirectory()) {
        return path.join(dir, only);
    }

    return dir;
}

/**
 * The path the tool was given, made relative to the computer's home and
 * refused if it leaves it.
 */
function normalizeSourcePath({ path: requested }: { path: string }) {
    const clean = requested
        .trim()
        .replace(/^~\/?/, "")
        .replace(/^\/+|\/+$/g, "");

    if (!clean) return null;

    if (clean.split("/").some((segment) => segment == ".." || segment == ".")) return null;

    return clean;
}

