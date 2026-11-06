import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import downloadComputerFile from "@/src/functions/backend/computers/download-computer-file";
import writeComputerFile from "@/src/functions/backend/computers/write-computer-file";
import { resolveComputerPath } from "@/src/utils/computer-work-dirs";
import type { HarnessTool } from "../../types";
import type { ComputerToolContext } from "./computer-tool-context";
import replaceInText from "./replace-in-text";

type Args = {
    path: string;
    old_text: string;
    new_text: string;
    replace_all?: boolean;
};

/**
 * Replaces exact text in a file on the run's computer: once, where it
 * appears exactly once, or everywhere with `replace_all`.
 */
export default function computerEditFileTool({ computer, dirs }: ComputerToolContext): HarnessTool<Args> {
    return {
        name: "computer_edit_file",
        description: `Change part of a text file on this computer: old_text (copied exactly, with its whitespace) becomes new_text. It must appear exactly once, unless replace_all is true; include more of the lines around it to make it unique.`,
        schema: z.object({
            path: z.string().min(1).max(AppData.BotFilePathMaxChars),
            old_text: z.string().min(1),
            new_text: z.string(),
            replace_all: z.boolean().optional(),
        }),
        run: async ({ args, signal }) => {
            const path = resolveComputerPath({ path: args.path, dirs });
            const download = await downloadComputerFile({
                computer,
                path,
                max_bytes: AppData.ComputerWriteFileMaxChars,
                run_as: dirs.run_as,
                signal,
            });

            if (!download.ok) {
                return download.reason == "missing"
                    ? `There's no file at ${path}.`
                    : download.reason == "too_big"
                      ? `${path} is too big to edit this way; use computer_bash (sed, python).`
                      : `${path} changed while it was read. Try again.`;
            }

            const edit = replaceInText({
                text: download.bytes.toString("utf8"),
                old_text: args.old_text,
                new_text: args.new_text,
                replace_all: Boolean(args.replace_all),
            });

            if (!edit.ok) {
                return edit.count == 0
                    ? `old_text isn't in ${path}. Read the file again and copy the text exactly.`
                    : `old_text is in ${path} ${edit.count} times. Include more of the lines around it, or pass replace_all.`;
            }

            await writeComputerFile({ computer, path, content: edit.text, run_as: dirs.run_as, signal });

            return `Edited ${path} (${edit.count} replacement${edit.count == 1 ? "" : "s"}).`;
        },
    };
}
