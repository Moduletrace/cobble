import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import downloadComputerFile from "@/src/functions/backend/computers/download-computer-file";
import { resolveComputerPath } from "@/src/utils/computer-work-dirs";
import type { HarnessTool } from "../../types";
import type { ComputerToolContext } from "./computer-tool-context";

type Args = {
    path: string;
    offset?: number;
    limit?: number;
};

/**
 * Images a model takes as they are, by their first bytes.
 */
const ImageSignatures: { type: string; test: (bytes: Buffer) => boolean }[] = [
    { type: "image/png", test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
    { type: "image/jpeg", test: (b) => b[0] == 0xff && b[1] == 0xd8 && b[2] == 0xff },
    { type: "image/gif", test: (b) => b.subarray(0, 4).toString("latin1") == "GIF8" },
    { type: "image/webp", test: (b) => b.subarray(0, 4).toString("latin1") == "RIFF" && b.subarray(8, 12).toString("latin1") == "WEBP" },
];

/**
 * Reads a file on the run's computer: text as numbered lines, a window at
 * a time, and a PNG, JPEG, GIF or WebP image for the bot to look at.
 * Inside the run's folders only; secret values are redacted.
 */
export default function computerReadFileTool({ computer, dirs, redact }: ComputerToolContext): HarnessTool<Args> {
    const lines_max = AppData.ComputerReadFileMaxLines;

    return {
        name: "computer_read_file",
        description: `Read a file on this computer (a path in your folders; relative ones start in ${dirs.cwd}). Text comes back as numbered lines, ${lines_max} at a time: pass offset (the first line, from 1) and limit for another part. PNG, JPEG, GIF and WebP images come back for you to look at. For anything else (PDFs, archives), use computer_bash, or import_file it into your files.`,
        schema: z.object({
            path: z.string().min(1).max(AppData.BotFilePathMaxChars),
            offset: z.number().int().min(1).optional(),
            limit: z.number().int().min(1).max(lines_max).optional(),
        }),
        run: async ({ args, signal }) => {
            const path = resolveComputerPath({ path: args.path, dirs });
            const download = await downloadComputerFile({
                computer,
                path,
                max_bytes: AppData.ComputerReadFileMaxBytes,
                run_as: dirs.run_as,
                signal,
            });

            if (!download.ok) {
                return download.reason == "missing"
                    ? `There's no file at ${path}.`
                    : download.reason == "too_big"
                      ? `${path} is ${download.size} bytes, over the ${AppData.ComputerReadFileMaxBytes} this reads. Look at part of it with computer_bash (head, sed -n, grep).`
                      : `${path} changed while it was read. Try again.`;
            }

            const image = ImageSignatures.find((signature) => signature.test(download.bytes));

            if (image) {
                return {
                    text: `${path} (${image.type}, ${download.size} bytes)\n\n[Image: shown after the tool results]`,
                    images: [{ url: `data:${image.type};base64,${download.bytes.toString("base64")}`, redact }],
                };
            }

            if (download.bytes.subarray(0, 8000).includes(0)) {
                return `${path} is a binary file (${download.size} bytes). Use computer_bash to look into it (file, xxd, unzip -l ...).`;
            }

            const lines = download.bytes.toString("utf8").split("\n");

            if (lines[lines.length - 1] == "") lines.pop();

            const start = (args.offset || 1) - 1;
            const shown = lines.slice(start, start + (args.limit || lines_max));
            const end = start + shown.length;
            const width = String(end).length;
            const body = shown
                .map((line, index) => {
                    const cut = line.length > AppData.ComputerReadFileMaxLineChars;

                    return `${String(start + index + 1).padStart(width)}\t${cut ? `${line.slice(0, AppData.ComputerReadFileMaxLineChars)} [line cut]` : line}`;
                })
                .join("\n");

            return [
                `${path} (${lines.length} lines)`,
                redact(body) || "(empty)",
                end < lines.length ? `[Lines ${start + 1}-${end} of ${lines.length}. Pass offset ${end + 1} for more.]` : "",
            ]
                .filter(Boolean)
                .join("\n\n");
        },
    };
}
