import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import writeComputerFile from "@/src/functions/backend/computers/write-computer-file";
import statComputerFile from "@/src/functions/backend/computers/stat-computer-file";
import { resolveComputerPath } from "@/src/utils/computer-work-dirs";
import type { HarnessTool } from "../../types";
import type { ComputerToolContext } from "./computer-tool-context";
import computerWorkspaceRoomError from "./computer-workspace-room";

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
            const incoming = Buffer.byteLength(args.content, "utf8");
            /**
             * A rewrite only adds what it grows by (M7): counting the whole
             * new content refused a same-size or shrinking rewrite near the
             * limit, blocking the very cleanup that frees space. Stat what's
             * there; a missing file (or a stat that fails) counts the whole
             * write, as a new file does.
             */
            const existing = await statComputerFile({ computer, path, run_as: dirs.run_as, signal }).catch(() => null);
            const existing_bytes = existing?.exists && existing.type == "file" ? existing.size : 0;
            const too_big = await computerWorkspaceRoomError({
                computer,
                dirs,
                incoming_bytes: Math.max(0, incoming - existing_bytes),
                signal,
            });

            if (too_big) return too_big;

            const written = await writeComputerFile({ computer, path, content: args.content, run_as: dirs.run_as, signal });

            return `Wrote ${path} (${written.size} bytes).`;
        },
    };
}
