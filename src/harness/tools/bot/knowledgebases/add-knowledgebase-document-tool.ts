import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import grabBotFileBytesForUser from "@/src/functions/backend/db/bot-files/grab-bot-file-bytes-for-user";
import grabComputerTarget from "@/src/functions/backend/db/computers/grab-computer-target";
import grabUserUploadBytes from "@/src/functions/backend/db/users/media/grab-user-upload-bytes";
import grabKnowledgebase from "@/src/functions/backend/db/knowledgebases/grab-knowledgebase";
import recordKnowledgebaseFile, {
    knowledgebaseFileProblem,
} from "@/src/functions/backend/db/knowledgebases/record-knowledgebase-file";
import saveKnowledgebaseText from "@/src/functions/backend/db/knowledgebases/save-knowledgebase-text";
import downloadComputerFile from "@/src/functions/backend/computers/download-computer-file";
import computerRunDirs, { computerWorkspaceRelative, resolveComputerPath, sshRunDirs } from "@/src/utils/computer-work-dirs";
import ensureSshHome from "@/src/functions/backend/computers/ssh/ensure-ssh-home";
import computerNotReadyMessage from "@/src/utils/computer-not-ready-message";
import formatBytes from "@/src/utils/format-bytes";
import AppError from "@/src/utils/app-error";
import type { HarnessTool } from "../../../types";
import assertSuperAdminRun from "../extensions/assert-super-admin-run";
import resolveKnowledgebaseDocumentSource from "./knowledgebase-document-source";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    workspace_id?: number | string | null;
    /**
     * The computer a task run is on: a path means one of its files unless
     * the call names another.
     */
    computer_id?: number | string | null;
    /**
     * A reply or a task the user follows. A scheduled or hooked run never
     * writes into a knowledgebase: its brief can come from anywhere.
     */
    attended: boolean;
};

type Args = {
    knowledgebase_id: number;
    file_id?: number;
    media_id?: number;
    path?: string;
    computer_id?: number;
    text?: string;
    document_id?: number;
    name?: string;
};

/**
 * Puts a document into a knowledgebase: a saved file, an upload, a file on
 * a computer, or text. Whichever it is, the app keeps its own copy and
 * reads it in the background, so the document survives the computer being
 * rebuilt and the file it came from being deleted.
 */
export default function addKnowledgebaseDocumentTool({
    user_id,
    bot_id,
    workspace_id,
    computer_id,
    attended,
}: Params): HarnessTool<Args> {
    const max_mb = Math.round(AppData.KnowledgebaseDocumentMaxBytes / 1024 / 1024);

    return {
        name: "add_knowledgebase_document",
        description: `Add a document to a knowledgebase (or rewrite a text one with document_id). Give exactly one source:
- file_id: a file in the bot's own files (list_files), e.g. a download or a report.
- media_id: a file the user uploaded to this chat (an attachment is listed as "name", media id 42).
- path: a file on a computer, relative to the run's folder; computer_id picks which computer (a task run's own computer when left out).
- text: written here (markdown, up to ${AppData.KnowledgebaseTextMaxChars} characters).
Files up to ${max_mb} MB whose text can be read (PDF, DOCX, markdown, text, CSV, JSON, HTML, XML, YAML, logs) are copied into the app and read in the background; list_knowledgebases with the knowledgebase_id shows when it's searchable. Add one only when the super admin asked for it.`,
        schema: z.object({
            knowledgebase_id: z.number().int().positive(),
            file_id: z.number().int().positive().optional().describe(`A saved file's id (list_files)`),
            media_id: z.number().int().positive().optional().describe(`An upload's media id, as the message lists it`),
            path: z.string().min(1).max(AppData.BotFilePathMaxChars).optional().describe(`A file on a computer`),
            computer_id: z.number().int().positive().optional().describe(`Which computer path is on`),
            text: z
                .string()
                .trim()
                .min(1)
                .max(AppData.KnowledgebaseTextMaxChars)
                .optional()
                .describe(`The document written here`),
            document_id: z.number().int().positive().optional().describe(`The text document to rewrite`),
            name: z.string().trim().min(1).max(200).optional().describe(`Its title; the file's own name by default`),
        }),
        run: async ({ args, signal }) => {
            await assertSuperAdminRun({ user_id });

            if (!attended) {
                throw new AppError(`Knowledgebases are only filled in a reply or a task the user follows, not in a scheduled or hooked run.`);
            }

            const knowledgebase = await grabKnowledgebase({ knowledgebase_id: args.knowledgebase_id });
            const resolved = resolveKnowledgebaseDocumentSource({ args });

            if ("problem" in resolved) throw new AppError(resolved.problem);

            if (resolved.source == "text") {
                const name = args.name || `Note ${new Date().toISOString().slice(0, 10)}`;

                const document_id = await saveKnowledgebaseText({
                    user_id,
                    data: {
                        knowledgebase_id: knowledgebase.id,
                        document_id: args.document_id,
                        name,
                        content: args.text || "",
                    },
                });

                return added({ knowledgebase_id: knowledgebase.id, name, document_id });
            }

            const saved =
                resolved.source == "file"
                    ? await savedFileBytes({ args, user_id })
                    : resolved.source == "media"
                      ? await uploadBytes({ args, user_id })
                      : await computerBytes({ args, bot_id, user_id, workspace_id, computer_id, signal });

            const problem = knowledgebaseFileProblem({
                name: saved.name,
                mime_type: saved.mime_type,
                size: saved.data.length,
            });

            if (problem) throw new AppError(problem);

            const document_id = await recordKnowledgebaseFile({
                user_id,
                knowledgebase_id: knowledgebase.id,
                name: args.name || saved.name,
                data: saved.data,
                mime_type: saved.mime_type,
            });

            return added({ knowledgebase_id: knowledgebase.id, name: args.name || saved.name, document_id });
        },
    };
}

/**
 * A saved file's bytes, and what to call it.
 */
async function savedFileBytes({ args, user_id }: { args: Args; user_id: number | string }) {
    if (!args.file_id) throw new AppError(`Give file_id.`);

    const saved = await grabBotFileBytesForUser({ file_id: args.file_id, user_id });

    if (!saved) throw new AppError(`There's no saved file #${args.file_id} you reach. list_files shows them.`);

    return {
        name: saved.file.name || saved.file.path?.split("/").pop() || "file",
        mime_type: saved.media.mime_type || "",
        data: saved.data,
    };
}

/**
 * An upload's bytes, which must be the user's own.
 */
async function uploadBytes({ args, user_id }: { args: Args; user_id: number | string }) {
    if (!args.media_id) throw new AppError(`Give media_id.`);

    const uploaded = await grabUserUploadBytes({ media_id: args.media_id, user_id });

    if (!uploaded) throw new AppError(`There's no upload #${args.media_id} of this user's. The message lists its media id.`);

    return {
        name: uploaded.media.title || `upload ${args.media_id}`,
        mime_type: uploaded.media.mime_type || "",
        data: uploaded.data,
    };
}

/**
 * A file on a computer, streamed by its agent (never through a shell,
 * which cuts big output), inside the run's folders only.
 */
async function computerBytes({
    args,
    bot_id,
    user_id,
    workspace_id,
    computer_id,
    signal,
}: {
    args: Args;
    bot_id: number | string;
    user_id: number | string;
    workspace_id?: number | string | null;
    computer_id?: number | string | null;
    signal?: AbortSignal;
}) {
    const target_id = args.computer_id || computer_id;

    if (!target_id) throw new AppError(`Give computer_id: a reply doesn't work on a computer, so it has to name one.`);

    const computer = await grabComputerTarget({ computer_id: target_id });

    if (!computer) throw new AppError(`Computer #${target_id} doesn't exist.`);

    if (!computer.ready) throw new AppError(computerNotReadyMessage(computer));

    const dirs = computer.connection === "ssh"
        ? sshRunDirs({ home: await ensureSshHome({ computer, signal }), bot_id, user_id })
        : computerRunDirs({ bot_id, bot_kind: "coordinator", user_id, workspace_id });

    const shown = resolveComputerPath({ path: args.path, dirs });
    const filePath = computer.connection === "ssh"
        ? shown
        : `${AppData.ComputerWorkspaceDir}/${computerWorkspaceRelative({ absolute: shown, dirs })}`;

    const download = await downloadComputerFile({
        computer,
        path: filePath,
        max_bytes: AppData.KnowledgebaseDocumentMaxBytes,
        run_as: dirs.run_as,
        signal,
    });

    if (!download.ok) {
        if (download.reason == "too_big") {
            throw new AppError(
                `${args.path} is ${formatBytes({ bytes: download.size })}, over the ${Math.round(
                    AppData.KnowledgebaseDocumentMaxBytes / 1024 / 1024,
                )} MB a document can be.`,
            );
        }

        if (download.reason == "cut_short") {
            throw new AppError(`${args.path} changed while it was being read. Try again once it's finished.`);
        }

        throw new AppError(`Nothing at ${shown} on computer #${target_id}.`);
    }

    return {
        name: shown.split("/").pop() || "file",
        mime_type: "",
        data: download.bytes,
    };
}

/**
 * What the bot is told after a document is added.
 */
function added({ knowledgebase_id, name, document_id }: { knowledgebase_id: number; name: string; document_id: number }) {
    return `Added ${name} as document #${document_id} to knowledgebase #${knowledgebase_id}. It's read in the background: list_knowledgebases with the knowledgebase_id says when it's searchable, and this run's own search won't find it until a later reply.`;
}