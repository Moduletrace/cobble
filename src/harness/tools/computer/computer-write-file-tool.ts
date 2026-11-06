import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import writeComputerFile from "@/src/functions/backend/computers/write-computer-file";
import { resolveComputerPath } from "@/src/utils/computer-work-dirs";
import type { HarnessTool } from "../../types";
import type { ComputerToolContext } from "./computer-tool-context";

type Args = {
    path: string;
    content: string;
};

/**
 * Writes a whole text file on the run's computer, in the run's folders,
 * creating its folders.
 */
export default function computerWriteFileTool({ computer, dirs }: ComputerToolContext): HarnessTool<Args> {
    return {
        name: "computer_write_file",
        description: `Write a whole text file on this computer (a path in your folders; relative ones start in ${dirs.cwd}), replacing what's there and creating missing folders. To change part of a file, use computer_edit_file.`,
        schema: z.object({
            path: z.string().min(1).max(AppData.BotFilePathMaxChars),
            content: z.string().max(AppData.ComputerWriteFileMaxChars),
        }),
        run: async ({ args, signal }) => {
            const path = resolveComputerPath({ path: args.path, dirs });
            const written = await writeComputerFile({ computer, path, content: args.content, run_as: dirs.run_as, signal });

            return `Wrote ${path} (${written.size} bytes).`;
        },
    };
}
